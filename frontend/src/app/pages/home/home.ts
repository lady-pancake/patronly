import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { artistById, tone } from '../../core/data/catalog';
import type { Artist } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { FEED, MEDIUMS } from '../../core/data/seed';
import { MediumTile } from '../../shared/medium-tile';
import { SearchCard } from '../../shared/search-card';
import { FEATURED_IDS } from '../featured/featured-content';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgIcon, SearchCard, MediumTile],
  providers: [provideIcons({ lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto flex max-w-[1400px] flex-col gap-12 px-4 pt-14 pb-24 sm:px-8">
      <h1
        class="mx-auto max-w-[900px] text-center font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] font-normal tracking-[-.025em]"
      >
        Meet the artist. <em>Commission</em> the work.
      </h1>

      <section
        class="grid items-center gap-12 rounded-4xl bg-surface p-6 ring-1 ring-black/4 sm:p-12 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2.4fr)]"
      >
        <div class="flex flex-col items-start gap-4">
          <div class="eyebrow">Featured artists · October 2026</div>
          <h2 class="font-serif text-5xl leading-none font-normal tracking-[-.02em]">
            The <em>slow</em> season
          </h2>
          <p class="text-[15px] leading-relaxed text-muted-foreground">
            Four painters working slowly in oil, ink and watercolour, each taking a small number of
            commissions this season.
          </p>
          <div class="text-[13px]">Curated by <span class="font-semibold">Adaeze Clarke</span></div>
          <a
            routerLink="/featured"
            class="mt-2 flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium hover:bg-muted"
            >See more</a
          >
        </div>
        <div class="grid grid-cols-2 gap-5 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          @for (a of featured; track a.id) {
            <a
              [routerLink]="['/artists', a.id]"
              class="flex flex-col gap-3 transition-transform duration-200 ease-soft hover:-translate-y-1"
            >
              <div
                class="aspect-square w-full rounded-3xl"
                [style.background]="featuredBg(a.id)"
              ></div>
              <div>
                <div class="font-serif text-[22px] leading-tight">{{ a.name }}</div>
                <div class="text-[13px] text-muted-foreground">{{ a.role }} · {{ a.city }}</div>
              </div>
            </a>
          }
        </div>
      </section>

      <section class="flex min-w-0 flex-col gap-5">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="font-serif text-4xl font-normal tracking-[-.01em]">
            Browse by <em>medium</em>
          </h2>
          <a
            routerLink="/mediums"
            class="flex h-9 shrink-0 items-center gap-1.5 rounded-md border bg-background px-4 text-[13px] font-medium hover:bg-muted"
            >See all {{ mediums.length }}<ng-icon name="lucideArrowRight" size="14"
          /></a>
        </div>
        <div
          class="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pt-1 pb-3"
        >
          @for (m of mediums.slice(0, 10); track m.name) {
            <app-medium-tile [name]="m.name" class="w-[120px] shrink-0 snap-start" />
          }
        </div>
      </section>

      <section class="grid items-start gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div class="flex flex-col gap-10">
          <div class="eyebrow">Recent searches</div>
          @for (s of store.searches(); track s.name) {
            <app-search-card [search]="s" layout="home" />
          } @empty {
            <p class="font-serif text-[22px] text-muted-foreground italic">
              Nothing here yet.
              <a routerLink="/search" class="underline underline-offset-4">Start a new search</a>
              and it will show up here.
            </p>
          }
        </div>

        <section
          aria-labelledby="feed-title"
          class="flex flex-col gap-5 rounded-4xl bg-surface p-7 ring-1 ring-black/4"
        >
          <h2 id="feed-title" class="eyebrow">From the studios</h2>
          @for (p of feed; track p.title) {
            <article
              class="flex flex-col gap-3.5 rounded-3xl bg-card p-5 shadow-[0_1px_3px_oklch(0_0_0/.06)] ring-1 ring-black/4"
            >
              <div class="flex items-center justify-between gap-3">
                <a [routerLink]="['/artists', p.artist.id]" class="flex items-center gap-2.5">
                  <span
                    class="size-8 shrink-0 rounded-full"
                    [style.background]="p.artist.bg"
                  ></span>
                  <span class="text-sm font-semibold">{{ p.artist.name }}</span>
                </a>
                <span class="text-xs text-muted-foreground">{{ p.date }}</span>
              </div>
              <div class="aspect-[16/10] rounded-2xl" [style.background]="p.img"></div>
              <h3 class="font-serif text-xl leading-tight font-normal">{{ p.title }}</h3>
              <p class="text-[13px] leading-relaxed text-muted-foreground">{{ p.text }}</p>
            </article>
          }
        </section>
      </section>
    </main>
  `,
})
export class Home {
  protected readonly store = inject(PatronStore);
  protected readonly mediums = MEDIUMS;
  protected readonly featured = FEATURED_IDS.map((id) => artistById(id) as Artist);
  protected readonly feed = FEED.map((p) => {
    const artist = artistById(p.id) as Artist;
    const base = tone(artist.hue, p.l, artist.c);
    return { ...p, artist, img: p.src ? `${base} url('${p.src}') center/cover no-repeat` : base };
  });

  protected featuredBg(id: string) {
    return `#EEE8DD url('/images/featured/${id}.jpg') center/cover no-repeat`;
  }
}
