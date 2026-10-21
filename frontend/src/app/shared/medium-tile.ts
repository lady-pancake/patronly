import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mediumArt } from '../core/data/catalog';

/** Hand-drawn medium illustration with its name underneath. */
@Component({
  selector: 'app-medium-tile',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './medium-tile.html',
})
export class MediumTile {
  readonly name = input.required<string>();
  protected readonly slug = computed(() => this.name().toLowerCase());
  protected readonly art = computed(() => `url('${mediumArt(this.name())}') center/112% no-repeat`);
}
