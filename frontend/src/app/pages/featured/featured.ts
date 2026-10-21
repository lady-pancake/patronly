import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { artistById } from '../../core/data/catalog';
import type { Artist } from '../../core/data/models';
import { BackLink } from '../../shared/back-link';
import { InquiryLauncher } from '../../shared/inquiry/inquiry-launcher';
import { FEATURED_IDS, FEATURE_INTRO, FEATURE_NOTES } from './featured-content';

@Component({
  selector: 'app-featured',
  imports: [RouterLink, BackLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './featured.html',
})
export class Featured {
  protected readonly inquiry = inject(InquiryLauncher);
  protected readonly intro = FEATURE_INTRO;
  protected readonly notes = FEATURE_NOTES;
  protected readonly artists = FEATURED_IDS.map((id) => artistById(id) as Artist);
}
