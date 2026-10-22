import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideHeart, lucideMail, lucideSparkles } from '@ng-icons/lucide';
import type { FeedEntry } from '../core/data/feed';
import { PatronStore } from '../core/data/patron-store';

/**
 * One studio announcement. Posts are one-way: patrons can heart the artist
 * and subscribe to their newsletter, but not comment.
 */
@Component({
  selector: 'app-feed-post',
  imports: [RouterLink, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideHeart, lucideMail, lucideSparkles })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './feed-post.html',
})
export class FeedPostCard {
  protected readonly store = inject(PatronStore);
  readonly post = input.required<FeedEntry>();
  /** Shows the "Suggested for you" banner. */
  readonly suggested = input(false);
  /** Shows the favourite and newsletter buttons under the post. */
  readonly actions = input(true);
}
