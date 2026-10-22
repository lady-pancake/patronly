import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucidePlus } from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import type { Artist } from '../core/data/models';
import { AvailabilityBadge, PriceBadge } from './availability-badge';
import { HeartButton } from './heart-button';
import { WorkPreview } from './work-preview';

/**
 * Artist tile used across browse screens.
 * - compact: role · city and price (home, recent searches)
 * - full: studio · city, price and availability (medium, search results)
 * - boxed: white card with role · price (saved favourites)
 */
@Component({
  selector: 'app-artist-card',
  imports: [RouterLink, NgIcon, WorkPreview, HeartButton, PriceBadge, AvailabilityBadge],
  providers: [provideIcons({ lucideCheck, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  templateUrl: './artist-card.html',
})
export class ArtistCard {
  readonly artist = input.required<Artist>();
  readonly variant = input<'compact' | 'full' | 'boxed'>('compact');
  /**
   * When set, shows a check button for adding the artist to a search's list:
   * true when they're on it. Separate from the heart (favourites).
   */
  readonly checked = input<boolean | null>(null);
  readonly checkToggle = output<void>();
}
