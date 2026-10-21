import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mediumArt } from '../core/data/catalog';

/** Hand-drawn medium illustration with its name underneath. */
@Component({
  selector: 'app-medium-tile',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <a [routerLink]="['/mediums', slug()]" class="group flex flex-col gap-2">
      <div
        class="aspect-square overflow-hidden rounded-2xl transition-transform duration-200 ease-soft group-hover:-translate-y-[3px]"
        [style.background]="art()"
        role="img"
        [attr.aria-label]="name()"
      ></div>
      <span class="text-center font-serif text-lg leading-tight group-hover:opacity-70">{{
        name()
      }}</span>
    </a>
  `,
})
export class MediumTile {
  readonly name = input.required<string>();
  protected readonly slug = computed(() => this.name().toLowerCase());
  protected readonly art = computed(() => `url('${mediumArt(this.name())}') center/112% no-repeat`);
}
