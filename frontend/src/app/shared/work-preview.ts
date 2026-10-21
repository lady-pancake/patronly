import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Artist } from '../core/data/models';

/** One large and two small tiles of an artist's work. */
@Component({
  selector: 'app-work-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid w-full grid-cols-[2fr_1fr] grid-rows-2 gap-1 overflow-hidden rounded-3xl' },
  template: `
    @for (w of tiles(); track $index) {
      <div [class.row-span-2]="$first" [style.background]="w.bg"></div>
    }
  `,
})
export class WorkPreview {
  readonly artist = input.required<Artist>();
  protected readonly tiles = computed(() => this.artist().workList.slice(0, 3));
}
