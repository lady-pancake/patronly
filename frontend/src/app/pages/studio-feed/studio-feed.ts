import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck, lucideHeart, lucideMail } from '@ng-icons/lucide';
import { artistById } from '../../core/data/catalog';
import { feedEntries } from '../../core/data/feed';
import { PatronStore } from '../../core/data/patron-store';
import { FeedPostCard } from '../../shared/feed-post';
import { NotFound } from '../not-found';

/** One studio's announcements. One-way: no comments, just updates from the artist. */
@Component({
  selector: 'app-studio-feed',
  imports: [RouterLink, NgIcon, FeedPostCard, NotFound],
  providers: [provideIcons({ lucideArrowLeft, lucideCheck, lucideHeart, lucideMail })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './studio-feed.html',
})
export class StudioFeed {
  protected readonly store = inject(PatronStore);
  readonly id = input.required<string>();
  protected readonly artist = computed(() => artistById(this.id()));
  protected readonly posts = computed(() => feedEntries(this.id()));
}
