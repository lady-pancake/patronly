import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideTrash2 } from '@ng-icons/lucide';
import { LISTED, artistById, searchChips } from '../core/data/catalog';
import type { Artist, SavedSearch } from '../core/data/models';
import { PatronStore } from '../core/data/patron-store';
import { ArtistCard } from './artist-card';
import { Tag } from './tag';
import { WorkPreview } from './work-preview';
import { searchQueryParams } from './search-params';

/** A saved or recent search with its top matches. */
@Component({
  selector: 'app-search-card',
  imports: [RouterLink, NgIcon, ArtistCard, Tag, WorkPreview],
  providers: [provideIcons({ lucideArrowRight, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-4 rounded-4xl bg-card p-6',
    '[class]':
      "layout() === 'home' ? 'shadow-[0_2px_8px_oklch(0_0_0/.05)] ring-1 ring-black/6' : 'ring-1 ring-black/5'",
  },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <a
        routerLink="/search"
        [queryParams]="params()"
        class="text-left font-serif text-[26px] hover:opacity-70"
        >{{ search().name }}</a
      >
      <div class="flex gap-1.5">
        <a
          routerLink="/search"
          [queryParams]="params()"
          class="flex h-8 items-center gap-1 rounded-md pr-3 pl-3.5 text-xs font-semibold hover:bg-border"
          >Open search <ng-icon name="lucideArrowRight" size="13"
        /></a>
        <button
          type="button"
          (click)="remove()"
          title="Delete saved search"
          aria-label="Delete saved search"
          class="grid size-8 place-items-center rounded-full border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ng-icon name="lucideTrash2" size="14" />
        </button>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      @for (c of chips(); track c) {
        <span appTag>{{ c }}</span>
      }
    </div>
    @if (layout() === 'home') {
      <div class="grid gap-5 sm:grid-cols-3">
        @for (a of artists(); track a.id) {
          <app-artist-card [artist]="a" />
        }
      </div>
    } @else {
      <div class="grid grid-cols-2 gap-5">
        @for (a of artists().slice(0, 2); track a.id) {
          <a [routerLink]="['/artists', a.id]" class="lift flex flex-col gap-2.5">
            <app-work-preview [artist]="a" class="aspect-[16/10]" />
            <span class="font-serif text-[19px]">{{ a.name }}</span>
          </a>
        }
      </div>
    }
  `,
})
export class SearchCard {
  private readonly store = inject(PatronStore);
  readonly search = input.required<SavedSearch>();
  readonly layout = input<'home' | 'saved'>('home');

  protected readonly chips = computed(() => searchChips(this.search().wiz));
  protected readonly params = computed(() =>
    searchQueryParams(this.search().wiz, this.search().name),
  );
  protected readonly artists = computed(() =>
    this.search()
      .ids.map((id) => artistById(id))
      .filter((a): a is Artist => !!a && LISTED.includes(a)),
  );

  protected remove() {
    this.store.removeSearch(this.search().name);
  }
}
