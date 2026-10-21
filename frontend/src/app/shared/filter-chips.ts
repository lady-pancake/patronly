import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** A row of single-select chips. Clicking the selected chip again clears it when `clearable`. */
@Component({
  selector: 'app-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2', role: 'radiogroup' },
  templateUrl: './filter-chips.html',
})
export class FilterChips {
  readonly options = input.required<readonly string[]>();
  readonly value = model<string | null>(null);
  readonly clearable = input(false);

  protected pick(o: string) {
    this.value.set(this.clearable() && this.value() === o ? null : o);
  }
}
