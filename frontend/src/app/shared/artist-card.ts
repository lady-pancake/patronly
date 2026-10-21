import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  template: `
    <div
      [class]="
        variant() === 'boxed'
          ? 'relative rounded-4xl bg-card px-3 pt-3 pb-4 ring-1 ring-black/5'
          : 'relative'
      "
    >
      <a [routerLink]="['/artists', artist().id]" class="lift flex flex-col gap-3">
        <app-work-preview
          [artist]="artist()"
          [class]="variant() === 'full' ? 'aspect-[4/3]' : 'aspect-[16/10]'"
        />
        <div class="flex flex-col gap-0.5">
          <div
            class="font-serif leading-tight"
            [class]="variant() === 'full' ? 'text-2xl' : 'text-xl'"
          >
            {{ artist().name }}
          </div>
          <div class="text-[13px] text-muted-foreground">
            @switch (variant()) {
              @case ('full') {
                {{ artist().studio }} · {{ artist().city }}
              }
              @case ('boxed') {
                {{ artist().role }} · {{ artist().priceLabel }}
              }
              @default {
                {{ artist().role }} · {{ artist().city }}
              }
            }
          </div>
          @if (variant() !== 'boxed') {
            <div class="mt-2 flex flex-wrap gap-1.5">
              <app-price-badge>{{ artist().priceLabel }}</app-price-badge>
              @if (variant() === 'full') {
                <app-availability-badge [value]="artist().availability" />
              }
            </div>
          }
        </div>
      </a>
      <app-heart-button
        [artistId]="artist().id"
        class="absolute"
        [class]="variant() === 'boxed' ? 'top-[22px] right-[22px]' : 'top-2.5 right-2.5'"
      />
    </div>
  `,
})
export class ArtistCard {
  readonly artist = input.required<Artist>();
  readonly variant = input<'compact' | 'full' | 'boxed'>('compact');
}
