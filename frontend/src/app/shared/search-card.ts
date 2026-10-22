import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideTrash2 } from '@ng-icons/lucide';
import { LISTED, artistById, searchChips } from '../core/data/catalog';
import type { Artist, SavedSearch } from '../core/data/models';
import { PatronStore } from '../core/data/patron-store';
import { ArtistCard } from './artist-card';
import { Tag } from './tag';
import { searchQueryParams } from './search-params';

/** A saved or recent search with its top matches. */
@Component({
  selector: 'app-search-card',
  imports: [RouterLink, NgIcon, ArtistCard, Tag],
  providers: [provideIcons({ lucideArrowRight, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex flex-col gap-4 rounded-4xl bg-card p-6 shadow-[0_2px_8px_oklch(0_0_0/.05)] ring-1 ring-black/6',
  },
  templateUrl: './search-card.html',
})
export class SearchCard {
  private readonly store = inject(PatronStore);
  readonly search = input.required<SavedSearch>();

  protected readonly chips = computed(() => searchChips(this.search().wiz));
  protected readonly params = computed(() =>
    searchQueryParams(this.search().wiz, this.search().name),
  );
  protected readonly artists = computed(() =>
    this.search()
      .ids.map((id) => artistById(id))
      .filter((a): a is Artist => !!a && LISTED.includes(a)),
  );

  protected drop(artistId: string) {
    this.store.dropFromSearch(this.search().name, artistId);
  }

  protected remove() {
    this.store.removeSearch(this.search().name);
  }
}
