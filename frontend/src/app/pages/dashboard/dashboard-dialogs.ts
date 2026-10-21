import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { ArtistStore, type PayoutAccount } from '../../core/data/artist-store';

const BUTTON = 'h-10 rounded-md px-4 text-[13px] font-medium';

/** Edit where payouts are sent. */
@Component({
  selector: 'app-payout-dialog',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-5" (ngSubmit)="save()">
      <div class="flex flex-col gap-1.5">
        <h2 class="font-serif text-[32px] leading-none font-normal">Payout account</h2>
        <span class="text-[13px] text-muted-foreground"
          >Where your deposits and final payments are sent. Changes apply from the next
          payday.</span
        >
      </div>
      @for (f of fields; track f.key) {
        <label class="flex flex-col gap-1.5 text-[13px] font-medium"
          >{{ f.label
          }}<input
            class="field !h-11 !px-4 !text-sm font-normal"
            [name]="f.key"
            [ngModel]="draft()[f.key]"
            (ngModelChange)="set(f.key, $event)"
            [placeholder]="f.placeholder"
        /></label>
      }
      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="ref.close()"
          [class]="buttonClass + ' border bg-background hover:bg-muted'"
        >
          Cancel
        </button>
        <button
          type="submit"
          [disabled]="!valid()"
          [class]="
            buttonClass +
            ' bg-primary font-semibold text-primary-foreground hover:opacity-85 disabled:opacity-40'
          "
        >
          Save account
        </button>
      </div>
    </form>
  `,
})
export class PayoutDialog {
  protected readonly ref = inject(BrnDialogRef);
  private readonly store = inject(ArtistStore);
  protected readonly buttonClass = BUTTON;

  protected readonly fields: { key: keyof PayoutAccount; label: string; placeholder: string }[] = [
    { key: 'bank', label: 'Bank', placeholder: 'Bank name' },
    { key: 'holder', label: 'Account holder', placeholder: 'Name on the account' },
    { key: 'iban', label: 'IBAN', placeholder: 'PT50 0000 0000 0000 0000 0000 0' },
  ];
  protected readonly draft = signal<PayoutAccount>({ ...this.store.account() });
  protected readonly valid = computed(() => {
    const d = this.draft();
    return !!d.bank.trim() && !!d.holder.trim() && d.iban.replace(/\s/g, '').length >= 8;
  });

  protected set(key: keyof PayoutAccount, value: string) {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected save() {
    if (!this.valid()) return;
    this.store.account.set(this.draft());
    this.ref.close();
  }
}
