import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { LISTED, mediumArt } from '../../core/data/catalog';
import type { Availability } from '../../core/data/models';
import { MEDIUMS } from '../../core/data/seed';
import { ArtistCard } from '../../shared/artist-card';
import { BackLink } from '../../shared/back-link';
import { FilterSelect } from '../../shared/filter-select';

const AVAIL: Record<string, Availability> = {
  'Taking commissions': 'Open',
  'Waitlist open': 'Waitlist',
  'Not taking': 'Closed',
};

@Component({
  selector: 'app-medium',
  imports: [BackLink, FilterSelect, ArtistCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './medium.html',
})
export class Medium {
  /** Route param, e.g. "painting". */
  readonly name = input.required<string>();

  protected readonly availOptions = ['Any', 'Taking commissions', 'Waitlist open', 'Not taking'];
  protected readonly priceOptions = ['Any', 'Under $1k', '$1k–$5k', '$5k+'];
  protected readonly sortOptions = ['Most saved', 'Most commissions', 'Price: low to high'];

  protected readonly avail = signal<string | null>('Any');
  protected readonly price = signal<string | null>('Any');
  protected readonly sort = signal<string | null>('Most saved');

  protected readonly medium = computed(
    () => MEDIUMS.find((m) => m.name.toLowerCase() === this.name().toLowerCase()) ?? MEDIUMS[0],
  );
  protected readonly art = computed(
    () => `url('${mediumArt(this.medium().name)}') center/112% no-repeat`,
  );

  protected readonly artists = computed(() => {
    const pf = this.price(),
      af = this.avail(),
      sb = this.sort();
    const list = LISTED.filter(
      (a) =>
        a.medium === this.medium().name &&
        (pf === 'Any' ||
          (pf === 'Under $1k' && a.min < 1000) ||
          (pf === '$1k–$5k' && a.min >= 1000 && a.min < 5000) ||
          (pf === '$5k+' && a.max >= 5000)) &&
        (af === 'Any' || a.availability === AVAIL[af ?? '']),
    );
    return [...list].sort((x, y) =>
      sb === 'Price: low to high'
        ? x.min - y.min
        : sb === 'Most commissions'
          ? y.commissions - x.commissions
          : y.likes - x.likes,
    );
  });
}
