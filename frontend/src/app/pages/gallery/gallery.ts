import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucideX } from '@ng-icons/lucide';
import { ArtistStore } from '../../core/data/artist-store';
import { InquireButton } from '../../shared/inquiry/inquire-button';
import { NotFound } from '../not-found';

@Component({
  selector: 'app-gallery',
  imports: [RouterLink, NgIcon, NotFound, InquireButton],
  providers: [provideIcons({ lucideChevronLeft, lucideChevronRight, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './gallery.html',
})
export class Gallery {
  readonly id = input.required<string>();
  private readonly store = inject(ArtistStore);
  protected readonly artist = computed(() => this.store.byId(this.id()));
  protected readonly open = signal<number | null>(null);
  protected readonly current = computed(() => {
    const i = this.open();
    return i === null ? null : (this.artist()?.workList[i] ?? null);
  });

  protected step(d: number, e?: Event) {
    e?.stopPropagation();
    const n = this.artist()?.workList.length ?? 0;
    this.open.update((i) => (i === null || !n ? i : (i + d + n) % n));
  }

  protected onKey(e: KeyboardEvent) {
    if (this.open() === null) return;
    if (e.key === 'Escape') this.open.set(null);
    if (e.key === 'ArrowLeft') this.step(-1);
    if (e.key === 'ArrowRight') this.step(1);
  }
}
