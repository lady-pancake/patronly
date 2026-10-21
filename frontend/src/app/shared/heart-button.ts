import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { PatronStore } from '../core/data/patron-store';

/** Round heart that saves an artist to the patron's favourites. */
@Component({
  selector: 'app-heart-button',
  imports: [NgIcon],
  providers: [provideIcons({ lucideHeart })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle($event)"
      [attr.aria-label]="on() ? 'Remove from saved' : 'Save artist'"
      [attr.aria-pressed]="on()"
      [title]="on() ? 'Remove from saved' : 'Save artist'"
      [class]="classes()"
    >
      <ng-icon name="lucideHeart" size="16" />
    </button>
  `,
})
export class HeartButton {
  private readonly store = inject(PatronStore);
  readonly artistId = input.required<string>();
  readonly size = input<'md' | 'lg'>('md');
  protected readonly on = computed(() => this.store.favs().includes(this.artistId()));
  protected readonly classes = computed(
    () =>
      'grid place-items-center rounded-full transition-colors ' +
      (this.size() === 'lg' ? 'size-11 bg-white ' : 'size-9 bg-white/90 ') +
      (this.on() ? 'text-[oklch(0.58_0.09_25)] [&_svg]:fill-current' : 'text-foreground'),
  );

  protected toggle(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.store.toggleFav(this.artistId());
  }
}
