import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck, lucideMinus, lucidePlus, lucideX } from '@ng-icons/lucide';
import { ArtistStore } from '../../core/data/artist-store';
import { fmt } from '../../core/data/catalog';
import { MEDIUMS, ROLE } from '../../core/data/seed';
import {
  AVAIL_CHOICES,
  type CommissionType,
  PRESET_TAGS,
  STEP_LABELS,
  type StudioDraft,
  draftRange,
  rangeLabel,
  stepValidity,
  wordCount,
} from '../../core/data/studio-draft';
import { WorkStep } from './work-step';

const LAST = STEP_LABELS.length; // the review step

/** The six-step studio builder, then a review before previewing. */
@Component({
  selector: 'app-studio-builder',
  imports: [FormsModule, RouterLink, NgIcon, WorkStep],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck, lucideMinus, lucidePlus, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col bg-background' },
  template: `
    <header class="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-md">
      <div
        class="mx-auto flex min-h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-8"
      >
        <a routerLink="/" class="shrink-0 font-serif text-[26px] tracking-tight">Patronly</a>
        <nav
          class="no-scrollbar hidden min-w-0 gap-1.5 overflow-x-auto md:flex"
          aria-label="Studio builder steps"
        >
          @for (label of labels; track label; let i = $index) {
            @let cur = i === step() && step() < last;
            @let done = i < step() || step() === last;
            <button
              type="button"
              (click)="go(i)"
              [attr.aria-current]="cur ? 'step' : null"
              class="flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium whitespace-nowrap"
              [class]="
                (cur ? 'bg-secondary ' : '') +
                (cur || done ? 'text-foreground' : 'text-muted-foreground')
              "
            >
              <span
                class="grid size-[22px] place-items-center rounded-full text-[11px] font-semibold"
                [class]="
                  done
                    ? 'bg-primary text-background'
                    : cur
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-muted-foreground'
                "
                >{{ done ? '✓' : i + 1 }}</span
              >{{ label }}
            </button>
          }
        </nav>
        <button
          type="button"
          (click)="exit()"
          class="h-9 shrink-0 rounded-md border bg-background px-4 text-[13px] font-medium hover:bg-muted"
        >
          Save &amp; exit
        </button>
      </div>
    </header>

    <main
      class="mx-auto flex w-full max-w-[820px] flex-1 flex-col px-4 pt-10 pb-24 sm:px-8 sm:pt-14"
    >
      <div class="flex min-w-0 flex-col gap-9">
        <div class="flex flex-col gap-2.5">
          <span class="text-[13px] text-muted-foreground">{{ stepLabel() }}</span>
          <div class="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              class="h-full rounded-full bg-primary transition-[width] duration-300 ease-soft"
              [style.width.%]="progress()"
            ></div>
          </div>
        </div>

        @switch (step()) {
          @case (0) {
            <div class="flex flex-col gap-7">
              <h1 [class]="h1">Let’s build your <em>studio.</em></h1>
              <div class="grid gap-5 sm:grid-cols-2">
                <label class="flex flex-col gap-2"
                  ><span class="text-[13px] font-semibold">Your name</span
                  ><input
                    class="field"
                    [ngModel]="d().name"
                    (ngModelChange)="set('name', $event)"
                    placeholder="e.g. Maren Oduya"
                /></label>
                <label class="flex flex-col gap-2"
                  ><span class="text-[13px] font-semibold">Studio name</span
                  ><input
                    class="field"
                    [ngModel]="d().studio"
                    (ngModelChange)="set('studio', $event)"
                    placeholder="e.g. Oduya Portrait Studio"
                /></label>
              </div>
              <label class="flex flex-col gap-2"
                ><span class="text-[13px] font-semibold">Where are you based?</span
                ><input
                  class="field"
                  [ngModel]="d().city"
                  (ngModelChange)="set('city', $event)"
                  placeholder="City, country"
              /></label>
              <label class="flex flex-col gap-2"
                ><span class="text-[13px] font-semibold"
                  >Website or portfolio
                  <span class="font-normal text-muted-foreground">Optional</span></span
                ><input
                  class="field"
                  inputmode="url"
                  [ngModel]="d().website"
                  (ngModelChange)="set('website', $event)"
                  placeholder="https://"
              /></label>
            </div>
          }

          @case (1) {
            <div class="flex flex-col gap-7">
              <div class="flex flex-col gap-2.5">
                <h1 [class]="h1">What do you <em>do?</em></h1>
                <p [class]="lead">
                  Pick everything that describes your work. Patrons will find you under each one.
                </p>
              </div>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                @for (m of mediums; track m) {
                  @let on = d().mediums.includes(m);
                  <button
                    type="button"
                    (click)="toggleMedium(m)"
                    [attr.aria-pressed]="on"
                    [class]="card(on)"
                  >
                    <span class="font-serif text-[22px] leading-[1.1]">{{ role[m] ?? m }}</span>
                    @if (on) {
                      <span [class]="tick"><ng-icon name="lucideCheck" size="12" /></span>
                    }
                  </button>
                }
              </div>
              <div class="flex flex-col gap-3">
                <span class="text-[13px] font-semibold"
                  >Anything else patrons should know?
                  <span class="font-normal text-muted-foreground">Optional</span></span
                >
                <div class="flex flex-wrap gap-2">
                  @for (t of allTags(); track t) {
                    @let on = d().tags.includes(t);
                    @let mine = d().customTags.includes(t);
                    <button
                      type="button"
                      (click)="toggleTag(t)"
                      [attr.aria-pressed]="on"
                      class="flex h-[38px] items-center gap-1.5 rounded-full border pl-4 text-[13px] font-medium"
                      [class]="
                        (on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted') +
                        (mine ? ' pr-2' : ' pr-4')
                      "
                    >
                      {{ t }}
                      @if (mine) {
                        <span
                          role="button"
                          tabindex="0"
                          title="Delete"
                          [attr.aria-label]="'Delete ' + t"
                          (click)="deleteTag(t, $event)"
                          (keydown.enter)="deleteTag(t, $event)"
                          class="grid size-[22px] place-items-center rounded-full opacity-70 hover:bg-black/10 hover:opacity-100"
                          ><ng-icon name="lucideX" size="12"
                        /></span>
                      }
                    </button>
                  }
                  <span
                    class="flex h-[38px] items-center rounded-md border border-dashed bg-background pr-1 pl-3.5"
                  >
                    <input
                      [(ngModel)]="tagDraft"
                      (keydown.enter)="addTag(); $event.preventDefault()"
                      placeholder="Add your own"
                      aria-label="Add your own option"
                      class="w-[120px] bg-transparent text-[13px] outline-none"
                    />
                    <button
                      type="button"
                      (click)="addTag()"
                      title="Add"
                      aria-label="Add"
                      class="grid size-[30px] place-items-center rounded-full"
                      [class]="
                        tagDraft().trim()
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      "
                    >
                      <ng-icon name="lucidePlus" size="14" />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          }

          @case (2) {
            <div class="flex flex-col gap-7">
              <h1 [class]="h1">Tell your <em>story.</em></h1>
              <label class="flex flex-col gap-2">
                <span class="flex justify-between gap-3"
                  ><span class="text-[13px] font-semibold">About you</span
                  ><span class="text-xs text-muted-foreground"
                    >{{ words() }} words · 80–200 works well</span
                  ></span
                >
                <textarea
                  rows="7"
                  [ngModel]="d().bio"
                  (ngModelChange)="set('bio', $event)"
                  placeholder="I trained in… My studio is… Every commission starts with…"
                  class="field !h-auto resize-y rounded-3xl !py-4 leading-relaxed"
                ></textarea>
              </label>
              <div class="flex flex-col gap-2.5">
                <label class="flex flex-col gap-2"
                  ><span class="text-[13px] font-semibold">A line in your own words</span
                  ><input
                    class="field"
                    [ngModel]="d().quote"
                    (ngModelChange)="set('quote', $event)"
                    placeholder="e.g. I paint people the way their closest friends see them."
                /></label>
                <span class="text-xs text-muted-foreground"
                  >This appears large on your studio page, signed with your first name.</span
                >
              </div>
            </div>
          }

          @case (3) {
            <div class="flex flex-col gap-7">
              <h1 [class]="h1">Add samples of your <em>work.</em></h1>
              <app-work-step />
            </div>
          }

          @case (4) {
            <div class="flex flex-col gap-7">
              <div class="flex flex-col gap-2.5">
                <h1 [class]="h1">Set your <em>prices.</em></h1>
                <p [class]="lead">
                  Price each type of commission you offer. Your overall range is worked out for you,
                  and you can still quote each piece exactly in Messages.
                </p>
              </div>
              <div
                class="flex flex-wrap items-end justify-between gap-4 rounded-4xl bg-surface px-6 py-5"
              >
                <span class="flex flex-col gap-1"
                  ><span class="text-[13px] font-semibold">Your price range</span
                  ><span class="text-xs text-muted-foreground"
                    >Set from your types below. This shows on your card in search.</span
                  ></span
                >
                <span
                  class="font-serif text-4xl leading-none"
                  [class.text-muted-foreground]="!range()"
                  >{{ range() ?? '$0 – $0' }}</span
                >
              </div>
              <div class="flex flex-col gap-3">
                <span class="eyebrow !text-[11px]">Price by type</span>
                <span class="-mt-1 text-[13px] text-muted-foreground"
                  >Define the kinds of commission you offer, like Small, Medium and Large, or
                  Portrait, Pet and Family. These are the same types you’ll plan in your
                  calendar.</span
                >
                <div class="flex flex-col overflow-hidden rounded-3xl ring-1 ring-border">
                  @for (t of d().types; track t.id; let k = $index) {
                    <div
                      class="flex flex-wrap items-center justify-between gap-4 border-b px-4.5 py-3.5 last:border-b-0"
                    >
                      <input
                        [ngModel]="t.name"
                        (ngModelChange)="setType(k, { name: $event })"
                        placeholder="Name this type"
                        aria-label="Type name"
                        [class]="typeName"
                      />
                      <span class="flex shrink-0 flex-col gap-1.5">
                        <span class="text-[11px] text-muted-foreground">Price</span>
                        <span class="flex items-center gap-1.5">
                          @for (key of priceKeys; track key; let first = $first) {
                            @if (!first) {
                              <span class="text-muted-foreground">–</span>
                            }
                            <span class="relative block w-[104px]">
                              <span
                                class="absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-muted-foreground"
                                >$</span
                              >
                              <input
                                inputmode="numeric"
                                [ngModel]="t[key]"
                                (ngModelChange)="setPrice(k, key, $event)"
                                [placeholder]="placeholder(k, key)"
                                [attr.aria-label]="(t.name || 'Type') + (first ? ' from' : ' to')"
                                class="field !h-9 !pr-2.5 !pl-6 !text-sm"
                              />
                            </span>
                          }
                        </span>
                      </span>
                      @if (d().types.length > 1) {
                        <button
                          type="button"
                          (click)="removeType(k)"
                          title="Remove type"
                          aria-label="Remove type"
                          [class]="removeBtn"
                        >
                          <ng-icon name="lucideX" size="16" />
                        </button>
                      }
                    </div>
                  }
                </div>
                @if (d().types.length < 6) {
                  <button type="button" (click)="addType()" [class]="addBtn">
                    <ng-icon name="lucidePlus" size="14" />Add a type
                  </button>
                }
              </div>
            </div>
          }

          @case (5) {
            <div class="flex flex-col gap-8">
              <div class="flex flex-col gap-2.5">
                <h1 [class]="h1">Plan your <em>calendar.</em></h1>
                <p [class]="lead">Set how much work you can take on.</p>
              </div>
              <div class="flex flex-col gap-3">
                <span class="eyebrow !text-[11px]">Your studio time</span>
                <div
                  class="flex items-center justify-between gap-4 rounded-3xl px-4.5 py-3.5 ring-1 ring-border"
                >
                  <span class="flex min-w-0 flex-col gap-0.5"
                    ><span class="font-semibold">Hours per week for commissions</span
                    ><span class="text-xs text-muted-foreground"
                      >The time you can give to patron work, not counting your own projects</span
                    ></span
                  >
                  <span class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      (click)="setHours(-5)"
                      title="Less"
                      aria-label="Fewer hours"
                      [class]="stepBtn + ' size-9'"
                    >
                      <ng-icon name="lucideMinus" size="14" />
                    </button>
                    <span class="flex min-w-[84px] flex-col text-center leading-none"
                      ><span class="font-serif text-[28px]">{{ d().hoursPerWeek }}</span
                      ><span class="mt-0.5 text-[11px] text-muted-foreground"
                        >hrs / week</span
                      ></span
                    >
                    <button
                      type="button"
                      (click)="setHours(5)"
                      title="More"
                      aria-label="More hours"
                      [class]="stepBtn + ' size-9'"
                    >
                      <ng-icon name="lucidePlus" size="14" />
                    </button>
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <span class="eyebrow !text-[11px]">Capacity by type</span>
                <span class="-mt-1 text-[13px] text-muted-foreground"
                  >A type can mean anything you like: a size, a format, or a kind of piece.</span
                >
                <div class="flex flex-col overflow-hidden rounded-3xl ring-1 ring-border">
                  @for (t of d().types; track t.id; let k = $index) {
                    <div
                      class="flex flex-wrap items-center justify-between gap-4 border-b px-4.5 py-3.5 last:border-b-0"
                    >
                      <input
                        [ngModel]="t.name"
                        (ngModelChange)="setType(k, { name: $event })"
                        placeholder="Name this type"
                        aria-label="Type name"
                        [class]="typeName"
                      />
                      <span class="flex shrink-0 flex-col items-center gap-1.5">
                        <span class="text-[11px] text-muted-foreground">Total studio time</span>
                        <span class="flex items-center gap-1">
                          <button
                            type="button"
                            (click)="stepTypeHours(k, -1)"
                            title="Less"
                            [attr.aria-label]="'Fewer hours for ' + (t.name || 'this type')"
                            [class]="stepBtn + ' size-8'"
                          >
                            <ng-icon name="lucideMinus" size="14" />
                          </button>
                          <span class="flex min-w-16 flex-col text-center leading-none"
                            ><span class="font-serif text-[26px]">{{ t.hours }}</span
                            ><span class="mt-0.5 text-[11px] text-muted-foreground"
                              >hrs total</span
                            ></span
                          >
                          <button
                            type="button"
                            (click)="stepTypeHours(k, 1)"
                            title="More"
                            [attr.aria-label]="'More hours for ' + (t.name || 'this type')"
                            [class]="stepBtn + ' size-8'"
                          >
                            <ng-icon name="lucidePlus" size="14" />
                          </button>
                        </span>
                      </span>
                      @if (d().types.length > 1) {
                        <button
                          type="button"
                          (click)="removeType(k)"
                          title="Remove type"
                          aria-label="Remove type"
                          [class]="removeBtn"
                        >
                          <ng-icon name="lucideX" size="16" />
                        </button>
                      }
                    </div>
                  }
                </div>
                @if (d().types.length < 6) {
                  <button type="button" (click)="addType()" [class]="addBtn">
                    <ng-icon name="lucidePlus" size="14" />Add a type
                  </button>
                }
              </div>

              <div class="flex flex-col gap-3">
                <span class="eyebrow !text-[11px]">Right now</span>
                <div class="grid gap-2.5">
                  @for (o of availChoices; track o.id) {
                    @let on = d().avail === o.id;
                    <button
                      type="button"
                      (click)="set('avail', o.id)"
                      [attr.aria-pressed]="on"
                      [class]="card(on)"
                    >
                      <span class="font-serif text-[22px] leading-[1.1]">{{ o.label }}</span>
                      <span class="text-xs text-muted-foreground">{{ o.sub }}</span>
                      @if (on) {
                        <span [class]="tick"><ng-icon name="lucideCheck" size="12" /></span>
                      }
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          @default {
            <div class="flex flex-col gap-7">
              <div class="flex flex-col gap-2.5">
                <h1 [class]="h1">Your studio is <em>ready.</em></h1>
                <p [class]="lead">
                  Preview it first to see exactly what patrons will see. When you make it public,
                  patrons can find you in search and send inquiries straight away.
                </p>
              </div>
              <div class="flex flex-col overflow-hidden rounded-3xl ring-1 ring-border">
                @for (c of checklist(); track c.label; let i = $index) {
                  <button
                    type="button"
                    (click)="go(i)"
                    class="flex items-center gap-3.5 border-t px-4.5 py-3.5 text-left first:border-t-0 hover:bg-muted"
                  >
                    <span
                      class="grid size-[22px] shrink-0 place-items-center rounded-full text-primary-foreground"
                      [class]="c.ok ? 'bg-primary' : 'bg-border'"
                      ><ng-icon name="lucideCheck" size="12"
                    /></span>
                    <span class="flex min-w-0 flex-1 flex-col"
                      ><span class="font-semibold">{{ c.label }}</span
                      ><span class="truncate text-xs text-muted-foreground">{{ c.sub }}</span></span
                    >
                    <span class="text-xs text-muted-foreground underline underline-offset-3"
                      >Edit</span
                    >
                  </button>
                }
              </div>
            </div>
          }
        }

        <div class="flex items-center justify-between gap-4 border-t pt-6">
          <button
            type="button"
            (click)="go(step() - 1)"
            class="flex h-11 items-center gap-1.5 rounded-md pr-4.5 pl-3.5 text-sm font-medium hover:bg-muted"
            [class.invisible]="step() === 0"
          >
            <ng-icon name="lucideArrowLeft" size="16" />Back
          </button>
          <button
            type="button"
            (click)="next()"
            [attr.aria-disabled]="!canContinue()"
            class="h-12 rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground hover:opacity-85"
            [class.opacity-40]="!canContinue()"
          >
            {{ nextLabel() }}
          </button>
        </div>
        @if (hint()) {
          <p class="-mt-6 text-right text-xs text-muted-foreground" role="status">{{ hint() }}</p>
        }
      </div>
    </main>
  `,
})
export class StudioBuilder {
  private readonly store = inject(ArtistStore);
  private readonly router = inject(Router);

  /** Query param: which step is open (0–5, or 6 for review). */
  readonly stepParam = input<string | undefined>(undefined, { alias: 'step' });

  protected readonly labels = STEP_LABELS;
  protected readonly last = LAST;
  protected readonly mediums = MEDIUMS.map((m) => m.name);
  protected readonly role: Partial<Record<string, string>> = ROLE;
  protected readonly availChoices = AVAIL_CHOICES;
  protected readonly priceKeys = ['from', 'to'] as const;

  protected readonly h1 =
    'font-serif text-[clamp(40px,4.5vw,56px)] leading-[1.05] font-normal tracking-[-.02em]';
  protected readonly lead = 'text-[15px] leading-relaxed text-muted-foreground';
  protected readonly tick =
    'absolute top-1/2 right-3.5 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground';
  protected readonly typeName =
    'h-9 min-w-0 flex-[1_1_160px] -ml-1 rounded-md border bg-background px-3 text-sm font-semibold outline-none focus:border-ring';
  protected readonly stepBtn =
    'grid place-items-center rounded-full border bg-background hover:bg-muted';
  protected readonly removeBtn =
    'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground';
  protected readonly addBtn =
    'flex h-9 items-center gap-1.5 self-start rounded-md border border-dashed bg-background pr-4 pl-3 text-[13px] font-medium hover:bg-muted';

  protected readonly d = this.store.draft;
  protected readonly tagDraft = signal('');
  /** Shown under Continue when the step is missing something. */
  protected readonly hint = signal('');

  protected readonly step = computed(() => {
    const n = Number(this.stepParam() ?? 0);
    return Number.isInteger(n) ? Math.min(Math.max(n, 0), LAST) : 0;
  });
  protected readonly valid = computed(() => stepValidity(this.d()));
  protected readonly canContinue = computed(() =>
    this.step() === LAST ? this.valid().every(Boolean) : this.valid()[this.step()],
  );
  protected readonly stepLabel = computed(() =>
    this.step() < LAST
      ? `Step ${this.step() + 1} of ${LAST} · ${STEP_LABELS[this.step()]}`
      : 'Review',
  );
  protected readonly progress = computed(() => ((this.step() + 1) / (LAST + 1)) * 100);
  protected readonly nextLabel = computed(() =>
    this.step() === LAST
      ? this.store.published()
        ? 'Preview changes'
        : 'Preview my studio'
      : this.step() === LAST - 1
        ? 'Review'
        : 'Continue',
  );
  protected readonly words = computed(() => wordCount(this.d().bio));
  protected readonly range = computed(() => rangeLabel(this.d()));
  protected readonly allTags = computed(() => [
    ...new Set([...PRESET_TAGS, ...this.d().customTags]),
  ]);

  protected readonly checklist = computed(() => {
    const d = this.d();
    const ok = this.valid();
    const { min, max } = draftRange(d);
    const avail = AVAIL_CHOICES.find((a) => a.id === d.avail)?.label.toLowerCase() ?? '';
    const subs = [
      `${d.name || '—'} · ${d.studio || 'No studio name'} · ${d.city || 'No city'}`,
      [...d.mediums, ...d.tags].join(', ') || '—',
      d.bio.trim() ? d.bio.trim().slice(0, 70) + '…' : '—',
      `${d.pieces.length} ${d.pieces.length === 1 ? 'piece' : 'pieces'} · ${d.featured.length} on your card`,
      min && max > min ? `${fmt(min)} – ${fmt(max)}` : 'Add a price to at least one type',
      `${d.hoursPerWeek} hrs / week · ${avail}`,
    ];
    return STEP_LABELS.map((label, i) => ({ label, sub: subs[i], ok: ok[i] }));
  });

  protected card(on: boolean) {
    return (
      'relative flex min-h-[60px] flex-col justify-center gap-[3px] rounded-3xl border-[1.5px] py-3.5 pr-10 pl-4.5 text-left hover:border-ring ' +
      (on ? 'border-primary bg-[color-mix(in_oklab,var(--primary)_8%,white)]' : 'bg-background')
    );
  }

  protected go(i: number) {
    this.hint.set('');
    void this.router.navigate([], { queryParams: { step: Math.min(Math.max(i, 0), LAST) } });
  }

  protected next() {
    if (!this.canContinue()) {
      this.hint.set(this.missing());
      return;
    }
    if (this.step() < LAST) {
      this.go(this.step() + 1);
      return;
    }
    this.store.startPreview();
    void this.router.navigateByUrl('/artists/me');
  }

  private missing(): string {
    const at = this.step() === LAST ? this.valid().findIndex((v) => !v) : this.step();
    const what = [
      'Add your name to continue.',
      'Pick at least one medium to continue.',
      'Write a few lines about yourself to continue.',
      '',
      'Add a price range to at least one type to continue.',
      '',
    ][at];
    return this.step() === LAST ? `${STEP_LABELS[at]}: ${what}` : what;
  }

  protected exit() {
    void this.router.navigateByUrl(this.store.published() ? '/artists/me' : '/dashboard');
  }

  protected set<K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) {
    this.hint.set('');
    this.store.update({ [key]: value } as Partial<StudioDraft>);
  }

  protected toggleMedium(m: string) {
    const ms = this.d().mediums;
    this.set('mediums', ms.includes(m) ? ms.filter((x) => x !== m) : [...ms, m]);
  }

  protected toggleTag(t: string) {
    const tags = this.d().tags;
    this.set('tags', tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);
  }

  protected addTag() {
    const t = this.tagDraft().trim();
    if (!t) return;
    const d = this.d();
    this.store.update({
      customTags:
        d.customTags.includes(t) || PRESET_TAGS.includes(t) ? d.customTags : [...d.customTags, t],
      tags: d.tags.includes(t) ? d.tags : [...d.tags, t],
    });
    this.tagDraft.set('');
  }

  protected deleteTag(t: string, e: Event) {
    e.stopPropagation();
    const d = this.d();
    this.store.update({
      customTags: d.customTags.filter((x) => x !== t),
      tags: d.tags.filter((x) => x !== t),
    });
  }

  protected setType(k: number, patch: Partial<CommissionType>) {
    this.set(
      'types',
      this.d().types.map((t, j) => (j === k ? { ...t, ...patch } : t)),
    );
  }

  protected setPrice(k: number, key: 'from' | 'to', value: string) {
    this.setType(k, { [key]: String(value ?? '').replace(/[^0-9]/g, '') });
  }

  private readonly autoPrices = [50, 200, 600, 1500, 4000, 10000, 25000];
  protected placeholder(k: number, key: 'from' | 'to') {
    const a = this.autoPrices;
    return String(key === 'from' ? (a[k] ?? a[6]) : (a[k + 1] ?? a[6] * 2));
  }

  protected addType() {
    this.set('types', [
      ...this.d().types,
      { id: `t${Date.now()}`, name: '', from: '', to: '', weeks: 4, hours: 20 },
    ]);
  }

  protected removeType(k: number) {
    this.set(
      'types',
      this.d().types.filter((_, j) => j !== k),
    );
  }

  protected setHours(delta: number) {
    this.set('hoursPerWeek', Math.min(80, Math.max(5, this.d().hoursPerWeek + delta)));
  }

  /** Small steps for short pieces, bigger ones for long pieces. */
  protected stepTypeHours(k: number, dir: 1 | -1) {
    const v = this.d().types[k].hours;
    const size = (x: number) => (x < 20 ? 1 : x < 100 ? 5 : 10);
    const next = dir > 0 ? Math.min(1000, v + size(v)) : Math.max(1, v - size(v - 1));
    this.setType(k, { hours: next });
  }
}
