import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import type { AcceptedMessage } from '../../core/data/models';

export interface DealContext {
  mode: 'contract' | 'deposit';
  artistName: string;
  deal: AcceptedMessage;
}

export const money = (n: number) => '$' + n.toLocaleString('en-US');

/** Contract review and deposit payment steps after an artist accepts. */
@Component({
  imports: [BrnDialogTitle],
  selector: 'app-deal-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deal-dialog.html',
})
export class DealDialog {
  protected readonly ref = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<DealContext>();
  protected readonly deposit = money(this.ctx.deal.deposit);
  protected readonly balance = money(this.ctx.deal.total - this.ctx.deal.deposit);
  protected readonly rows: [string, string][] = [
    ['Commission', this.ctx.deal.piece],
    ['Price', money(this.ctx.deal.total)],
    ['Work begins', this.ctx.deal.start],
    ['Delivery by', this.ctx.deal.due],
    ['Revisions', '2 rounds at sketch stage'],
  ];
}
