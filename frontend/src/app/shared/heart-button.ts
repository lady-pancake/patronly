import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { ViewerStore } from '../core/auth/viewer.store';
import { PatronStore } from '../core/data/patron-store';

let nextId = 0;

/**
 * Round heart that saves an artist to the patron's favourites. On your own
 * studio it stays visible but disabled, like the Inquire button, with a tooltip
 * explaining why.
 */
@Component({
  selector: 'app-heart-button',
  imports: [NgIcon],
  providers: [provideIcons({ lucideHeart })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heart-button.html',
})
export class HeartButton {
  private readonly store = inject(PatronStore);
  private readonly viewer = inject(ViewerStore);
  readonly artistId = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  /** "me" is the signed-in artist's own studio. */
  protected readonly own = computed(() => this.artistId() === 'me');
  protected readonly on = computed(
    () => !this.own() && this.store.favs().includes(this.artistId()),
  );
  protected readonly tipId = `own-heart-tip-${nextId++}`;
  protected readonly classes = computed(
    () =>
      'grid place-items-center rounded-full transition-colors ' +
      (this.size() === 'lg' ? 'size-11 bg-white ' : 'size-9 bg-white/90 ') +
      (this.on() ? 'text-[oklch(0.58_0.09_25)] [&_svg]:fill-current' : 'text-foreground'),
  );

  protected toggle(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.own() || !this.viewer.can('SAVE_FAVOURITES')) return;
    this.store.toggleFav(this.artistId());
  }
}
