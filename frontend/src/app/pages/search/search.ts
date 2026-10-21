import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { matchArtists, searchChips } from '../../core/data/catalog';
import type { WizardAnswers, WizardStep } from '../../core/data/models';
import { PatronStore } from '../../core/data/patron-store';
import { MEDIUMS, WIZARD_STEPS } from '../../core/data/seed';
import { ArtistCard } from '../../shared/artist-card';
import { answersFromParams } from '../../shared/search-params';
import { Tag } from '../../shared/tag';
import { SaveSearchDialog } from './save-search-dialog';

/** "New search": five quick questions, then matching artists. */
@Component({
  selector: 'app-search',
  imports: [NgIcon, ArtistCard, Tag],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-[1400px] px-4 pt-12 pb-24 sm:px-8">
      @if (!done()) {
        <div class="mx-auto flex max-w-[880px] flex-col gap-10">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between text-[13px] text-muted-foreground">
              <span class="font-medium">New search</span>
              <span>Step {{ step() + 1 }} of {{ steps.length }}</span>
            </div>
            <div
              class="h-1 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Search progress"
              [attr.aria-valuenow]="step() + 1"
              aria-valuemin="1"
              [attr.aria-valuemax]="steps.length"
            >
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-300 ease-soft"
                [style.width.%]="((step() + 1) / steps.length) * 100"
              ></div>
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <h1
              class="font-serif text-[clamp(40px,5vw,60px)] leading-[1.05] font-normal tracking-[-.02em]"
            >
              {{ current().q }}
            </h1>
            @if (current().help) {
              <p class="text-[15px] text-muted-foreground">{{ current().help }}</p>
            }
          </div>
          <div
            class="grid gap-3"
            [class]="
              current().multi
                ? 'grid-cols-[repeat(auto-fill,minmax(150px,1fr))]'
                : 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'
            "
            [attr.role]="current().multi ? 'group' : 'radiogroup'"
          >
            @for (o of options(); track o[0]) {
              @let on = isOn(o[0]);
              <button
                type="button"
                (click)="pick(o[0])"
                [attr.aria-pressed]="current().multi ? on : null"
                [attr.role]="current().multi ? null : 'radio'"
                [attr.aria-checked]="current().multi ? null : on"
                class="relative flex min-h-16 flex-col justify-center gap-1 rounded-3xl border-[1.5px] py-4.5 pr-11 pl-5 text-left transition-colors hover:border-ring"
                [class]="
                  on
                    ? 'border-primary bg-[color-mix(in_oklab,var(--primary)_8%,white)]'
                    : 'border-border bg-background'
                "
              >
                <span class="font-serif text-2xl leading-tight">{{ o[0] }}</span>
                @if (o[1]) {
                  <span class="text-[13px] text-muted-foreground">{{ o[1] }}</span>
                }
                @if (on) {
                  <span
                    class="absolute top-1/2 right-4 grid size-[22px] -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground"
                    ><ng-icon name="lucideCheck" size="13" strokeWidth="3"
                  /></span>
                }
              </button>
            }
          </div>
          <div class="flex items-center justify-between gap-4 border-t pt-6">
            <button
              type="button"
              (click)="back()"
              class="flex h-11 items-center gap-1.5 rounded-md pr-4.5 pl-3.5 text-sm font-medium hover:bg-muted"
            >
              <ng-icon name="lucideArrowLeft" size="16" />{{ step() > 0 ? 'Back' : 'Cancel' }}
            </button>
            <div class="flex items-center gap-4">
              @if (current().multi) {
                <button
                  type="button"
                  (click)="next()"
                  class="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-85"
                >
                  Continue
                </button>
              } @else {
                <button
                  type="button"
                  (click)="skip()"
                  class="h-11 px-2 text-sm font-medium text-muted-foreground underline underline-offset-4"
                >
                  Skip this
                </button>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col gap-10">
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div class="flex flex-col gap-4">
              <div class="eyebrow">{{ name() || 'Your search' }}</div>
              <h1
                class="font-serif text-[clamp(40px,5vw,60px)] leading-[1.05] font-normal tracking-[-.02em]"
              >
                {{ matches().length }} {{ matches().length === 1 ? 'artist' : 'artists' }}
              </h1>
              <div class="flex flex-wrap gap-2">
                @for (c of chips(); track c) {
                  <span appTag class="!h-[30px]">{{ c }}</span>
                } @empty {
                  <span appTag class="!h-[30px]">Anything goes</span>
                }
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="step.set(0)"
                class="h-10 rounded-md border bg-background px-4.5 text-sm font-medium hover:bg-muted"
              >
                Edit criteria
              </button>
              <button
                type="button"
                (click)="save()"
                [disabled]="isSaved()"
                class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-85 disabled:opacity-60"
              >
                {{ isSaved() ? 'Saved' : 'Save this search' }}
              </button>
            </div>
          </div>
          @if (!matches().length) {
            <p class="font-serif text-2xl text-muted-foreground italic">
              No one matches all of that yet. Try widening your budget or medium.
            </p>
          }
          <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-10">
            @for (a of matches(); track a.id) {
              <app-artist-card [artist]="a" variant="full" />
            }
          </div>
        </div>
      }
    </main>
  `,
})
export class Search {
  private readonly router = inject(Router);
  private readonly store = inject(PatronStore);
  private readonly dialog = inject(HlmDialogService);
  private readonly params = toSignal(inject(ActivatedRoute).queryParams, {
    initialValue: {} as Record<string, string>,
  });

  protected readonly steps = WIZARD_STEPS;
  protected readonly answers = signal<WizardAnswers>(answersFromParams(this.params()));
  protected readonly step = signal(this.params()['results'] ? WIZARD_STEPS.length : 0);
  protected readonly name = signal<string>(this.params()['name'] ?? '');

  protected readonly done = computed(() => this.step() >= this.steps.length);
  protected readonly current = computed<WizardStep>(
    () => this.steps[Math.min(this.step(), this.steps.length - 1)],
  );
  protected readonly options = computed<[string, string][]>(() =>
    this.current().key === 'mediums'
      ? MEDIUMS.map((m) => [m.name, ''])
      : (this.current().options ?? []),
  );
  protected readonly matches = computed(() => matchArtists(this.answers()));
  protected readonly chips = computed(() => searchChips(this.answers()));
  private readonly sig = computed(() => this.chips().join('|'));
  protected readonly isSaved = computed(() => this.store.saved().some((s) => s.sig === this.sig()));

  protected isOn(label: string) {
    const st = this.current(),
      a = this.answers();
    return st.key === 'mediums' ? a.mediums.includes(label) : a[st.key] === label;
  }

  protected pick(label: string) {
    const st = this.current();
    if (st.key === 'mediums') {
      this.answers.update((a) => ({
        ...a,
        mediums: a.mediums.includes(label)
          ? a.mediums.filter((m) => m !== label)
          : [...a.mediums, label],
      }));
      return;
    }
    const on = this.isOn(label);
    this.answers.update((a) => ({ ...a, [st.key]: on ? null : label }));
    if (!on) this.next();
  }

  protected next() {
    this.step.update((s) => s + 1);
  }

  protected skip() {
    this.answers.update((a) => ({ ...a, [this.current().key]: null }));
    this.next();
  }

  protected back() {
    if (this.step() > 0) this.step.update((s) => s - 1);
    else void this.router.navigateByUrl('/');
  }

  protected save() {
    const a = this.answers();
    const suggested =
      (a.mediums.length ? a.mediums.slice(0, 2).join(' or ') : 'Any medium') +
      (a.purpose ? ' · ' + a.purpose.toLowerCase() : '');
    this.dialog
      .open<string, { name: string }>(SaveSearchDialog, {
        context: { name: this.name() || suggested },
        contentClass: 'sm:max-w-[440px] rounded-4xl p-8',
      })
      .closed$.subscribe((name) => {
        if (!name) return;
        this.name.set(name);
        this.store.saveSearch({
          name,
          sig: this.sig(),
          wiz: { ...a },
          ids: this.matches()
            .slice(0, 3)
            .map((m) => m.id),
        });
      });
  }
}
