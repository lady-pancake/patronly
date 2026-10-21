import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, BrnDialogTitle } from '@spartan-ng/brain/dialog';
import { ArtistStore, type PayoutAccount } from '../../core/data/artist-store';

const BUTTON = 'h-10 rounded-md px-4 text-[13px] font-medium';

/** Edit where payouts are sent. */
@Component({
  selector: 'app-payout-dialog',
  imports: [BrnDialogTitle, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payout-dialog.html',
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
