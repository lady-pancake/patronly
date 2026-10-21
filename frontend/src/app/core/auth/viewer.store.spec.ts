import { TestBed } from '@angular/core/testing';
import { Router, type UrlTree } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GraphQLService } from '../graphql.service';
import { entitled } from './guards';
import { GuestSession } from './guest-session';
import { SKIP_GATE, type Viewer, ViewerStore } from './viewer.store';

const GUEST: Viewer = {
  id: 'g1',
  name: 'ana',
  roles: [
    { role: 'PATRON', entitlements: ['MESSAGE', 'SAVE_FAVOURITES', 'SEND_INQUIRIES'] },
    {
      role: 'ARTIST',
      entitlements: [
        'MANAGE_STUDIO',
        'MESSAGE',
        'SAVE_FAVOURITES',
        'SEND_INQUIRIES',
        'VIEW_DASHBOARD',
      ],
    },
  ],
};

function setup(me: Viewer | null, token: string | null = me ? 'pass' : null, skipGate = false) {
  sessionStorage.clear();
  if (token) sessionStorage.setItem('patronly.guestPass', token);
  const query = vi.fn((q: string, vars?: Record<string, unknown>) => {
    if (q.includes('query Me')) return of({ me });
    if (q.includes('roleActions')) return of({ roleActions: GUEST.roles });
    if (q.includes('startVisit') && vars?.['password'] === 'right') {
      return of({ startVisit: { token: 'new-pass', viewer: GUEST } });
    }
    return throwError(() => new Error("That password isn't right."));
  });
  TestBed.configureTestingModule({
    providers: [
      { provide: GraphQLService, useValue: { query } },
      { provide: SKIP_GATE, useValue: skipGate },
    ],
  });
  return { store: TestBed.inject(ViewerStore), query };
}

describe('ViewerStore', () => {
  it('answers can() from the actions the API sent for the current view', async () => {
    const { store } = setup(GUEST);
    await store.whenLoaded();
    expect(store.can('SAVE_FAVOURITES')).toBe(true);
    expect(store.can('VIEW_DASHBOARD')).toBe(false);
    store.role.set('artist');
    expect(store.can('VIEW_DASHBOARD')).toBe(true);
    expect(store.initial()).toBe('A');
  });

  it('can do nothing without a guest pass, and does not ask the API', async () => {
    const { store, query } = setup(null);
    expect(await store.whenLoaded()).toBeNull();
    expect(store.can('MESSAGE')).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  it('skips the gate in local development, until you sign out', async () => {
    const { store } = setup(null, null, true);
    const v = await store.whenLoaded();
    expect(v?.name).toBe('Local dev');
    store.role.set('artist');
    expect(store.can('VIEW_DASHBOARD')).toBe(true);
    store.signOut();
    expect(await store.refresh()).toBeNull();
  });

  it('drops a pass the API no longer accepts', async () => {
    const { store } = setup(null, 'old-pass');
    expect(await store.whenLoaded()).toBeNull();
    expect(TestBed.inject(GuestSession).token()).toBeNull();
  });

  it('stores the pass after the password gate', async () => {
    const { store } = setup(null);
    await expect(store.startVisit('ana', 'wrong')).rejects.toThrow("That password isn't right.");
    expect(store.signedIn()).toBe(false);
    await store.startVisit('ana', 'right');
    expect(store.signedIn()).toBe(true);
    expect(sessionStorage.getItem('patronly.guestPass')).toBe('new-pass');
  });
});

describe('entitled guard', () => {
  const run = (e: Parameters<typeof entitled>[0]) =>
    TestBed.runInInjectionContext(() =>
      entitled(e)({} as never, { url: '/dashboard' } as never),
    ) as Promise<boolean | UrlTree>;

  it('sends visitors without a pass to the gate, then back', async () => {
    setup(null);
    const result = (await run('VIEW_DASHBOARD')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?next=%2Fdashboard');
  });

  it('sends a view without the action home', async () => {
    setup(GUEST);
    const result = (await run('VIEW_DASHBOARD')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/');
  });

  it('lets a view with the action in', async () => {
    setup(GUEST);
    TestBed.inject(ViewerStore).role.set('artist');
    expect(await run('VIEW_DASHBOARD')).toBe(true);
  });
});
