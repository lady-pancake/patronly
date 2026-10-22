import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The numbered steps, step count and progress bar at the top of a multi-step
 * flow (the studio builder and the new search). Steps before `current` show a
 * tick; when `current` is past the last step, all of them do.
 */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-3 py-2' },
  template: `
    <div class="flex items-center justify-between gap-4">
      <nav class="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto" [attr.aria-label]="label()">
        @for (step of labels(); track step; let i = $index) {
          @let cur = i === current();
          @let done = i < current();
          <button
            type="button"
            (click)="go.emit(i)"
            [attr.aria-current]="cur ? 'step' : null"
            class="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium whitespace-nowrap"
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
            >{{ step }}
          </button>
        }
      </nav>
      <span class="shrink-0 text-[13px] text-muted-foreground max-sm:hidden">{{ count() }}</span>
    </div>
    <div
      class="h-1 overflow-hidden rounded-full bg-secondary"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="shown()"
      aria-valuemin="1"
      [attr.aria-valuemax]="labels().length"
    >
      <div
        class="h-full rounded-full bg-primary transition-[width] duration-300 ease-soft"
        [style.width.%]="(shown() / labels().length) * 100"
      ></div>
    </div>
  `,
})
export class Stepper {
  readonly labels = input.required<readonly string[]>();
  readonly current = input.required<number>();
  /** Names the steps for screen readers, e.g. "Studio builder steps". */
  readonly label = input('Steps');
  /** Shown instead of the step count once every step is done. */
  readonly doneText = input('All done');
  readonly go = output<number>();

  protected readonly shown = computed(() => Math.min(this.current() + 1, this.labels().length));
  protected readonly count = computed(() =>
    this.current() < this.labels().length
      ? `Step ${this.current() + 1} of ${this.labels().length}`
      : this.doneText(),
  );
}
