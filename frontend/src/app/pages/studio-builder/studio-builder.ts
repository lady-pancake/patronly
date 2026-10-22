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
import { CleanText } from '../../shared/clean-text';
import { Stepper } from '../../shared/stepper';

const LAST = STEP_LABELS.length; // the review step

/** The six-step studio builder, then a review before previewing. */
@Component({
  selector: 'app-studio-builder',
  imports: [CleanText, Stepper, FormsModule, RouterLink, NgIcon, WorkStep],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck, lucideMinus, lucidePlus, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col bg-background' },
  templateUrl: './studio-builder.html',
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
