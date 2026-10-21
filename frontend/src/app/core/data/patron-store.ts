import { Injectable, computed, effect, signal } from '@angular/core';
import type { Inquiry, SavedSearch, Thread } from './models';
import { LISTED } from './catalog';
import { RECENT_SEARCHES, SAMPLE_THREADS } from './seed';

const STORAGE_KEY = 'patronly.patron.v1';

export type Role = 'patron' | 'artist';

interface Persisted {
  role: Role;
  favs: string[];
  saved: SavedSearch[];
  hiddenRecent: string[];
  threads: Thread[];
}

const DEFAULTS: Persisted = {
  role: 'patron',
  favs: ['maren', 'june'],
  saved: [],
  hiddenRecent: [],
  threads: SAMPLE_THREADS,
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/**
 * The signed-in patron's state: favourites, saved searches and conversations.
 * Kept in the browser for now; this is the seam where API calls will go.
 */
@Injectable({ providedIn: 'root' })
export class PatronStore {
  private readonly initial = load();

  readonly role = signal<Role>(this.initial.role);
  readonly favs = signal<string[]>(this.initial.favs);
  readonly saved = signal<SavedSearch[]>(this.initial.saved);
  readonly hiddenRecent = signal<string[]>(this.initial.hiddenRecent);
  readonly threads = signal<Thread[]>(this.initial.threads);

  /**
   * Saved searches first, then the sample recent ones the patron hasn't removed.
   * Searches whose matches are all hidden from listings are left out.
   */
  readonly searches = computed(() =>
    [...this.saved(), ...RECENT_SEARCHES].filter(
      (s) =>
        !this.hiddenRecent().includes(s.name) &&
        s.ids.some((id) => LISTED.some((a) => a.id === id)),
    ),
  );

  readonly unreadCount = computed(() => this.threads().filter((t) => t.unread).length);

  constructor() {
    effect(() => {
      const state: Persisted = {
        role: this.role(),
        favs: this.favs(),
        saved: this.saved(),
        hiddenRecent: this.hiddenRecent(),
        threads: this.threads(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  saveSearch(search: SavedSearch): void {
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

  markRead(id: string): void {
    this.threads.update((ts) => ts.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }

  sendMessage(id: string, text: string): void {
    const now = new Date();
    const time =
      now.toLocaleString('en-US', { month: 'short', day: 'numeric' }) +
      ', ' +
      now.toTimeString().slice(0, 5);
    this.threads.update((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, updated: 'Today', msgs: [...t.msgs, { me: true, text, time }] } : t,
      ),
    );
  }

  updateContract(id: string, patch: { signed?: boolean; paid?: boolean }): void {
    this.threads.update((ts) =>
      ts.map((t) => (t.id === id ? { ...t, contract: { ...t.contract, ...patch } } : t)),
    );
  }
}
