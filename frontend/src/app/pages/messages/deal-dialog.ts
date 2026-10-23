import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import type { AcceptedMessage } from '../../core/data/models';
import { CleanText } from '../../shared/clean-text';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { openContractDoc } from '../../shared/contract-document';

export interface DealContext {
  mode: 'contract' | 'deposit';
  artistName: string;
  deal: AcceptedMessage;
}

/** Signed or paid (true), or the patron's suggested changes to the contract. */
export type DealResult = boolean | { suggest: string };

export const money = (n: number) => '$' + n.toLocaleString('en-US');

/** Contract review and deposit payment steps after an artist accepts. */
@Component({
  imports: [BrnDialogTitle, FormsModule, CleanText],
  selector: 'app-deal-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deal-dialog.html',
})
export class DealDialog {
  protected readonly ref = inject<BrnDialogRef<DealResult>>(BrnDialogRef);
  /** Writing suggested changes instead of signing. */
  protected readonly suggesting = signal(false);
  protected readonly changes = signal('');
  protected readonly ctx = injectBrnDialogContext<DealContext>();
  protected readonly deposit = money(this.ctx.deal.deposit);
  protected readonly balance = money(this.ctx.deal.total - this.ctx.deal.deposit);
  private readonly terms = this.ctx.deal.terms;
  protected readonly depositPct =
    this.terms?.depositPct ?? Math.round((this.ctx.deal.deposit / this.ctx.deal.total) * 100);
  /** The full contract, when the artist used Patronly's template. */
  protected readonly text =
    this.terms?.contract.kind === 'template' ? this.terms.contract.text : null;
  protected readonly file = this.terms?.contract.kind === 'file' ? this.terms.contract.name : null;
  protected readonly rows: [string, string][] = [
    ['Commission', this.ctx.deal.piece],
    ...(this.terms
      ? ([['Size', `${this.terms.size} · ${this.terms.medium}`]] as [string, string][])
      : []),
    ['Price', money(this.ctx.deal.total)],
    ['Deposit', `${this.deposit} (${this.depositPct}%) on signing`],
    ['Work begins', this.ctx.deal.start],
    ['Delivery by', this.ctx.deal.due],
    ...(this.terms ? ([['Delivery', this.terms.delivery]] as [string, string][]) : []),
    [
      'Revisions',
      this.ctx.deal.terms
        ? this.ctx.deal.terms.revisions
          ? `${this.ctx.deal.terms.revisions} rounds at sketch stage`
          : 'None'
        : '2 rounds at sketch stage',
    ],
  ];

  private readonly dialog = inject(HlmDialogService);

  protected openDoc() {
    openContractDoc(this.dialog, {
      text: this.text,
      file: this.file,
      artist: this.ctx.artistName,
      patron: 'You',
      signed: { artist: true },
    });
  }

  protected sendChanges() {
    const text = this.changes().trim();
    if (text) this.ref.close({ suggest: text });
  }
}
