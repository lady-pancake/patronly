import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { feedEntries } from '../../core/data/feed';
import { PatronStore } from '../../core/data/patron-store';
import { FeedPostCard } from '../../shared/feed-post';

type Filter = 'all' | 'following';

/**
 * Posts from the studios: ones from artists the patron has hearted, and
 * suggested ones from everyone else, marked with a banner.
 */
@Component({
  selector: 'app-feed',
  imports: [FeedPostCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed.html',
})
export class Feed {
  private readonly store = inject(PatronStore);
  protected readonly filter = signal<Filter>('all');
  private readonly posts = feedEntries();
  /** Posts that were new when the feed opened keep their flag while it's open. */
  private readonly fresh = this.store.newPosts();

  constructor() {
    this.store.markFeedSeen();
  }

  protected readonly visible = computed(() => {
    const favs = this.store.favs();
    return this.posts
      .map((p) => ({
        ...p,
        suggested: !favs.includes(p.artist.id),
        isNew: this.fresh.includes(p.title),
      }))
      .filter((p) => this.filter() === 'all' || !p.suggested);
  });
}
