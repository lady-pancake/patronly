import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideSlidersHorizontal } from '@ng-icons/lucide';

export interface FilterGroup {
  label: string;
  values: string[];
}

/**
 * One "6 filters" button that opens a small panel listing the chosen criteria,
 * so a long row of chips doesn't push results down the page.
 */
@Component({
  selector: 'app-filter-summary',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucideSlidersHorizontal })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative self-start',
    '(document:click)': 'closeIfOutside($event)',
    '(keydown.escape)': 'close()',
  },
  templateUrl: './filter-summary.html',
})
export class FilterSummary {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly groups = input.required<FilterGroup[]>();
  readonly edit = output<void>();

  protected readonly open = signal(false);
  protected readonly panelId = `filters-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly chosen = computed(() => this.groups().filter((g) => g.values.length));
  protected readonly count = computed(() => this.chosen().reduce((n, g) => n + g.values.length, 0));

  protected close() {
    if (!this.open()) return;
    this.open.set(false);
    this.host.nativeElement.querySelector('button')?.focus();
  }

  protected editCriteria() {
    this.open.set(false);
    this.edit.emit();
  }

  protected closeIfOutside(event: Event) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
