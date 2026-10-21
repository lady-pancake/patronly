import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideHeart,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideMessageCircle,
} from '@ng-icons/lucide';
import { type Role, ViewerStore } from '../core/auth/viewer.store';
import { ArtistStore } from '../core/data/artist-store';
import { PatronStore } from '../core/data/patron-store';
import { SiteSearch } from './site-search';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, NgIcon, SiteSearch],
  providers: [
    provideIcons({
      lucideCheck,
      lucideHeart,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideMessageCircle,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-20 block border-b bg-page/85 backdrop-blur-md',
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
  template: `
    <div class="mx-auto flex h-[72px] max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-8">
      <a routerLink="/" class="shrink-0 font-serif text-[26px] tracking-tight">Patronly</a>
      <app-site-search class="mx-auto max-w-[640px]" />
      <nav class="flex shrink-0 items-center gap-1" aria-label="Main">
        @if (viewer.can('VIEW_DASHBOARD')) {
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-secondary"
            class="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted sm:px-3.5"
          >
            <ng-icon name="lucideLayoutDashboard" size="16" /><span class="hidden md:inline"
              >Dashboard</span
            >
          </a>
        }
        @if (viewer.can('SAVE_FAVOURITES')) {
          <a
            routerLink="/saved"
            routerLinkActive="bg-secondary"
            class="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted sm:px-3.5"
          >
            <ng-icon name="lucideHeart" size="16" /><span class="hidden md:inline">Saved</span>
          </a>
        }
        @if (viewer.can('MESSAGE')) {
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
        }
        <div class="relative ml-1.5">
          <button
            type="button"
            (click)="menuOpen.set(!menuOpen())"
            aria-haspopup="menu"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="'Account menu for ' + (viewer.viewer()?.name ?? 'guest')"
            class="grid size-10 place-items-center rounded-full bg-[oklch(0.86_0.05_60)] font-serif text-base"
          >
            {{ viewer.initial() }}
          </button>
          @if (menuOpen()) {
            <div
              role="menu"
              class="absolute top-12 right-0 flex w-60 flex-col rounded-3xl bg-card p-2 text-sm shadow-[0_8px_30px_oklch(0_0_0/.14)] ring-1 ring-black/5"
            >
              <div class="px-3 pt-2 pb-3">
                <div class="font-medium">{{ viewer.viewer()?.name }}</div>
                <div class="text-xs text-muted-foreground">Guest</div>
              </div>
              <div class="px-3 pb-1 text-xs font-semibold text-muted-foreground">View as</div>
              @for (r of roles; track r.id) {
                <button
                  type="button"
                  role="menuitemradio"
                  [attr.aria-checked]="viewer.role() === r.id"
                  (click)="switchTo(r.id)"
                  class="flex h-10 items-center justify-between rounded-2xl px-3 text-left hover:bg-muted"
                >
                  {{ r.label }}
                  @if (viewer.role() === r.id) {
                    <ng-icon name="lucideCheck" size="16" />
                  }
                </button>
              }
              <div class="my-1.5 h-px bg-border"></div>
              <button
                type="button"
                role="menuitem"
                (click)="signOut()"
                class="flex h-10 items-center gap-2 rounded-2xl px-3 text-left hover:bg-muted"
              >
                <ng-icon name="lucideLogOut" size="16" />Sign out
              </button>
            </div>
          }
        </div>
      </nav>
    </div>
  `,
})
export class SiteHeader {
  protected readonly store = inject(PatronStore);
  protected readonly viewer = inject(ViewerStore);
  private readonly artist = inject(ArtistStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuOpen = signal(false);
  protected readonly roles: { id: Role; label: string }[] = [
    { id: 'patron', label: 'Patron' },
    { id: 'artist', label: 'Artist' },
  ];

  protected closeIfOutside(event: Event) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  /** Changes view, then goes where that view makes sense. */
  protected switchTo(role: Role) {
    this.menuOpen.set(false);
    if (role === this.viewer.role()) return;
    this.viewer.role.set(role);
    if (this.viewer.can('VIEW_DASHBOARD')) {
      // Artists with a public studio land on their dashboard; new artists build one first.
      void this.router.navigateByUrl(this.artist.published() ? '/dashboard' : '/studio/edit');
      return;
    }
    const url = this.router.url;
    const blocked =
      (url.startsWith('/dashboard') && !this.viewer.can('VIEW_DASHBOARD')) ||
      (url.startsWith('/saved') && !this.viewer.can('SAVE_FAVOURITES')) ||
      (url.startsWith('/messages') && !this.viewer.can('MESSAGE'));
    if (blocked) void this.router.navigateByUrl('/');
  }

  protected signOut() {
    this.menuOpen.set(false);
    this.viewer.signOut();
    void this.router.navigateByUrl('/login');
  }
}
