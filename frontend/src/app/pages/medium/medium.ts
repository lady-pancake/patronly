import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { LISTED, mediumArt } from '../../core/data/catalog';
import type { Availability } from '../../core/data/models';
import { MEDIUMS } from '../../core/data/seed';
import { ArtistCard } from '../../shared/artist-card';
import { BackLink } from '../../shared/back-link';
import { FilterChips } from '../../shared/filter-chips';

const AVAIL: Record<string, Availability> = {
  'Taking commissions': 'Open',
  'Waitlist open': 'Waitlist',
  'Not taking': 'Closed',
};

@Component({
  selector: 'app-medium',
  imports: [BackLink, FilterChips, ArtistCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-6 pb-24 sm:px-8">
      <app-back-link to="/mediums">All mediums</app-back-link>
      <header class="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
        <div class="aspect-square rounded-2xl" [style.background]="art()"></div>
        <h1 class="font-serif text-3xl leading-none font-normal tracking-[-.01em]">
          <em>{{ medium().name }}</em>
        </h1>
      </header>
      <div class="flex flex-wrap items-end justify-between gap-6 border-b pb-6">
        <div class="flex flex-col gap-2.5">
          <span class="text-[13px] font-semibold">Availability</span>
          <app-filter-chips [options]="availOptions" [(value)]="avail" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-[13px] font-semibold">Starting price</span>
          <app-filter-chips [options]="priceOptions" [(value)]="price" />
        </div>
        <div class="flex flex-col gap-2.5">
          <span class="text-[13px] font-semibold">Sort by</span>
          <app-filter-chips [options]="sortOptions" [(value)]="sort" />
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <span class="text-[13px] text-muted-foreground">Showing {{ artists().length }}</span>
        @if (!artists().length) {
          <p class="font-serif text-2xl text-muted-foreground italic">
            No artists match these filters yet.
          </p>
        }
        <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-10">
          @for (a of artists(); track a.id) {
            <app-artist-card [artist]="a" variant="full" />
          }
        </div>
      </div>
    </main>
  `,
})
export class Medium {
  /** Route param, e.g. "painting". */
  readonly name = input.required<string>();

  protected readonly availOptions = ['Any', 'Taking commissions', 'Waitlist open', 'Not taking'];
  protected readonly priceOptions = ['Any', 'Under $1k', '$1k–$5k', '$5k+'];
  protected readonly sortOptions = ['Most saved', 'Most commissions', 'Price: low to high'];

  protected readonly avail = signal<string | null>('Any');
  protected readonly price = signal<string | null>('Any');
  protected readonly sort = signal<string | null>('Most saved');

  protected readonly medium = computed(
    () => MEDIUMS.find((m) => m.name.toLowerCase() === this.name().toLowerCase()) ?? MEDIUMS[0],
  );
  protected readonly art = computed(
    () => `url('${mediumArt(this.medium().name)}') center/112% no-repeat`,
  );

  protected readonly artists = computed(() => {
    const pf = this.price(),
      af = this.avail(),
      sb = this.sort();
    const list = LISTED.filter(
      (a) =>
        a.medium === this.medium().name &&
        (pf === 'Any' ||
          (pf === 'Under $1k' && a.min < 1000) ||
          (pf === '$1k–$5k' && a.min >= 1000 && a.min < 5000) ||
          (pf === '$5k+' && a.max >= 5000)) &&
        (af === 'Any' || a.availability === AVAIL[af ?? '']),
    );
    return [...list].sort((x, y) =>
      sb === 'Price: low to high'
        ? x.min - y.min
        : sb === 'Most commissions'
          ? y.commissions - x.commissions
          : y.likes - x.likes,
    );
  });
}
