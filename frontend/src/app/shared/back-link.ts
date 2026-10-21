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
  templateUrl: './back-link.html',
})
export class BackLink {
  readonly to = input.required<string | unknown[]>();
}
