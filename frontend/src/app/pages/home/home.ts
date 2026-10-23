import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { artistById } from '../../core/data/catalog';
import { feedEntries } from '../../core/data/feed';
import type { Artist, SavedSearch } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { MEDIUMS } from '../../core/data/seed';
import { MediumTile } from '../../shared/medium-tile';
import { SearchCard } from '../../shared/search-card';
import { searchQueryParams } from '../../shared/search-params';
import { FEATURED_IDS } from '../featured/featured-content';
import { Avatar } from '../../shared/avatar';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgIcon, SearchCard, MediumTile, Avatar],
  providers: [provideIcons({ lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  protected readonly store = inject(PatronStore);
  protected readonly mediums = MEDIUMS;
  // Skip any artist the live catalogue doesn't have, rather than failing the page.
  protected readonly featured = FEATURED_IDS.map((id) => artistById(id)).filter(
    (a): a is Artist => !!a,
  );
  protected readonly feed = feedEntries().slice(0, 3);

  protected searchParams(s: SavedSearch) {
    return searchQueryParams(s.wiz, s.name);
  }

  protected featuredBg(id: string) {
    return `#EEE8DD url('/images/featured/${id}.jpg') center/cover no-repeat`;
  }
}
