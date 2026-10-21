import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphQLService } from '../graphql.service';
import { artistById } from './catalog';
import type { Artist } from './models';
import { BLANK_DRAFT, type StudioDraft, buildStudio } from './studio-draft';

const STORAGE_KEY = 'patronly.artist.v1';

export interface PayoutAccount {
  bank: string;
  holder: string;
  iban: string;
}

interface Persisted {
  draft: StudioDraft;
  /** The version patrons see, once the studio has been made public. */
  live: StudioDraft | null;
  previewing: boolean;
  account: PayoutAccount;
  replied: string[];
  reminded: string[];
  /** False until the guest changes the studio; until then the sample from the database is used. */
  edited: boolean;
}

const DEFAULTS: Persisted = {
  draft: BLANK_DRAFT,
  live: null,
  previewing: false,
  account: { bank: '', holder: '', iban: '' },
  replied: [],
  reminded: [],
  edited: false,
};

export const STUDIO_TEMPLATE_QUERY = `query StudioTemplate { studioTemplate { draft account } }`;

/** What this tab saved earlier, or null on a fresh visit. */
function load(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Persisted>;
    return { ...DEFAULTS, ...saved, draft: { ...BLANK_DRAFT, ...saved.draft } };
  } catch {
    return null;
  }
}

/**
 * The signed-in artist's studio: the draft being edited, the published
 * version, and dashboard settings. Kept in this browser tab's session
 * storage only: nothing is saved on the server.
 */
@Injectable({ providedIn: 'root' })
export class ArtistStore {
  private readonly gql = inject(GraphQLService);
  private readonly initial = load() ?? DEFAULTS;
  /** True once the guest has changed anything, so the sample never overwrites their edits. */
  private readonly edited = signal(this.initial.edited);

  readonly draft = signal<StudioDraft>(this.initial.draft);
  readonly live = signal<StudioDraft | null>(this.initial.live);
  readonly previewing = signal(this.initial.previewing);
  readonly account = signal<PayoutAccount>(this.initial.account);
  readonly replied = signal<string[]>(this.initial.replied);
  readonly reminded = signal<string[]>(this.initial.reminded);

  readonly published = computed(() => this.live() !== null);

  /** The studio page for "me": the draft while previewing, otherwise what is live. */
  readonly mine = computed<Artist>(() =>
    buildStudio(this.previewing() ? this.draft() : (this.live() ?? this.draft())),
  );

  constructor() {
    // Until the guest edits it, the studio is the sample stored in the database.
    if (!this.edited()) void this.loadTemplate();
    effect(() => {
      const state: Persisted = {
        draft: this.draft(),
        live: this.live(),
        previewing: this.previewing(),
        account: this.account(),
        replied: this.replied(),
        reminded: this.reminded(),
        edited: this.edited(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Large uploads can go over the storage quota; the session keeps working in memory.
      }
    });
  }

  private async loadTemplate(): Promise<void> {
    try {
      const { studioTemplate: t } = await firstValueFrom(
        this.gql.query<{
          studioTemplate: { draft: Partial<StudioDraft>; account: Partial<PayoutAccount> } | null;
        }>(STUDIO_TEMPLATE_QUERY),
      );
      if (!t || this.edited()) return;
      this.draft.set({ ...BLANK_DRAFT, ...t.draft });
      this.account.update((a) => ({ ...a, ...t.account }));
    } catch (err) {
      console.warn('Patronly: couldn’t load the sample studio, starting blank.', err);
    }
  }

  /** Looks up any studio, including the artist's own ("me"). */
  byId(id: string | null | undefined): Artist | undefined {
    return id === 'me' ? this.mine() : artistById(id);
  }

  update(patch: Partial<StudioDraft>): void {
    this.edited.set(true);
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  startPreview(): void {
    this.previewing.set(true);
  }

  /** Makes the current draft the public studio. */
  publish(): void {
    this.live.set(structuredClone(this.draft()));
    this.previewing.set(false);
  }

  markReplied(name: string): void {
    this.replied.update((r) => (r.includes(name) ? r : [...r, name]));
  }

  remind(name: string): void {
    this.reminded.update((r) => (r.includes(name) ? r : [...r, name]));
  }
}
