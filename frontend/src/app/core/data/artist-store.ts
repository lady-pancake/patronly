import { Injectable, computed, effect, signal } from '@angular/core';
import { artistById } from './catalog';
import type { Artist } from './models';
import { SEED_DRAFT, type StudioDraft, buildStudio } from './studio-draft';

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
}

const DEFAULTS: Persisted = {
  draft: SEED_DRAFT,
  live: null,
  previewing: false,
  account: { bank: 'Millennium BCP', holder: 'Alex Ward', iban: 'PT50 0033 0000 4521 9876 4410 5' },
  replied: [],
  reminded: [],
};

function load(): Persisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<Persisted>;
    return { ...DEFAULTS, ...saved, draft: { ...SEED_DRAFT, ...saved.draft } };
  } catch {
    return DEFAULTS;
  }
}

/**
 * The signed-in artist's studio: the draft being edited, the published
 * version, and dashboard settings. Kept in this browser tab's session
 * storage only: nothing is saved on the server.
 */
@Injectable({ providedIn: 'root' })
export class ArtistStore {
  private readonly initial = load();

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
    effect(() => {
      const state: Persisted = {
        draft: this.draft(),
        live: this.live(),
        previewing: this.previewing(),
        account: this.account(),
        replied: this.replied(),
        reminded: this.reminded(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Large uploads can go over the storage quota; the session keeps working in memory.
      }
    });
  }

  /** Looks up any studio, including the artist's own ("me"). */
  byId(id: string | null | undefined): Artist | undefined {
    return id === 'me' ? this.mine() : artistById(id);
  }

  update(patch: Partial<StudioDraft>): void {
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
