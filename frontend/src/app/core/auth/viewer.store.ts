import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQLService } from '../graphql.service';
import { GuestSession } from './guest-session';

export type Role = 'patron' | 'artist';
export type Entitlement =
  'SAVE_FAVOURITES' | 'SEND_INQUIRIES' | 'MESSAGE' | 'MANAGE_STUDIO' | 'VIEW_DASHBOARD';

export interface RoleActions {
  role: 'PATRON' | 'ARTIST';
  entitlements: Entitlement[];
}

export interface Viewer {
  id: string;
  name: string;
  roles: RoleActions[];
}

const VIEWER_FIELDS = 'id name roles { role entitlements }';
export const ME_QUERY = `query Me { me { ${VIEWER_FIELDS} } }`;
export const START_VISIT = `mutation StartVisit($name: String!, $password: String!) {
  startVisit(name: $name, password: $password) { token viewer { ${VIEWER_FIELDS} } }
}`;

const ROLE_KEY = 'patronly.view';

function readRole(): Role {
  try {
    return sessionStorage.getItem(ROLE_KEY) === 'artist' ? 'artist' : 'patron';
  } catch {
    return 'patron';
  }
}

/**
 * The guest using the app: their name, the view they picked (patron or artist),
 * and the actions the API says that view allows. Pages and buttons ask `can()`
 * for an action; they never look at the role.
 */
@Injectable({ providedIn: 'root' })
export class ViewerStore {
  private readonly session = inject(GuestSession);
  private readonly gql = inject(GraphQLService);

  private readonly _viewer = signal<Viewer | null>(null);
  private readonly _loaded = signal(false);
  private loading?: Promise<Viewer | null>;

  readonly viewer = this._viewer.asReadonly();
  /** True once we know whether there is a guest. */
  readonly loaded = this._loaded.asReadonly();
  readonly signedIn = computed(() => this._viewer() !== null);
  readonly role = signal<Role>(readRole());
  readonly initial = computed(() => (this._viewer()?.name || '?').charAt(0).toUpperCase());

  /** The actions the current view allows, as sent by the API. */
  readonly actions = computed<ReadonlySet<Entitlement>>(() => {
    const role = this.role().toUpperCase();
    const found = this._viewer()?.roles.find((r) => r.role === role);
    return new Set(found?.entitlements ?? []);
  });

  constructor() {
    effect(() => {
      try {
        sessionStorage.setItem(ROLE_KEY, this.role());
      } catch {
        // The view resets on reload without storage.
      }
    });
  }

  can(entitlement: Entitlement): boolean {
    return this.actions().has(entitlement);
  }

  /** Checks the stored guest pass with the API. No pass (or API down) gives null. */
  refresh(): Promise<Viewer | null> {
    this.loading = (async () => {
      let viewer: Viewer | null = null;
      if (this.session.token()) {
        try {
          viewer = (await firstValueFrom(this.gql.query<{ me: Viewer | null }>(ME_QUERY))).me;
        } catch (err) {
          console.warn('Patronly: couldn’t check your guest pass.', err);
        }
        if (!viewer) this.session.set(null);
      }
      this._viewer.set(viewer);
      this._loaded.set(true);
      return viewer;
    })();
    return this.loading;
  }

  /** Resolves once the first check has finished. */
  whenLoaded(): Promise<Viewer | null> {
    if (this._loaded()) return Promise.resolve(this._viewer());
    return this.loading ?? this.refresh();
  }

  /** Passes the password gate. The API logs the visit and returns a guest pass. */
  async startVisit(name: string, password: string): Promise<Viewer> {
    const res = await firstValueFrom(
      this.gql.query<{ startVisit: { token: string; viewer: Viewer } }>(START_VISIT, {
        name,
        password,
      }),
    );
    this.session.set(res.startVisit.token);
    this._viewer.set(res.startVisit.viewer);
    this._loaded.set(true);
    return res.startVisit.viewer;
  }

  signOut(): void {
    this.session.set(null);
    this._viewer.set(null);
  }
}
