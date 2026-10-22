import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { ArtistStore } from '../../core/data/artist-store';
import { InquireButton } from '../../shared/inquiry/inquire-button';
import { NotFound } from '../not-found';
import { WorkLightbox } from '../../shared/work-lightbox';

@Component({
  selector: 'app-gallery',
  imports: [RouterLink, NgIcon, NotFound, InquireButton, WorkLightbox],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.html',
})
export class Gallery {
  readonly id = input.required<string>();
  private readonly store = inject(ArtistStore);
  protected readonly artist = computed(() => this.store.byId(this.id()));
  protected readonly open = signal<number | null>(null);
}
