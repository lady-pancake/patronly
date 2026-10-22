import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Numbered steps, used by the studio builder and the new search. Steps before
 * `current` show a tick; when `current` is past the last step, all of them do.
 */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto py-2' },
  template: `
    @for (label of labels(); track label; let i = $index) {
      @let cur = i === current();
      @let done = i < current();
      <button
        type="button"
        (click)="go.emit(i)"
        [attr.aria-current]="cur ? 'step' : null"
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium whitespace-nowrap"
        [class]="
          (cur ? 'bg-secondary ' : '') + (cur || done ? 'text-foreground' : 'text-muted-foreground')
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
  `,
})
export class Stepper {
  readonly labels = input.required<readonly string[]>();
  readonly current = input.required<number>();
  readonly go = output<number>();
}
