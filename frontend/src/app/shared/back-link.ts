import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

@Component({
  selector: 'app-back-link',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'self-start' },
  template: `
    <a
      [routerLink]="to()"
      class="flex h-9 items-center gap-1.5 rounded-md pr-3.5 pl-2.5 text-[13px] font-medium hover:bg-muted"
    >
      <ng-icon name="lucideArrowLeft" size="16" />
      <ng-content />
    </a>
  `,
})
export class BackLink {
  readonly to = input.required<string | unknown[]>();
}
