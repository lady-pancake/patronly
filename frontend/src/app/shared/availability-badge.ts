import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AVAILABILITY } from '../core/data/catalog';
import type { Availability } from '../core/data/models';

@Component({
  selector: 'app-availability-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex h-6 items-center gap-1.5 rounded-md pr-2.5 pl-2 text-xs font-medium',
    '[style.background]': 'style().bg',
    '[style.color]': 'style().fg',
  },
  templateUrl: './availability-badge.html',
})
export class AvailabilityBadge {
  readonly value = input.required<Availability>();
  protected readonly style = computed(() => AVAILABILITY[this.value()]);
}

/** Sage tag showing an artist's price range. */
@Component({
  selector: 'app-price-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'inline-flex h-6 items-center rounded-md bg-[color-mix(in_oklab,var(--sage)_30%,white)] px-2.5 text-xs font-medium text-sage-foreground',
  },
  template: `<ng-content />`,
})
export class PriceBadge {}
