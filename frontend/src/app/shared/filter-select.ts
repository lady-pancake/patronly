import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';

/**
 * A compact labelled dropdown for one filter. It wraps a native select, so
 * phones get their own picker and keyboards work without extra code.
 */
@Component({
  selector: 'app-filter-select',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronDown })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-select.html',
})
export class FilterSelect {
  readonly label = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly value = model<string | null>(null);
}
