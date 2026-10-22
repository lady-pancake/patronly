import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowUp, lucideCheck, lucidePartyPopper } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ViewerStore } from '../../core/auth/viewer.store';
import { ArtistStore } from '../../core/data/artist-store';
import { artistById, tone } from '../../core/data/catalog';
import type { AcceptedMessage, Artist, Thread, Work } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { openContractDialog } from '../../shared/contract-dialog';
import { DealDialog, type DealContext, money } from './deal-dialog';
import { STATUS_STYLE, threadStatus } from './thread-status';

@Component({
  selector: 'app-messages',
  imports: [RouterLink, FormsModule, NgIcon],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowUp, lucideCheck, lucidePartyPopper })],
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
          ? `${artist.first} accepted your commission`
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
  }

  protected artistOf(t: Thread): Artist {
    if (t.artistId === 'me') return this.artist.mine();
    return artistById(t.artistId) ?? (artistById('sol') as Artist);
  }

  /** The other person in the conversation: the artist you wrote to, or the patron who wrote to you. */
  protected whoOf(t: Thread): { name: string; first: string; sub: string; bg: string } {
    if (t.direction === 'incoming' && t.patron) {
      const { name, hue } = t.patron;
      return { name, first: name.split(' ')[0], sub: 'Patron', bg: tone(hue, 0.88, 0.04) };
    }
    const a = this.artistOf(t);
    return { name: a.name, first: a.first, sub: a.studio, bg: a.bg };
  }

  protected openBox(box: 'incoming' | 'outgoing') {
    this.box.set(box);
    // Side by side, open the tab's first conversation. On phones, stay on the list.
    if (!matchMedia('(min-width: 1024px)').matches) return;
    const first = (box === 'incoming' ? this.store.inbox() : this.store.threads())[0];
    void this.router.navigate(first ? ['/messages', first.id] : ['/messages']);
  }

  /** Incoming, accepted: attach a contract (templates are coming soon). */
  protected createContract(t: Thread) {
    const name = t.patron?.name ?? '';
    openContractDialog(this.dialog, name).closed$.subscribe((file) => {
      if (!file) return;
      this.store.sendMessage(t.id, `Contract attached: ${file}`);
      this.store.setStatus(t.id, 'Awaiting signature');
      this.artist.remind(name);
    });
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
        sub: 'Scope, timeline, revisions and delivery, agreed in writing.',
        done: signed,
        active: !signed,
        cta: 'Review & sign',
        mode: 'contract' as const,
      },
      {
        n: '2',
        title: 'Pay the deposit',
        sub: `${money(m.deposit)} today (30%). The rest is due on delivery.`,
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
    const ref = this.dialog.open<boolean, DealContext>(DealDialog, {
      context: { mode, artistName: a.name, deal },
      contentClass: 'sm:max-w-[480px] rounded-4xl p-8',
    });
    ref.closed$.subscribe((ok) => {
      if (ok)
        this.store.updateContract(t.id, mode === 'contract' ? { signed: true } : { paid: true });
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
