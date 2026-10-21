import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideHeart,
  lucideInfo,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideMessageCircle,
  lucideRotateCcw,
} from '@ng-icons/lucide';
import { type Role, ViewerStore } from '../core/auth/viewer.store';
import { ARTIST_STORAGE_KEY, ArtistStore } from '../core/data/artist-store';
import { PATRON_STORAGE_KEY, PatronStore } from '../core/data/patron-store';
import { SiteSearch } from './site-search';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, NgIcon, SiteSearch],
  providers: [
    provideIcons({
      lucideCheck,
      lucideHeart,
      lucideInfo,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideMessageCircle,
      lucideRotateCcw,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    class: 'sticky top-0 z-20 block border-b bg-page/85 backdrop-blur-md',
    '(document:click)': 'closeIfOutside($event)',
  },
  templateUrl: './site-header.html',
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

  private readonly injector = inject(Injector);

  protected toggleMenu() {
    if (this.menuOpen()) this.closeMenu();
    else this.openMenu();
  }

  /** Opens the menu and moves focus to its first item, as menus do for keyboard users. */
  protected openMenu(event?: Event) {
    event?.preventDefault();
    this.menuOpen.set(true);
    afterNextRender(() => this.items()[0]?.focus(), { injector: this.injector });
  }

  private closeMenu(returnFocus = true) {
    this.menuOpen.set(false);
    if (returnFocus)
      this.host.nativeElement.querySelector<HTMLElement>('[aria-haspopup=menu]')?.focus();
  }

  private items(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>('[role^=menuitem]')];
  }

  /** Arrow keys, Home and End move between items; Escape closes; Tab leaves the menu. */
  protected menuKey(event: KeyboardEvent) {
    const items = this.items();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      event.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(i + 1);
    else if (event.key === 'ArrowUp') go(i - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(items.length - 1);
    else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
    } else if (event.key === 'Tab') this.closeMenu(false);
  }

  /** Moves focus past the header to the page's main content. */
  protected skipToContent(event: Event) {
    event.preventDefault();
    const main = document.querySelector<HTMLElement>('main');
    if (!main) return;
    main.tabIndex = -1;
    main.focus();
  }

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

  /** Clears favourites, messages and studio edits, then reloads with the sample data. */
  protected resetDemo() {
    this.menuOpen.set(false);
    try {
      sessionStorage.removeItem(ARTIST_STORAGE_KEY);
      sessionStorage.removeItem(PATRON_STORAGE_KEY);
    } catch {
      // Without storage there is nothing saved to clear.
    }
    // A full reload so every store starts again from the sample data.
    location.assign(this.viewer.can('VIEW_DASHBOARD') ? '/studio/edit' : '/');
  }

  protected signOut() {
    this.menuOpen.set(false);
    this.viewer.signOut();
    void this.router.navigateByUrl('/login');
  }
}
