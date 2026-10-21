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
  templateUrl: './home.html',
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
