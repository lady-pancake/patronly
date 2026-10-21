import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideClock,
  lucideLandmark,
  lucideMessageCircle,
} from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ArtistStore } from '../../core/data/artist-store';
import { inboxId } from '../../core/data/inbox-seed';
import { PatronStore } from '../../core/data/patron-store';
import { openContractDialog } from '../../shared/contract-dialog';
import {
  INQUIRIES,
  PAYDAY,
  PENDING,
  STAGES,
  activeCommissions,
  earnings,
  weekLoad,
  yearView,
} from './dashboard-data';
import { InquiryRowView } from './inquiry-row';
import { PayoutDialog } from './payout-dialog';

const CARD =
  'rounded-4xl bg-background shadow-[0_4px_12px_oklch(0_0_0/.05),0_0_0_1px_oklch(0_0_0/.06)]';

/** The artist's home: money, new inquiries, commissions in progress and the year ahead. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIcon, InquiryRowView],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideClock,
      lucideLandmark,
      lucideMessageCircle,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly store = inject(ArtistStore);
  private readonly patron = inject(PatronStore);
  private readonly dialog = inject(HlmDialogService);

  protected readonly card = CARD;
  protected readonly row =
    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-t py-4 items-center sm:grid-cols-[minmax(180px,1fr)_128px_228px_36px]';
  protected readonly roundBtn =
    'grid size-9 shrink-0 place-items-center rounded-full border bg-background hover:bg-muted';

  protected readonly payday = PAYDAY;
  protected readonly earn = earnings();
  protected readonly chartLabel = `Earnings by month in 2026: ${this.earn.earned} earned, ${this.earn.upcoming} upcoming under contract.`;
  protected readonly active = activeCommissions();
  protected readonly pending = PENDING;
  protected readonly load = weekLoad();
  protected readonly stageStyle = STAGES;
  protected readonly stages = Object.values(STAGES);
  protected readonly tabs = [
    { id: 'active' as const, label: 'Active', count: this.active.length },
    { id: 'pending' as const, label: 'Pending', count: this.pending.length },
  ];

  protected readonly hoverBar = signal<number | null>(null);
  protected readonly tab = signal<'active' | 'pending'>('active');
  protected readonly yearOffset = signal(0);
  protected readonly year = computed(() => yearView(this.yearOffset()));

  protected readonly inquiries = computed(() =>
    INQUIRIES.filter((q) => !this.store.replied().includes(q.name)),
  );
  protected readonly accountLabel = computed(() => {
    const a = this.store.account();
    return `${a.bank} ···· ${a.iban.replace(/\s/g, '').slice(-4)}`;
  });

  protected readonly inboxId = inboxId;

  protected editAccount() {
    this.dialog.open(PayoutDialog, { contentClass: 'sm:max-w-[440px] rounded-4xl p-7 gap-0' });
  }

  /** Templates are coming soon: the artist attaches their own contract for now. */
  protected createContract(name: string) {
    openContractDialog(this.dialog, name).closed$.subscribe((file) => {
      if (!file) return;
      this.store.remind(name);
      const id = inboxId(name);
      this.patron.sendMessage(id, `Contract attached: ${file}`);
      this.patron.setStatus(id, 'Awaiting signature');
    });
  }
}
