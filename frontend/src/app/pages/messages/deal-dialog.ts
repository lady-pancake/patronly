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
  template: `
    @if (ctx.mode === 'contract') {
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <span class="eyebrow !text-[11px]">Commission contract</span>
          <h2 brnDialogTitle class="font-serif text-[34px] leading-[1.1] font-normal">
            You &amp; <em>{{ ctx.artistName }}</em>
          </h2>
        </div>
        <dl class="flex flex-col rounded-2xl ring-1 ring-border">
          @for (row of rows; track row[0]; let last = $last) {
            <div class="flex justify-between gap-3 px-4 py-3" [class.border-b]="!last">
              <dt class="text-muted-foreground">{{ row[0] }}</dt>
              <dd class="text-right font-semibold">{{ row[1] }}</dd>
            </div>
          }
        </dl>
        <p class="text-xs leading-relaxed text-muted-foreground">
          The artist keeps copyright; you own the original. Your deposit is refundable until work
          begins.
        </p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            (click)="ref.close()"
            class="h-10 rounded-md border bg-background px-4.5 text-sm font-medium hover:bg-muted"
          >
            Not yet
          </button>
          <button
            type="button"
            (click)="ref.close(true)"
            class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-85"
          >
            Sign contract
          </button>
        </div>
      </div>
    } @else {
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <span class="eyebrow !text-[11px]">Deposit</span>
          <h2 brnDialogTitle class="font-serif text-[52px] leading-none font-normal">
            {{ deposit }}
          </h2>
          <span class="text-[13px] text-muted-foreground"
            >30% today · {{ balance }} due on delivery</span
          >
        </div>
        <div class="flex h-13 items-center gap-3 rounded-3xl border border-input px-4">
          <span class="h-6 w-9 rounded-[5px] bg-[oklch(0.3_0_0)]"></span>
          <span class="flex-1 font-medium">Visa ending 4242</span>
          <span class="text-[13px] text-muted-foreground">Change</span>
        </div>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Held securely by Patronly and released to the artist when work begins.
        </p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            (click)="ref.close()"
            class="h-10 rounded-md border bg-background px-4.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="ref.close(true)"
            class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-85"
          >
            Pay {{ deposit }}
          </button>
        </div>
      </div>
    }
  `,
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
