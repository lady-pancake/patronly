import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp, lucideCheck, lucidePartyPopper } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { artistById } from '../../core/data/catalog';
import type { AcceptedMessage, Artist, Thread, Work } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { DealDialog, type DealContext, money } from './deal-dialog';
import { STATUS_STYLE, threadStatus } from './thread-status';

@Component({
  selector: 'app-messages',
  imports: [RouterLink, FormsModule, NgIcon],
  providers: [provideIcons({ lucideArrowUp, lucideCheck, lucidePartyPopper })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-4 sm:p-8 lg:h-[calc(100dvh-73px)] lg:min-h-[600px] lg:grid-cols-[340px_minmax(0,1fr)]"
    >
      <aside class="flex min-h-0 flex-col gap-4">
        <h1 class="px-2 font-serif text-[44px] leading-none font-normal">Messages</h1>
        <nav class="flex min-h-0 flex-col gap-1 overflow-y-auto" aria-label="Conversations">
          @for (t of list(); track t.id) {
            <a
              [routerLink]="['/messages', t.id]"
              class="flex items-start gap-3 rounded-3xl p-3.5 text-left hover:bg-muted"
              [class.bg-secondary]="t.id === current()?.id"
            >
              <span class="size-11 shrink-0 rounded-full" [style.background]="t.artist.bg"></span>
              <span class="flex min-w-0 flex-1 flex-col gap-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="text-sm" [class]="t.unread ? 'font-bold' : 'font-medium'">{{
                    t.artist.name
                  }}</span>
                  <span class="shrink-0 text-[11px] text-muted-foreground">{{ t.updated }}</span>
                </span>
                <span class="truncate text-[13px]">{{ t.preview }}</span>
                <span
                  class="mt-1 inline-flex h-[22px] items-center self-start rounded-md px-2.5 text-[11px] font-semibold"
                  [style.background]="t.style.bg"
                  [style.color]="t.style.fg"
                  >{{ t.status }}</span
                >
              </span>
              @if (t.unread) {
                <span
                  class="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  aria-label="Unread"
                ></span>
              }
            </a>
          } @empty {
            <p class="p-2 text-muted-foreground">
              No conversations yet. Send an inquiry from any studio to start one.
            </p>
          }
        </nav>
      </aside>

      @if (current(); as th) {
        @let a = artistOf(th);
        @let status = statusOf(th);
        <section
          class="flex min-h-[600px] flex-col overflow-hidden rounded-4xl bg-card shadow-[0_2px_8px_oklch(0_0_0/.05)] ring-1 ring-black/6 lg:min-h-0"
        >
          <header class="flex items-center justify-between gap-4 border-b px-6 py-4">
            <a [routerLink]="['/artists', a.id]" class="flex items-center gap-3">
              <span class="size-10 rounded-full" [style.background]="a.bg"></span>
              <span class="flex flex-col">
                <span class="font-serif text-2xl leading-tight">{{ a.name }}</span>
                <span class="text-xs text-muted-foreground">{{ a.studio }}</span>
              </span>
            </a>
            <a
              [routerLink]="['/artists', a.id]"
              class="flex h-9 items-center rounded-md border bg-background px-4 text-[13px] font-medium hover:bg-muted"
              >View studio</a
            >
          </header>

          <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
            <div
              class="w-full max-w-[520px] shrink-0 self-end overflow-hidden rounded-4xl border bg-surface"
            >
              <div class="flex items-center justify-between gap-3 px-5 pt-4">
                <span class="eyebrow !text-[11px]">Commission inquiry</span>
                <span
                  class="inline-flex h-6 items-center rounded-md px-2.5 text-xs font-semibold"
                  [style.background]="styles[status].bg"
                  [style.color]="styles[status].fg"
                  >{{ status }}</span
                >
              </div>
              <div class="px-5 pt-3 font-serif text-[26px] leading-tight">
                For <em>{{ a.name }}</em>
              </div>
              <div class="flex gap-2 px-5 pt-4">
                @for (w of worksOf(th, a); track w.title) {
                  <figure class="flex w-22 shrink-0 flex-col gap-1">
                    <div class="aspect-square rounded-xl" [style.background]="w.bg"></div>
                    <figcaption class="font-serif text-[13px] leading-tight italic">
                      {{ w.title }}
                    </figcaption>
                  </figure>
                } @empty {
                  <span class="text-[13px] text-muted-foreground">No reference works selected</span>
                }
              </div>
              <dl class="mx-5 mt-4 grid grid-cols-3 rounded-2xl bg-card ring-1 ring-border">
                @for (d of detailsOf(th); track d[0]; let first = $first) {
                  <div class="flex flex-col gap-0.5 px-3.5 py-3" [class.border-l]="!first">
                    <dt class="text-[11px] text-muted-foreground">{{ d[0] }}</dt>
                    <dd class="text-[13px] font-semibold">{{ d[1] }}</dd>
                  </div>
                }
              </dl>
              @if (th.inq.msg) {
                <p class="mx-5 mt-4 text-sm leading-relaxed">{{ th.inq.msg }}</p>
              }
              <div
                class="mt-4 flex items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground"
              >
                <span>Sent {{ th.inq.date }}</span
                ><span>Artist’s range {{ a.priceLabel }}</span>
              </div>
            </div>

            @if (!th.msgs.length) {
              <p
                class="mt-2 self-center text-center font-serif text-xl text-muted-foreground italic"
              >
                {{ a.first }} hasn’t replied yet. {{ a.reply }}
              </p>
            }

            @for (m of th.msgs; track $index) {
              @if (m.type === 'accepted') {
                <div
                  class="my-4 flex w-full max-w-[600px] shrink-0 flex-col gap-1.5 self-center animate-pop-in"
                >
                  <div
                    class="relative flex flex-col gap-6 overflow-hidden rounded-4xl bg-primary p-8 text-primary-foreground shadow-[0_12px_32px_color-mix(in_oklab,#62394F_30%,transparent)]"
                  >
                    <div
                      class="absolute -top-10 -right-10 size-45 rounded-full bg-[color-mix(in_oklab,var(--sage)_55%,#62394F)]"
                    ></div>
                    <div
                      class="absolute top-[90px] right-[70px] size-14 rounded-full bg-[color-mix(in_oklab,var(--sage)_30%,#62394F)]"
                    ></div>
                    <div class="relative flex flex-col gap-2.5">
                      <span
                        class="inline-flex h-[26px] items-center gap-1.5 self-start rounded-md bg-white/15 px-3 text-xs font-semibold"
                        ><ng-icon name="lucidePartyPopper" size="13" />Commission accepted</span
                      >
                      <h3
                        class="max-w-[420px] font-serif text-[44px] leading-none font-normal tracking-[-.01em]"
                      >
                        It’s happening. <em>{{ a.first }} accepted your commission.</em>
                      </h3>
                      <span
                        class="font-hand text-[30px] leading-none text-[color-mix(in_oklab,var(--sage)_60%,white)]"
                        >let’s make something wonderful!</span
                      >
                    </div>
                    <div
                      class="relative grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/18"
                    >
                      <div class="flex flex-col gap-0.5 bg-primary px-3.5 py-3">
                        <span class="text-[11px] opacity-75">Commission</span
                        ><span class="text-[13px] font-semibold">{{ m.piece }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5 bg-primary px-3.5 py-3">
                        <span class="text-[11px] opacity-75">Agreed price</span
                        ><span class="font-serif text-2xl leading-none">{{ money(m.total) }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5 bg-primary px-3.5 py-3">
                        <span class="text-[11px] opacity-75">Delivery by</span
                        ><span class="text-[13px] font-semibold">{{ m.due }}</span>
                      </div>
                    </div>
                    <ol class="relative flex flex-col gap-1 rounded-3xl bg-white/8 p-2">
                      @for (st of stepsOf(th, a, m); track st.n) {
                        <li
                          class="flex items-center gap-3.5 p-3"
                          [class.opacity-60]="!st.done && !st.active"
                        >
                          <span
                            class="grid size-[30px] shrink-0 place-items-center rounded-full border-[1.5px] text-[13px] font-semibold"
                            [class]="
                              st.done
                                ? 'border-white bg-white text-primary'
                                : st.active
                                  ? 'border-white'
                                  : 'border-white/40'
                            "
                          >
                            @if (st.done) {
                              <ng-icon name="lucideCheck" size="14" strokeWidth="3" />
                            } @else if (st.active) {
                              {{ st.n }}
                            }
                          </span>
                          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span class="text-sm font-semibold">{{ st.title }}</span>
                            <span class="text-xs opacity-80">{{ st.sub }}</span>
                          </span>
                          @if (st.active && st.cta) {
                            <button
                              type="button"
                              (click)="openDeal(th, a, m, st.mode!)"
                              class="h-9 shrink-0 rounded-md bg-white px-4 text-[13px] font-semibold text-primary hover:opacity-90"
                            >
                              {{ st.cta }}
                            </button>
                          }
                        </li>
                      }
                    </ol>
                    @if (th.contract?.paid) {
                      <p class="relative text-center font-serif text-[22px] italic">
                        All set. The studio calendar is booked for you.
                      </p>
                    }
                  </div>
                  <span class="text-center text-[11px] text-muted-foreground">{{ m.time }}</span>
                </div>
              } @else {
                <div
                  class="flex max-w-[70%] shrink-0 flex-col gap-1"
                  [class]="m.me ? 'items-end self-end' : 'items-start self-start'"
                >
                  <div
                    class="px-4 py-3 text-sm leading-normal"
                    [class]="
                      m.me
                        ? 'rounded-[20px_20px_6px_20px] bg-primary text-primary-foreground'
                        : 'rounded-[20px_20px_20px_6px] bg-secondary'
                    "
                  >
                    {{ m.text }}
                  </div>
                  <span class="px-1.5 text-[11px] text-muted-foreground">{{ m.time }}</span>
                </div>
              }
            }
          </div>

          <form class="flex items-end gap-2 border-t px-6 py-4" (submit)="send($event, th)">
            <textarea
              name="draft"
              rows="1"
              [(ngModel)]="draft"
              (keydown.enter)="send($event, th)"
              placeholder="Write a message"
              aria-label="Write a message"
              class="max-h-[140px] min-h-11 flex-1 resize-none rounded-[22px] border border-input bg-background px-4.5 py-2.5 text-sm leading-normal outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
            ></textarea>
            <button
              type="submit"
              title="Send"
              aria-label="Send"
              [disabled]="!draft().trim()"
              class="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <ng-icon name="lucideArrowUp" size="18" />
            </button>
          </form>
        </section>
      }
    </main>
  `,
})
export class Messages {
  private readonly store = inject(PatronStore);
  private readonly dialog = inject(HlmDialogService);

  /** Route param; the first conversation opens when it's missing. */
  readonly threadId = input<string>();

  protected readonly styles = STATUS_STYLE;
  protected readonly money = money;
  protected readonly draft = signal('');

  protected readonly current = computed<Thread | undefined>(() => {
    const ts = this.store.threads();
    return ts.find((t) => t.id === this.threadId()) ?? ts[0];
  });

  protected readonly list = computed(() =>
    this.store.threads().map((t) => {
      const artist = this.artistOf(t);
      const status = threadStatus(t);
      const last = t.msgs.at(-1);
      const preview = !last
        ? 'Inquiry sent: ' + (t.inq.msg || t.inq.type || 'Commission inquiry')
        : last.type === 'accepted'
          ? `${artist.first} accepted your commission`
          : (last.me ? 'You: ' : '') + last.text;
      return { ...t, artist, status, style: STATUS_STYLE[status], preview };
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
    return artistById(t.artistId) ?? (artistById('maren') as Artist);
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
    this.draft.set('');
  }
}
