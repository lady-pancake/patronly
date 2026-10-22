import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowUp,
  lucideCheck,
  lucideFileText,
  lucidePartyPopper,
} from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ViewerStore } from '../../core/auth/viewer.store';
import { ArtistStore } from '../../core/data/artist-store';
import { artistById, tone } from '../../core/data/catalog';
import type { AcceptedMessage, Artist, Thread, Work } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { AcceptDialog, type AcceptContext, type AcceptResult } from './accept-dialog';
import { longDate } from './accept-terms';
import { DealDialog, type DealContext, type DealResult, money } from './deal-dialog';
import { STATUS_STYLE, threadStatus } from './thread-status';
import { CleanText } from '../../shared/clean-text';
import { Avatar } from '../../shared/avatar';

@Component({
  selector: 'app-messages',
  imports: [CleanText, RouterLink, FormsModule, NgIcon, Avatar],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowUp,
      lucideCheck,
      lucideFileText,
      lucidePartyPopper,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messages.html',
})
export class Messages {
  private readonly store = inject(PatronStore);
  private readonly artist = inject(ArtistStore);
  private readonly viewer = inject(ViewerStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(HlmDialogService);

  /** Artists also get the inquiries patrons sent to their studio. */
  protected readonly canIncoming = computed(() => this.viewer.can('RECEIVE_INQUIRIES'));

  /** Which list is showing: follows the open conversation, or the tab last clicked. */
  protected readonly box = linkedSignal<'incoming' | 'outgoing'>(() => {
    const id = this.threadId();
    if (!this.canIncoming()) return 'outgoing';
    if (id && this.store.threads().some((t) => t.id === id)) return 'outgoing';
    return 'incoming';
  });

  protected readonly boxes = computed(() => [
    { id: 'incoming' as const, label: 'Incoming', unread: this.store.unreadIncoming() },
    { id: 'outgoing' as const, label: 'Outgoing', unread: this.store.unreadCount() },
  ]);

  private readonly threads = computed(() =>
    this.box() === 'incoming' ? this.store.inbox() : this.store.threads(),
  );

  /** Route param; the first conversation opens when it's missing. */
  readonly threadId = input<string>();
  /** `?accept=1` opens the accept flow for the conversation, e.g. from the dashboard. */
  readonly accept = input<string>();

  protected readonly styles = STATUS_STYLE;
  protected readonly money = money;
  protected readonly draft = signal('');

  /** On phones the list and the open conversation take turns filling the screen. */
  protected readonly open = computed(() => !!this.threadId());

  protected readonly current = computed<Thread | undefined>(() => {
    const ts = this.threads();
    return ts.find((t) => t.id === this.threadId()) ?? ts[0];
  });

  protected readonly list = computed(() =>
    this.threads().map((t) => {
      const artist = this.artistOf(t);
      const who = this.whoOf(t);
      const status = threadStatus(t);
      const last = t.msgs.at(-1);
      const preview = !last
        ? (t.direction === 'incoming' ? 'New inquiry: ' : 'Inquiry sent: ') +
          (t.inq.msg || t.inq.type || 'Commission inquiry')
        : last.type === 'accepted'
          ? t.direction === 'incoming'
            ? `You accepted ${who.first}’s commission`
            : `${artist.first} accepted your commission`
          : (last.me ? 'You: ' : '') + last.text;
      return { ...t, artist, who, status, style: STATUS_STYLE[status], preview };
    }),
  );

  constructor() {
    // Opening a conversation marks it read.
    effect(() => {
      const t = this.current();
      if (t?.unread) this.store.markRead(t.id);
    });
    // Arriving with ?accept=1 opens the accept flow once, then clears the flag.
    effect(() => {
      const t = this.current();
      if (!this.accept() || !t || t.direction !== 'incoming') return;
      if (t.msgs.some((m) => m.type === 'accepted')) return;
      untracked(() => {
        void this.router.navigate([], { queryParams: { accept: null }, replaceUrl: true });
        this.openAccept(t);
      });
    });
  }

  protected artistOf(t: Thread): Artist {
    if (t.artistId === 'me') return this.artist.mine();
    return artistById(t.artistId) ?? (artistById('sol') as Artist);
  }

  /** The other person in the conversation: the artist you wrote to, or the patron who wrote to you. */
  protected whoOf(t: Thread): {
    name: string;
    first: string;
    sub: string;
    bg: string;
    photo: string | null;
  } {
    if (t.direction === 'incoming' && t.patron) {
      const { name, hue } = t.patron;
      const bg = tone(hue, 0.88, 0.04);
      return { name, first: name.split(' ')[0], sub: 'Patron', bg, photo: null };
    }
    const a = this.artistOf(t);
    return { name: a.name, first: a.first, sub: a.studio, bg: a.tint, photo: a.portrait ?? null };
  }

  protected openBox(box: 'incoming' | 'outgoing') {
    this.box.set(box);
    // Side by side, open the tab's first conversation. On phones, stay on the list.
    if (!matchMedia('(min-width: 1024px)').matches) return;
    const first = (box === 'incoming' ? this.store.inbox() : this.store.threads())[0];
    void this.router.navigate(first ? ['/messages', first.id] : ['/messages']);
  }

  /**
   * Incoming: accept the commission, agreeing scope, dates and a contract. With `revise`,
   * reopens the sent terms at the contract step so the artist can work in the patron's changes.
   */
  protected openAccept(t: Thread, revise?: AcceptedMessage) {
    const patron = t.patron?.name ?? '';
    const ref = this.dialog.open<AcceptResult | undefined, AcceptContext>(AcceptDialog, {
      context: {
        patron,
        inq: t.inq,
        artist: this.artist.mine(),
        revise: revise?.terms
          ? {
              piece: revise.piece,
              total: revise.total,
              terms: revise.terms,
              changes: t.contract?.changes ?? '',
            }
          : undefined,
      },
      contentClass: 'w-[calc(100vw-32px)] max-w-[640px] sm:max-w-[640px] rounded-4xl p-6 sm:p-8',
    });
    ref.closed$.subscribe((r) => {
      if (!r) return;
      const deal = {
        piece: r.piece,
        total: r.total,
        deposit: Math.round((r.total * r.terms.depositPct) / 100),
        start: longDate(r.terms.startDate),
        due: longDate(r.terms.dueDate),
        terms: r.terms,
      };
      if (revise) {
        this.store.reviseCommission(t.id, deal);
        return;
      }
      this.store.acceptCommission(t.id, deal);
      // Off the dashboard's "waiting for a reply" list.
      this.artist.markReplied(patron);
    });
  }

  /** Demo only: stands in for the patron asking for a change. */
  protected simulateChanges(t: Thread) {
    this.store.suggestChanges(
      t.id,
      'Could delivery be a week later, and could we add one more round of revisions?',
      false,
    );
  }

  /** Which accepted cards have their contract open. */
  protected readonly contractOpen = signal<string | null>(null);

  /** The artist's side of an accepted commission: what's done and what's next. */
  protected artistStepsOf(t: Thread, first: string, m: AcceptedMessage) {
    const signed = !!t.contract?.signed,
      paid = !!t.contract?.paid;
    const reminded = this.artist.reminded().includes(t.patron?.name ?? '');
    const changes = t.contract?.changes;
    return [
      {
        n: '1',
        title: 'Contract sent',
        sub:
          m.terms?.contract.kind === 'file'
            ? m.terms.contract.name
            : 'Patronly commission agreement, with your scope and dates.',
        done: true,
        active: false,
        demo: '',
        patch: null,
        revise: false,
      },
      {
        n: '2',
        title: changes ? `${first} suggested changes` : `${first} signs`,
        sub: signed
          ? 'Signed.'
          : changes
            ? `“${changes}”`
            : reminded
              ? 'Reminder sent today.'
              : 'Waiting for their signature. They can suggest changes first.',
        done: signed,
        active: !signed,
        demo: changes ? '' : 'Mark signed',
        patch: changes ? null : { signed: true },
        revise: !!changes,
      },
      {
        n: '3',
        title: `${first} pays the deposit`,
        sub: `${money(m.deposit)}, refundable until work begins.`,
        done: paid,
        active: signed && !paid,
        demo: 'Mark paid',
        patch: { paid: true },
        revise: false,
      },
      {
        n: '4',
        title: 'You start work',
        sub: `${m.start}. Delivery by ${m.due}.`,
        done: paid,
        active: false,
        demo: '',
        patch: null,
        revise: false,
      },
    ];
  }

  protected remind(t: Thread) {
    const name = t.patron?.name ?? '';
    this.artist.remind(name);
    this.store.sendMessage(
      t.id,
      'Just a gentle reminder about the contract and deposit. Thank you!',
    );
  }

  /** Demo only: stands in for the patron signing or paying. */
  protected simulate(t: Thread, patch: { signed?: boolean; paid?: boolean }) {
    this.store.updateContract(t.id, patch);
  }

  protected statusOf(t: Thread) {
    return threadStatus(t);
  }

  protected worksOf(t: Thread, a: Artist): Work[] {
    return t.inq.works.map((i) => a.workList[i]).filter(Boolean);
  }

  protected detailsOf(t: Thread): [string, string][] {
    return [
      ['What', t.inq.type || 'Not specified'],
      ['Budget', t.inq.budget || 'Not sure yet'],
      ['Timeline', t.inq.timeline || 'Flexible'],
    ];
  }

  protected stepsOf(t: Thread, a: Artist, m: AcceptedMessage) {
    const signed = !!t.contract?.signed,
      paid = !!t.contract?.paid;
    return [
      {
        n: '1',
        title: 'Sign the contract',
        sub: t.contract?.changes
          ? `You suggested changes. ${a.first} will send an updated contract.`
          : 'Scope, timeline, revisions and delivery, agreed in writing. Suggest changes if anything’s off.',
        done: signed,
        active: !signed,
        cta: 'Review & sign',
        mode: 'contract' as const,
      },
      {
        n: '2',
        title: 'Pay the deposit',
        sub: `${money(m.deposit)} today (${m.terms?.depositPct ?? 30}%). The rest is due on delivery.`,
        done: paid,
        active: signed && !paid,
        cta: `Pay ${money(m.deposit)}`,
        mode: 'deposit' as const,
      },
      {
        n: '3',
        title: `${a.first} starts work`,
        sub: `Starting ${m.start}. Progress photos every two weeks.`,
        done: paid,
        active: false,
        cta: '',
        mode: undefined,
      },
    ];
  }

  protected openDeal(t: Thread, a: Artist, deal: AcceptedMessage, mode: DealContext['mode']) {
    const ref = this.dialog.open<DealResult, DealContext>(DealDialog, {
      context: { mode, artistName: a.name, deal },
      contentClass: 'sm:max-w-[480px] rounded-4xl p-8',
    });
    ref.closed$.subscribe((r) => {
      if (!r) return;
      if (typeof r === 'object') this.store.suggestChanges(t.id, r.suggest, true);
      else this.store.updateContract(t.id, mode === 'contract' ? { signed: true } : { paid: true });
    });
  }

  protected send(e: Event, t: Thread) {
    if (e instanceof KeyboardEvent && e.shiftKey) return;
    e.preventDefault();
    const text = this.draft().trim();
    if (!text) return;
    this.store.sendMessage(t.id, text);
    // Keeps the dashboard's "waiting for a reply" list in step.
    if (t.direction === 'incoming' && t.patron) this.artist.markReplied(t.patron.name);
    this.draft.set('');
  }
}
