import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** A row of single-select chips. Clicking the selected chip again clears it when `clearable`. */
@Component({
  selector: 'app-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-wrap gap-2', role: 'radiogroup' },
  template: `
    @for (o of options(); track o) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="value() === o"
        (click)="pick(o)"
        class="h-7 rounded-md border px-2.5 text-xs font-medium transition-colors"
        [class]="
          value() === o
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:bg-muted'
        "
      >
        {{ o }}
      </button>
    }
  `,
})
export class FilterChips {
  readonly options = input.required<readonly string[]>();
  readonly value = model<string | null>(null);
  readonly clearable = input(false);

  protected pick(o: string) {
    this.value.set(this.clearable() && this.value() === o ? null : o);
  }
}
