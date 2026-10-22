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
import { FilterSummary, type FilterGroup } from '../../shared/filter-summary';
import { SaveSearchDialog } from './save-search-dialog';
import { Stepper } from '../../shared/stepper';

const STEP_NAMES: Record<string, string> = {
  mediums: 'Medium',
  purpose: 'Purpose',
  size: 'Size',
  budget: 'Budget',
  timeline: 'Timeline',
};

/** "New search": five quick questions, then matching artists. */
@Component({
  selector: 'app-search',
  imports: [Stepper, NgIcon, ArtistCard, FilterSummary],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.html',
})
export class Search {
  private readonly router = inject(Router);
  protected readonly store = inject(PatronStore);
  private readonly dialog = inject(HlmDialogService);
  private readonly params = toSignal(inject(ActivatedRoute).queryParams, {
    initialValue: {} as Record<string, string>,
  });

  protected readonly steps = WIZARD_STEPS;
  protected readonly stepLabels = WIZARD_STEPS.map((s) => STEP_NAMES[s.key]);
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
  protected readonly filterGroups = computed<FilterGroup[]>(() => {
    const a = this.answers();
    const one = (v: string | null | undefined) => (v ? [v] : []);
    return [
      { label: 'Medium', values: a.mediums },
      { label: 'For', values: one(a.purpose) },
      { label: 'Size', values: one(a.size) },
      { label: 'Budget', values: one(a.budget) },
      { label: 'Timeline', values: one(a.timeline) },
    ];
  });
  private readonly sig = computed(() => this.chips().join('|'));
  /** The checked artists, when this is a saved search. */
  protected readonly list = computed(() =>
    this.name() ? this.store.searchList(this.name()) : null,
  );
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
