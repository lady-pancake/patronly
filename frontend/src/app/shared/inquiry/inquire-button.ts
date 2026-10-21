import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Artist } from '../../core/data/models';
import { InquiryLauncher } from './inquiry-launcher';

/**
 * The "Inquire" button on a studio. On your own studio it stays visible, so you
 * can see what patrons see, but it's disabled with a tooltip explaining why.
 */
@Component({
  selector: 'app-inquire-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'group relative flex' },
  template: `
    <button
      type="button"
      (click)="open()"
      [disabled]="own()"
      [attr.aria-describedby]="own() ? 'own-studio-tip' : null"
      [class]="buttonClass() + ' w-full disabled:cursor-not-allowed disabled:opacity-50'"
    >
      <ng-content />
    </button>
    @if (own()) {
      <span
        id="own-studio-tip"
        role="tooltip"
        class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-[240px] -translate-x-1/2 rounded-xl bg-[oklch(0.145_0_0)] px-3 py-2 text-center text-xs leading-snug font-medium text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        Patrons see this button. You can’t send an inquiry to your own studio.
      </span>
    }
  `,
})
export class InquireButton {
  private readonly launcher = inject(InquiryLauncher);
  readonly artist = input.required<Artist>();
  readonly buttonClass = input('');
  /** "me" is the signed-in artist's own studio. */
  protected readonly own = computed(() => this.artist().id === 'me');

  protected open() {
    if (!this.own()) this.launcher.open(this.artist());
  }
}
