import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { InquiryRow } from './dashboard-data';

/** One inquiry row on the dashboard card. */
@Component({
  selector: 'app-inquiry-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 py-3 sm:grid-cols-[32px_minmax(0,1fr)_auto_auto]',
  },
  templateUrl: './inquiry-row.html',
})
export class InquiryRowView {
  readonly row = input.required<InquiryRow>();
}
