import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucideX } from '@ng-icons/lucide';
import type { Work } from '../core/data/models';

/** Full-screen preview of one work, with previous and next. Closed while `index` is null. */
@Component({
  selector: 'app-work-lightbox',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './work-lightbox.html',
})
export class WorkLightbox {
  readonly works = input.required<Work[]>();
  readonly index = model<number | null>(null);
  protected readonly current = computed(() => {
    const i = this.index();
    return i === null ? null : (this.works()[i] ?? null);
  });

  protected step(d: number, e?: Event) {
    e?.stopPropagation();
    const n = this.works().length;
    this.index.update((i) => (i === null || !n ? i : (i + d + n) % n));
  }

  protected onKey(e: KeyboardEvent) {
    if (this.index() === null) return;
    if (e.key === 'Escape') this.index.set(null);
    if (e.key === 'ArrowLeft') this.step(-1);
    if (e.key === 'ArrowRight') this.step(1);
  }
}
