import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { LISTED, mediumArt } from '../core/data/catalog';
import { MEDIUMS } from '../core/data/seed';

interface Suggestion {
  kind: 'medium' | 'artist';
  name: string;
  sub?: string;
  thumb: string;
  link: string[];
}

/** Header search box with medium and artist suggestions. */
@Component({
  selector: 'app-site-search',
  imports: [NgIcon, RouterLink, NgTemplateOutlet],
  providers: [provideIcons({ lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'relative flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-input bg-background pr-1.5 pl-4',
  },
  template: `
    <ng-icon name="lucideSearch" size="16" class="shrink-0 text-muted-foreground" />
    <input
      type="search"
      [value]="query()"
      (input)="query.set($any($event.target).value); open.set(true)"
      (focus)="open.set(true)"
      (blur)="close()"
      (keydown.escape)="open.set(false)"
      (keydown.enter)="goFirst()"
      placeholder="Search artists, mediums, cities"
      aria-label="Search artists, mediums, cities"
      class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
    />
    @if (open() && query().trim()) {
      <div
        class="absolute top-[calc(100%+6px)] right-0 left-0 z-40 flex max-h-[420px] flex-col gap-0.5 overflow-auto rounded-xl bg-popover p-1.5 text-popover-foreground shadow-[0_12px_32px_oklch(0_0_0/.12)] ring-1 ring-black/6"
        role="listbox"
      >
        @if (mediums().length) {
          <span class="eyebrow px-2.5 pt-2 pb-1 !text-[11px]">Mediums</span>
          @for (s of mediums(); track s.name) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: s }" />
          }
        }
        @if (artists().length) {
          <span class="eyebrow px-2.5 pt-2 pb-1 !text-[11px]">Artists</span>
          @for (s of artists(); track s.name) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: s }" />
          }
        }
        @if (!mediums().length && !artists().length) {
          <span class="p-2.5 text-[13px] text-muted-foreground"
            >No artists or mediums match “{{ query().trim() }}”</span
          >
        }
      </div>
    }
    <ng-template #row let-s>
      <a
        [routerLink]="s.link"
        (mousedown)="$event.preventDefault()"
        (click)="reset()"
        class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-muted"
        role="option"
      >
        <span class="size-7 shrink-0 rounded-md" [style.background]="s.thumb"></span>
        <span class="flex min-w-0 flex-col">
          <span class="text-sm" [class.font-medium]="s.kind === 'artist'">{{ s.name }}</span>
          @if (s.sub) {
            <span class="text-xs text-muted-foreground">{{ s.sub }}</span>
          }
        </span>
      </a>
    </ng-template>
    <a
      routerLink="/search"
      class="hidden h-8 shrink-0 items-center rounded-md px-3.5 text-[13px] font-medium hover:bg-border sm:flex"
      >Advanced search</a
    >
  `,
})
export class SiteSearch {
  private readonly router = inject(Router);
  protected readonly query = signal('');
  protected readonly open = signal(false);

  private readonly q = computed(() => this.query().trim().toLowerCase());

  protected readonly mediums = computed<Suggestion[]>(() =>
    !this.q()
      ? []
      : MEDIUMS.filter((m) => m.name.toLowerCase().includes(this.q()))
          .slice(0, 4)
          .map((m) => ({
            kind: 'medium',
            name: m.name,
            thumb: `url('${mediumArt(m.name)}') center/120% no-repeat`,
            link: ['/mediums', m.name.toLowerCase()],
          })),
  );

  protected readonly artists = computed<Suggestion[]>(() =>
    !this.q()
      ? []
      : LISTED.filter((a) =>
          [a.name, a.studio, a.city, a.medium, ...a.tags]
            .join(' ')
            .toLowerCase()
            .includes(this.q()),
        )
          .slice(0, 5)
          .map((a) => ({
            kind: 'artist',
            name: a.name,
            sub: `${a.role} · ${a.city}`,
            thumb: a.workList.find((w) => w.src)?.bg ?? a.bg,
            link: ['/artists', a.id],
          })),
  );

  protected close() {
    setTimeout(() => this.open.set(false), 150);
  }

  protected reset() {
    this.query.set('');
    this.open.set(false);
  }

  protected goFirst() {
    const first = this.mediums()[0] ?? this.artists()[0];
    if (first) {
      this.reset();
      void this.router.navigate(first.link);
    }
  }
}
