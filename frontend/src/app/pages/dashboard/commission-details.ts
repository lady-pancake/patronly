import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideMessageCircle } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import type {
  AcceptedMessage,
  Artist,
  CommissionTerms,
  Thread,
  Work,
} from '../../core/data/models';
import { WorkLightbox } from '../../shared/work-lightbox';
import { contractText, longDate, money } from '../messages/accept-terms';
import { TRACK_STAGES, type CommissionFacts } from './dashboard-data';

export interface DetailsContext {
  name: string;
  thread: Thread | null;
  facts: CommissionFacts | null;
  artist: Artist;
}

/** A date or a month (YYYY-MM) written out. */
function when(v: string | null): string {
  if (!v) return 'To be agreed';
  if (v.length === 10) return longDate(v);
  const [y, m] = v.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Everything about one commission in one place: the agreed terms, the patron's
 * brief, the contract and the photos shared in the conversation.
 */
@Component({
  selector: 'app-commission-details',
  imports: [BrnDialogTitle, NgIcon, WorkLightbox],
  providers: [provideIcons({ lucideFileText, lucideMessageCircle })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commission-details.html',
})
export class CommissionDetails {
  protected readonly ref = inject<BrnDialogRef<void>>(BrnDialogRef);
  private readonly router = inject(Router);
  protected readonly ctx = injectBrnDialogContext<DetailsContext>();
  protected readonly showContract = signal(false);
  protected readonly openImage = signal<number | null>(null);

  private readonly deal = this.ctx.thread?.msgs.find(
    (m): m is AcceptedMessage => m.type === 'accepted',
  );
  private readonly terms: CommissionTerms | undefined = this.deal?.terms;
  private readonly f = this.ctx.facts;

  protected readonly first = this.ctx.name.split(' ')[0];
  protected readonly type = this.terms?.size ?? this.f?.type ?? this.ctx.thread?.inq.type ?? '';
  protected readonly stage = this.terms
    ? this.ctx.thread?.contract?.paid
      ? 'Booked'
      : this.ctx.thread?.contract?.signed
        ? 'Awaiting deposit'
        : 'Awaiting contract'
    : this.f
      ? this.f.stage === 'unscheduled'
        ? 'Not scheduled'
        : TRACK_STAGES[this.f.stage]
      : 'Inquiry';
  protected readonly donePct = this.terms ? null : (this.f?.donePct ?? null);

  protected readonly facts: [string, string][] = this.buildFacts();

  protected readonly brief = this.ctx.thread
    ? {
        msg: this.ctx.thread.inq.msg,
        rows: [
          ['Asked for', this.ctx.thread.inq.type || 'Not specified'],
          ['Budget', this.ctx.thread.inq.budget || 'Not sure yet'],
          ['Timeline', this.ctx.thread.inq.timeline || 'Flexible'],
          ['Received', this.ctx.thread.inq.date],
        ] as [string, string][],
      }
    : null;

  protected readonly contract = this.buildContract();

  /** Every photo shared in the conversation, newest last, ready for the preview. */
  protected readonly images: Work[] = (this.ctx.thread?.msgs ?? []).flatMap((m) =>
    m.type === 'accepted' || !m.images
      ? []
      : m.images.map((src) => ({
          title: m.me ? 'You shared' : `${this.first} shared`,
          material: m.time,
          src,
          bg: `#EEE8DD url('${src}') center/cover no-repeat`,
        })),
  );

  protected readonly recent = (this.ctx.thread?.msgs ?? [])
    .filter((m) => m.type !== 'accepted')
    .slice(-3);

  protected openMessages() {
    if (!this.ctx.thread) return;
    this.ref.close();
    void this.router.navigate(['/messages', this.ctx.thread.id]);
  }

  private buildFacts(): [string, string][] {
    const d = this.deal,
      t = this.terms,
      f = this.f;
    if (d && t) {
      return [
        ['Price', money(d.total)],
        ['Deposit', `${money(d.deposit)} (${t.depositPct}%)`],
        ['Work starts', d.start],
        ['Delivery by', d.due],
        ['Revisions', t.revisions ? `${t.revisions} rounds` : 'None'],
        ['Delivery', t.delivery],
      ];
    }
    if (!f) return [];
    const rows: [string, string][] = [];
    if (f.total !== null) rows.push(['Price', money(f.total)]);
    if (f.paid !== null && f.total !== null)
      rows.push([
        'Paid',
        f.paid
          ? `${money(f.paid)} of ${money(f.total)}`
          : `Nothing yet · ${money((f.total * f.depositPct) / 100)} deposit`,
      ]);
    rows.push([f.stage === 'wip' ? 'Started' : 'Starts', when(f.start)]);
    rows.push([f.dueVerb, when(f.due)]);
    return rows;
  }

  private buildContract(): { status: string; title: string; text: string | null } {
    const t = this.terms;
    if (t) {
      const signed = this.ctx.thread?.contract?.signed;
      return {
        status: signed ? 'Signed' : 'Sent, awaiting signature',
        title: t.contract.kind === 'file' ? t.contract.name : 'Patronly commission agreement',
        text: t.contract.kind === 'template' ? t.contract.text : null,
      };
    }
    const f = this.f;
    if (!f || f.contract === 'none') return { status: 'Not sent yet', title: '', text: null };
    // Sample commissions: the standard agreement, filled in from what we know.
    const dated = f.start && f.due && f.total !== null;
    const iso = (v: string, end: boolean) => (v.length === 10 ? v : end ? `${v}-28` : `${v}-01`);
    return {
      status: f.contract === 'signed' ? 'Signed' : 'Sent, awaiting signature',
      title: 'Patronly commission agreement',
      text: dated
        ? contractText(
            {
              artist: this.ctx.artist.name,
              studio: this.ctx.artist.studio,
              patron: this.ctx.name,
              piece: this.ctx.thread?.inq.msg.replace(/\.$/, '') || this.type,
              total: f.total!,
            },
            {
              size: f.type,
              medium: this.ctx.artist.medium,
              revisions: 2,
              delivery: f.dueVerb.startsWith('Pick') ? 'Pickup' : 'Shipping',
              notes: '',
              depositPct: f.depositPct,
              startDate: iso(f.start!, false),
              dueDate: iso(f.due!, true),
            },
          )
        : null,
    };
  }
}
