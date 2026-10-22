import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  imports: [RouterLink, WorkPreview, HeartButton, PriceBadge, AvailabilityBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  templateUrl: './artist-card.html',
})
export class ArtistCard {
  readonly artist = input.required<Artist>();
  readonly variant = input<'compact' | 'full' | 'boxed'>('compact');
  /** Emits when the patron unsaves this artist with the heart. */
  readonly unsaved = output<void>();
}
