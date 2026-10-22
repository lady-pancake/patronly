import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Artist } from '../../core/data/models';
import { InquiryLauncher } from './inquiry-launcher';

let nextId = 0;

/**
 * The "Inquire" button on a studio. On your own studio it stays visible, so you
 * can see what patrons see, but it's disabled with a tooltip explaining why.
 * It uses aria-disabled rather than disabled so keyboard users can still focus
 * it and read the tooltip. When a studio isn't taking commissions, the button
 * is hidden.
 */
@Component({
  selector: 'app-inquire-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'group relative flex', '[style.display]': "closed() ? 'none' : null" },
  templateUrl: './inquire-button.html',
})
export class InquireButton {
  private readonly launcher = inject(InquiryLauncher);
  readonly artist = input.required<Artist>();
  readonly buttonClass = input('');
  /** "me" is the signed-in artist's own studio. */
  protected readonly own = computed(() => this.artist().id === 'me');
  protected readonly closed = computed(() => this.artist().availability === 'Closed');
  protected readonly tipId = `own-studio-tip-${nextId++}`;

  protected open() {
    if (!this.own()) this.launcher.open(this.artist());
  }
}
