import { Location, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideArrowUpRight,
  lucidePause,
  lucidePlay,
} from '@ng-icons/lucide';
import { ArtistStore } from '../../core/data/artist-store';
import { feedEntries } from '../../core/data/feed';
import { HeartButton } from '../../shared/heart-button';
import { PlayInView } from '../../shared/play-in-view';
import { InquireButton } from '../../shared/inquiry/inquire-button';
import { Tag } from '../../shared/tag';
import { NotFound } from '../not-found';

@Component({
  selector: 'app-studio',
  imports: [
    NgTemplateOutlet,
    PlayInView,
    RouterLink,
    NgIcon,
    HeartButton,
    Tag,
    NotFound,
    InquireButton,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideArrowUpRight,
      lucidePause,
      lucidePlay,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './studio.html',
})
export class Studio {
  /** The cover video plays unless the visitor asked their system for reduced motion. */
  protected readonly coverPlaying = signal(
    typeof matchMedia === 'undefined' || !matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  protected toggleCover(video: HTMLVideoElement) {
    if (this.coverPlaying()) video.pause();
    else void video.play();
    this.coverPlaying.update((p) => !p);
  }

  private readonly location = inject(Location);
  protected readonly store = inject(ArtistStore);

  /** Route param. "me" is the signed-in artist's own studio. */
  readonly id = input.required<string>();
  protected readonly isMine = computed(() => this.id() === 'me');
  protected readonly artist = computed(() => this.store.byId(this.id()));
  protected readonly postCount = computed(() => feedEntries(this.id()).length);

  protected publish() {
    this.store.publish();
    window.scrollTo({ top: 0 });
  }

  protected back() {
    this.location.back();
  }
}
