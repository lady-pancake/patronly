import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import {
  INQUIRIES,
  PAYDAY,
  TRACK_STAGES,
  type TrackStage,
  timeline,
  type AcceptedDeal,
  type PendingRow,
  earnings,
  weekLoad,
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
  private readonly router = inject(Router);

  protected readonly card = CARD;
  protected readonly row =
    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-t py-4 items-center sm:grid-cols-[minmax(180px,1fr)_128px_228px_36px]';
  protected readonly roundBtn =
    'grid size-9 shrink-0 place-items-center rounded-full border bg-background hover:bg-muted';

  protected readonly payday = PAYDAY;
  protected readonly earn = earnings();
  protected readonly chartLabel = `Earnings by month in 2026: ${this.earn.earned} earned, ${this.earn.upcoming} upcoming under contract.`;
  protected readonly load = weekLoad();

  protected readonly hoverBar = signal<number | null>(null);
  /** Months the timeline is moved from its default (last month onwards). */
  protected readonly offset = signal(0);
  /** Commissions accepted in Messages, placed on their agreed dates. */
  private readonly deals = computed<AcceptedDeal[]>(() =>
    this.patron.inbox().flatMap((t) => {
      const m = t.msgs.find((x) => x.type === 'accepted');
      if (!m || m.type !== 'accepted' || !m.terms || !t.patron) return [];
      return [
        {
          name: t.patron.name,
          type: m.terms.size,
          deposit: m.deposit,
          startDate: m.terms.startDate,
          dueDate: m.terms.dueDate,
          stage: t.contract?.paid ? 'paid' : t.contract?.signed ? 'deposit' : 'sent',
        },
      ];
    }),
  );
  protected readonly tl = computed(() => timeline(this.offset(), this.deals()));
  protected readonly trackStages = TRACK_STAGES;
  // Spelled out in full so Tailwind generates each one.
  protected readonly barClass: Record<TrackStage, string> = {
    wip: 'bar-wip',
    booked: 'bar-booked',
    deposit: 'bar-deposit',
    contract: 'bar-contract',
    done: 'bar-done',
  };
  protected readonly legend = Object.entries(TRACK_STAGES) as [TrackStage, string][];

  /** Status line, note and button label for a pending commission. */
  protected pendingStatus(u: PendingRow, reminded: boolean) {
    switch (u.stage) {
      case 'deposit':
        return {
          title: 'Awaiting deposit',
          sub: reminded ? 'Reminder sent today' : 'Contract signed',
          button: reminded ? 'Reminded' : 'Send reminder',
        };
      case 'sent':
        return {
          title: 'Awaiting signature',
          sub: reminded ? 'Reminder sent today' : 'Sent ' + u.accepted,
          button: reminded ? 'Reminded' : 'Send reminder',
        };
      default:
        return {
          title: 'Contract not sent',
          sub: reminded ? 'Sent today' : 'Draft ready',
          button: reminded ? 'Sent' : 'Create contract',
        };
    }
  }

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

  /** Opens the conversation with the accept flow, to agree scope, dates and the contract. */
  protected createContract(name: string) {
    void this.router.navigate(['/messages', inboxId(name)], { queryParams: { accept: 1 } });
  }
}
