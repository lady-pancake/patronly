import { Injectable, computed, effect, signal } from '@angular/core';
import { INBOX_SEED } from './inbox-seed';
import type { Inquiry, SavedSearch, Thread, ThreadStatus } from './models';
import { LISTED } from './catalog';
import { FEED, RECENT_SEARCHES, SAMPLE_THREADS } from './seed';

/** The newest posts count as new until the patron opens the feed. */
const NEW_POSTS = FEED.slice(0, 3).map((p) => p.title);

export const PATRON_STORAGE_KEY = 'patronly.patron.v1';
const STORAGE_KEY = PATRON_STORAGE_KEY;

interface Persisted {
  favs: string[];
  saved: SavedSearch[];
  hiddenRecent: string[];
  /** Each search's checked artists, by search name, once the patron changes them. */
  lists: Record<string, string[]>;
  /** Artists whose newsletter the patron subscribed to. */
  newsletters: string[];
  /** Posts the patron has already seen in the feed, by title. */
  seenPosts: string[];
  threads: Thread[];
  /** Inquiries patrons sent to the demo artist's studio. */
  inbox: Thread[];
}

const DEFAULTS: Persisted = {
  // Artists in a saved search start out saved too.
  favs: [...new Set([...RECENT_SEARCHES.flatMap((s) => s.ids), 'clem'])],
  saved: [],
  hiddenRecent: [],
  lists: {},
  newsletters: [],
  seenPosts: [],
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
  readonly lists = signal<Record<string, string[]>>(this.initial.lists);
  readonly newsletters = signal<string[]>(this.initial.newsletters);
  readonly seenPosts = signal<string[]>(this.initial.seenPosts);
  readonly threads = signal<Thread[]>(this.initial.threads);
  readonly inbox = signal<Thread[]>(this.initial.inbox);

  /**
   * Saved searches first, then the sample recent ones the patron hasn't removed.
   * Sample searches whose artists are all hidden from listings are left out.
   * Each search's `ids` is its list of bookmarked artists, which can be empty.
   */
  readonly searches = computed(() =>
    [
      ...this.saved(),
      ...RECENT_SEARCHES.filter(
        (s) =>
          !this.saved().some((x) => x.name === s.name) &&
          s.ids.some((id) => LISTED.some((a) => a.id === id)),
      ),
    ]
      .filter((s) => !this.hiddenRecent().includes(s.name))
      .map((s) => {
        const list = this.lists()[s.name];
        return list ? { ...s, ids: list } : s;
      }),
  );

  /** Titles of new posts the patron hasn't seen in the feed yet. */
  readonly newPosts = computed(() => NEW_POSTS.filter((t) => !this.seenPosts().includes(t)));

  readonly unreadCount = computed(() => this.threads().filter((t) => t.unread).length);
  readonly unreadIncoming = computed(() => this.inbox().filter((t) => t.unread).length);

  constructor() {
    effect(() => {
      const state: Persisted = {
        favs: this.favs(),
        saved: this.saved(),
        hiddenRecent: this.hiddenRecent(),
        lists: this.lists(),
        newsletters: this.newsletters(),
        seenPosts: this.seenPosts(),
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

  isSubscribed(id: string): boolean {
    return this.newsletters().includes(id);
  }

  toggleNewsletter(id: string): void {
    this.newsletters.update((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));
  }

  isNewPost(title: string): boolean {
    return this.newPosts().includes(title);
  }

  /** Clears the new flags, once the patron has opened the feed. */
  markFeedSeen(): void {
    this.seenPosts.update((s) => [...new Set([...s, ...NEW_POSTS])]);
  }

  /** The checked artists of a search, or null if there's no search by that name. */
  searchList(name: string): string[] | null {
    return this.searches().find((s) => s.name === name)?.ids ?? null;
  }

  /** Checks or unchecks an artist in one search's list. Separate from favourites. */
  toggleInSearch(name: string, artistId: string): void {
    const list = this.searchList(name);
    if (!list) return;
    const next = list.includes(artistId)
      ? list.filter((id) => id !== artistId)
      : [...list, artistId];
    this.lists.update((l) => ({ ...l, [name]: next }));
  }

  saveSearch(search: SavedSearch): void {
    this.saved.update((s) => [search, ...s.filter((x) => x.name !== search.name)]);
  }

  removeSearch(name: string): void {
    this.lists.update(({ [name]: _, ...rest }) => rest);
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
