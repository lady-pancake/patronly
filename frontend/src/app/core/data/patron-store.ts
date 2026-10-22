import { Injectable, computed, effect, signal } from '@angular/core';
import { INBOX_SEED } from './inbox-seed';
import type { Inquiry, SavedSearch, Thread, ThreadStatus } from './models';
import { LISTED } from './catalog';
import { RECENT_SEARCHES, SAMPLE_THREADS } from './seed';

export const PATRON_STORAGE_KEY = 'patronly.patron.v1';
const STORAGE_KEY = PATRON_STORAGE_KEY;

interface Persisted {
  favs: string[];
  saved: SavedSearch[];
  hiddenRecent: string[];
  /** Artists the patron took out of a search, by search name. */
  dropped: Record<string, string[]>;
  threads: Thread[];
  /** Inquiries patrons sent to the demo artist's studio. */
  inbox: Thread[];
}

const DEFAULTS: Persisted = {
  favs: ['june', 'clem'],
  saved: [],
  hiddenRecent: [],
  dropped: {},
  threads: SAMPLE_THREADS,
  inbox: INBOX_SEED,
};

function load(): Persisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/**
 * The guest's favourites, saved searches and conversations: the ones they
 * started as a patron (`threads`) and the ones patrons started with their
 * studio (`inbox`).
 * Kept in this browser tab's session storage only: nothing is saved on the server.
 */
@Injectable({ providedIn: 'root' })
export class PatronStore {
  private readonly initial = load();

  readonly favs = signal<string[]>(this.initial.favs);
  readonly saved = signal<SavedSearch[]>(this.initial.saved);
  readonly hiddenRecent = signal<string[]>(this.initial.hiddenRecent);
  readonly dropped = signal<Record<string, string[]>>(this.initial.dropped);
  readonly threads = signal<Thread[]>(this.initial.threads);
  readonly inbox = signal<Thread[]>(this.initial.inbox);

  /**
   * Saved searches first, then the sample recent ones the patron hasn't removed.
   * Searches whose matches are all hidden from listings are left out, and
   * artists the patron unsaved from a search are taken off its list.
   */
  readonly searches = computed(() =>
    [...this.saved(), ...RECENT_SEARCHES]
      .filter(
        (s) =>
          !this.hiddenRecent().includes(s.name) &&
          s.ids.some((id) => LISTED.some((a) => a.id === id)),
      )
      .map((s) => {
        const dropped = this.dropped()[s.name];
        return dropped?.length ? { ...s, ids: s.ids.filter((id) => !dropped.includes(id)) } : s;
      }),
  );

  readonly unreadCount = computed(() => this.threads().filter((t) => t.unread).length);
  readonly unreadIncoming = computed(() => this.inbox().filter((t) => t.unread).length);

  constructor() {
    effect(() => {
      const state: Persisted = {
        favs: this.favs(),
        saved: this.saved(),
        hiddenRecent: this.hiddenRecent(),
        dropped: this.dropped(),
        threads: this.threads(),
        inbox: this.inbox(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage can be unavailable (private mode); the app still works in memory.
      }
    });
  }

  isFav(id: string): boolean {
    return this.favs().includes(id);
  }

  toggleFav(id: string): void {
    this.favs.update((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  /** Takes an artist off one search's list, e.g. after they were unsaved from it. */
  dropFromSearch(name: string, artistId: string): void {
    this.dropped.update((d) => ({ ...d, [name]: [...(d[name] ?? []), artistId] }));
  }

  saveSearch(search: SavedSearch): void {
    this.dropped.update(({ [search.name]: _, ...rest }) => rest);
    this.saved.update((s) => [search, ...s.filter((x) => x.name !== search.name)]);
  }

  removeSearch(name: string): void {
    if (this.saved().some((s) => s.name === name)) {
      this.saved.update((s) => s.filter((x) => x.name !== name));
    } else {
      this.hiddenRecent.update((h) => [...h, name]);
    }
  }

  /** Starts a conversation with an artist and returns its id. */
  sendInquiry(artistId: string, inq: Omit<Inquiry, 'date'>): string {
    const id = `t-${Date.now()}`;
    const thread: Thread = {
      id,
      artistId,
      status: 'Awaiting reply',
      updated: 'Today',
      unread: false,
      inq: { ...inq, date: 'Today' },
      msgs: [],
    };
    this.threads.update((t) => [thread, ...t]);
    return id;
  }

  /** Applies a change to one conversation, whichever list it is in. */
  private patch(id: string, fn: (t: Thread) => Thread): void {
    const apply = (ts: Thread[]) =>
      ts.some((t) => t.id === id) ? ts.map((t) => (t.id === id ? fn(t) : t)) : ts;
    this.threads.update(apply);
    this.inbox.update(apply);
  }

  markRead(id: string): void {
    this.patch(id, (t) => ({ ...t, unread: false }));
  }

  setStatus(id: string, status: ThreadStatus): void {
    this.patch(id, (t) => ({ ...t, status, updated: 'Today' }));
  }

  sendMessage(id: string, text: string): void {
    const now = new Date();
    const time =
      now.toLocaleString('en-US', { month: 'short', day: 'numeric' }) +
      ', ' +
      now.toTimeString().slice(0, 5);
    this.patch(id, (t) => ({
      ...t,
      updated: 'Today',
      msgs: [...t.msgs, { me: true, text, time }],
    }));
  }

  updateContract(id: string, patch: { signed?: boolean; paid?: boolean }): void {
    this.patch(id, (t) => ({ ...t, contract: { ...t.contract, ...patch } }));
  }
}
