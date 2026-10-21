import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MEDIUMS } from '../../core/data/seed';
import { BackLink } from '../../shared/back-link';
import { MediumTile } from '../../shared/medium-tile';

@Component({
  selector: 'app-mediums',
  imports: [BackLink, MediumTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mediums.html',
})
export class Mediums {
  protected readonly mediums = MEDIUMS;
}
