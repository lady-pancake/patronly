import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideUpload, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import type { Artist, CommissionTerms, Inquiry } from '../../core/data/models';
import { CleanText } from '../../shared/clean-text';
import { CONTRACT_TYPES, isContractFile } from '../../shared/contract-file';
import { Stepper } from '../../shared/stepper';
import { yearView } from '../dashboard/dashboard-data';
import { contractText, isoIn, longDate, money } from './accept-terms';

export interface AcceptContext {
  patron: string;
  inq: Inquiry;
  artist: Artist;
  /** Revising a sent contract: the terms sent before and the patron's suggested changes. */
  revise?: AcceptResult & { changes: string };
}

export interface AcceptResult {
  piece: string;
  total: number;
  terms: CommissionTerms;
}

const STEPS = ['Scope', 'Dates', 'Contract', 'Review'] as const;
const DELIVERY: CommissionTerms['delivery'][] = ['Pickup', 'Shipping', 'Digital file'];

/** A rough price from the patron's budget, e.g. "$3k–$4k" gives 3,500. */
export function priceFromBudget(budget: string | null, fallback: number): number {
  const nums = [...(budget ?? '').matchAll(/\$?([\d.]+)\s*k/gi)].map((m) => Number(m[1]) * 1000);
  if (!nums.length) return fallback;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length / 50) * 50;
}

/**
 * Accepting a commission: agree the scope and dates, attach a contract, then send it
 * all to the patron in one go.
 */
@Component({
  selector: 'app-accept-dialog',
  imports: [BrnDialogTitle, FormsModule, NgIcon, Stepper, CleanText],
  providers: [provideIcons({ lucideFileText, lucideUpload, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-dialog.html',
})
export class AcceptDialog {
  protected readonly ref = inject<BrnDialogRef<AcceptResult | undefined>>(BrnDialogRef);
  protected readonly ctx = injectBrnDialogContext<AcceptContext>();
  protected readonly steps = STEPS;
  protected readonly deliveries = DELIVERY;
  protected readonly accept = CONTRACT_TYPES.join(',');
  protected readonly money = money;
  protected readonly longDate = longDate;
  private readonly prev = this.ctx.revise;
  /** Revisions open on the contract step, where the patron's changes usually land. */
  protected readonly step = signal(this.prev ? 2 : 0);

  // Scope
  protected readonly piece = signal(
    this.prev?.piece ?? `Commission for ${this.ctx.patron.split(' ')[0]}`,
  );
  protected readonly size = signal(this.prev?.terms.size ?? this.ctx.inq.type ?? '');
  protected readonly medium = signal(this.prev?.terms.medium ?? this.ctx.artist.medium);
  protected readonly price = signal(
    this.prev?.total ?? priceFromBudget(this.ctx.inq.budget, this.ctx.artist.min),
  );
  protected readonly depositPct = signal(this.prev?.terms.depositPct ?? 30);
  protected readonly revisions = signal(this.prev?.terms.revisions ?? 2);
  protected readonly delivery = signal<CommissionTerms['delivery']>(
    this.prev?.terms.delivery ?? 'Shipping',
  );
  protected readonly notes = signal(this.prev?.terms.notes ?? '');

  // Dates
  protected readonly startDate = signal(this.prev?.terms.startDate ?? isoIn(14));
  protected readonly dueDate = signal(this.prev?.terms.dueDate ?? isoIn(14 + 8 * 7));

  // Contract
  protected readonly contractKind = signal<'template' | 'file'>(
    this.prev?.terms.contract.kind ?? 'template',
  );
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal('');
  /** The template text, until the artist edits it. */
  private readonly edited = signal<string | null>(null);

  protected readonly deposit = computed(() => Math.round((this.price() * this.depositPct()) / 100));
  private readonly baseTerms = computed(() => ({
    size: this.size().trim(),
    medium: this.medium().trim(),
    revisions: this.revisions(),
    delivery: this.delivery(),
    notes: this.notes().trim(),
    depositPct: this.depositPct(),
    startDate: this.startDate(),
    dueDate: this.dueDate(),
  }));
  protected readonly template = computed(() =>
    contractText(
      {
        artist: this.ctx.artist.name,
        studio: this.ctx.artist.studio,
        patron: this.ctx.patron,
        piece: this.piece().trim(),
        total: this.price(),
      },
      this.baseTerms(),
    ),
  );
  protected readonly contract = computed(() => this.edited() ?? this.template());

  constructor() {
    // Keep the artist's own wording from last time, if they had changed the template.
    const old = this.prev?.terms.contract;
    if (old?.kind === 'template' && old.text !== this.template()) this.edited.set(old.text);
  }

  /** How booked each month of the agreed dates already is. */
  protected readonly busy = computed(() => {
    const [s, d] = [this.startDate(), this.dueDate()];
    if (!s || !d || d < s) return [];
    const key = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
    return yearView(0)
      .months.filter((m) => m.key >= key(s) && m.key <= key(d))
      .map((m) => ({ name: m.name, pct: m.loadPct, label: m.loadLabel }));
  });

  /** The first month of the dates that's nearly full, if any. */
  protected readonly crowded = computed(() => this.busy().find((m) => m.pct >= 90)?.name ?? null);

  protected readonly problem = computed(() => {
    switch (this.step()) {
      case 0:
        if (!this.piece().trim()) return 'Give the piece a name.';
        if (!this.size().trim()) return 'Add the size or format.';
        if (!(this.price() > 0)) return 'Set a price.';
        return '';
      case 1:
        if (!this.startDate() || !this.dueDate()) return 'Pick both dates.';
        if (this.dueDate() <= this.startDate()) return 'Delivery has to be after the start date.';
        return '';
      case 2:
        if (this.contractKind() === 'file' && !this.file()) return 'Add your contract file.';
        if (this.contractKind() === 'template' && !this.contract().trim())
          return 'The contract is empty.';
        return '';
      default:
        return '';
    }
  });

  protected next() {
    if (this.problem()) return;
    if (this.step() < STEPS.length - 1) this.step.update((s) => s + 1);
    else this.send();
  }

  protected back() {
    if (this.step() > 0) this.step.update((s) => s - 1);
    else this.ref.close();
  }

  /** Steps can be revisited, but not skipped ahead past one that isn't filled in. */
  protected goTo(i: number) {
    if (i <= this.step() || !this.problem()) this.step.set(Math.min(i, this.step() + 1));
  }

  protected editContract(text: string) {
    this.edited.set(text);
  }

  protected resetContract() {
    this.edited.set(null);
  }

  protected pick(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (!isContractFile(f)) {
      this.fileError.set('Use a PDF, Word, TXT, RTF or ODT document.');
      return;
    }
    this.fileError.set('');
    this.file.set(f);
  }

  private send() {
    const contract: CommissionTerms['contract'] =
      this.contractKind() === 'file'
        ? { kind: 'file', name: this.file()!.name }
        : { kind: 'template', text: this.contract() };
    this.ref.close({
      piece: this.piece().trim(),
      total: this.price(),
      terms: { ...this.baseTerms(), contract },
    });
  }
}
