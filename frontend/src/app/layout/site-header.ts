import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart, lucideMessageCircle } from '@ng-icons/lucide';
import { PatronStore } from '../core/data/patron-store';
import { SiteSearch } from './site-search';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, NgIcon, SiteSearch],
  providers: [provideIcons({ lucideHeart, lucideMessageCircle })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-20 block border-b bg-page/85 backdrop-blur-md',
  },
  template: `
    <div class="mx-auto flex h-[72px] max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-8">
      <a routerLink="/" class="shrink-0 font-serif text-[26px] tracking-tight">Patronly</a>
      <app-site-search class="mx-auto max-w-[640px]" />
      <nav class="flex shrink-0 items-center gap-1" aria-label="Main">
        <a
          routerLink="/saved"
          routerLinkActive="bg-secondary"
          class="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted sm:px-3.5"
        >
          <ng-icon name="lucideHeart" size="16" /><span class="hidden md:inline">Saved</span>
        </a>
        <a
          routerLink="/messages"
          routerLinkActive="bg-secondary"
          class="relative flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted sm:px-3.5"
        >
          <ng-icon name="lucideMessageCircle" size="16" /><span class="hidden md:inline"
            >Messages</span
          >
          @if (store.unreadCount()) {
            <span
              class="absolute top-2 left-6 size-2 rounded-full bg-primary md:hidden"
              aria-label="Unread messages"
            ></span>
          }
        </a>
        <a
          routerLink="/login"
          title="Sign out"
          aria-label="Sign out"
          class="ml-1.5 grid size-10 place-items-center rounded-full bg-[oklch(0.86_0.05_60)] font-serif text-base"
          >A</a
        >
      </nav>
    </div>
  `,
})
export class SiteHeader {
  protected readonly store = inject(PatronStore);
}
