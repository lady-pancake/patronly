import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LISTED, artistById } from '../../core/data/catalog';
import type { Artist } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { ArtistCard } from '../../shared/artist-card';
import { SearchCard } from '../../shared/search-card';

@Component({
  selector: 'app-saved',
  imports: [ArtistCard, SearchCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved.html',
})
export class Saved {
  protected readonly store = inject(PatronStore);
  protected readonly favorites = computed(() =>
    this.store
      .favs()
      .map((id) => artistById(id))
      .filter((a): a is Artist => !!a && LISTED.includes(a)),
  );
}
