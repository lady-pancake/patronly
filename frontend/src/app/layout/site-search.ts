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
    'data-focus-ring': '',
    class:
      'relative flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-input bg-background pr-1.5 pl-4',
  },
  templateUrl: './site-search.html',
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
