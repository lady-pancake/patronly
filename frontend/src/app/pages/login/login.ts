import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { type Role, ViewerStore } from '../../core/auth/viewer.store';
import { ARTISTS } from '../../core/data/catalog';
import { ArtistStore } from '../../core/data/artist-store';
import { EnterSubmit } from '../../shared/enter-submit';

const PALETTE = [
  '#8E6E7E',
  '#FFFFFF',
  '#232F12',
  '#4A140C',
  '#8EAEA9',
  '#A0AE84',
  '#A79E93',
  '#C7E0DC',
  '#4C5E31',
  '#CFC3CC',
  '#230905',
  '#6E425B',
  '#6B372F',
  '#151D30',
];
const ART = [
  // Paintings only, so the background reads as a wall of artwork.
  ...ARTISTS.filter((a) => a.medium === 'Painting').flatMap((a) =>
    a.works.map((w) => w[2]).filter((s): s is string => !!s),
  ),
  ...['clem', 'june', 'sol'].map((id) => `/images/featured/${id}.jpg`),
];
const OFFSETS = [0, -60, -20, -90, -40, -10, -70, -30];
const SPEEDS = [70, 90, 60, 80, 75, 95, 65, 85];

/** Eight drifting columns of artwork and colour swatches behind the sign-in card. */
const COLUMNS = OFFSETS.map((offset, i) => ({
  offset: `${offset}px`,
  animation: `${i % 2 ? 'drift-down' : 'drift-up'} ${SPEEDS[i]}s linear infinite`,
  tiles: Array.from({ length: 12 }, (_, k) => {
    const j = k % 6;
    return (i + j) % 2 === 0
      ? `#EEE8DD url('${ART[(i * 3 + j * 5) % ART.length]}') center/cover no-repeat`
      : PALETTE[(i * 5 + j * 3) % PALETTE.length];
  }),
}));

@Component({
  selector: 'app-login',
  imports: [EnterSubmit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly artist = inject(ArtistStore);
  protected readonly viewer = inject(ViewerStore);

  protected readonly columns = COLUMNS;
  protected readonly roles: { id: Role; label: string; desc: string }[] = [
    { id: 'patron', label: 'Patron', desc: 'Discover and commission artists' },
    { id: 'artist', label: 'Artist', desc: 'Share your work and take commissions' },
  ];
  protected readonly role = signal<Role>(this.viewer.role());

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.viewer.whenLoaded();
  }

  /** Starts a guest visit if there isn't one yet, then opens the app in the chosen view. */
  protected async enter() {
    if (this.busy()) return;
    this.error.set(null);
    if (!this.viewer.signedIn()) {
      this.busy.set(true);
      try {
        await this.viewer.startVisit();
      } catch {
        this.error.set('We couldn’t reach Patronly just now. Please try again.');
        return;
      } finally {
        this.busy.set(false);
      }
    }
    this.viewer.role.set(this.role());
    void this.router.navigateByUrl(this.destination());
  }

  /** The page asked for, or the home that fits what this view can do. */
  private destination(): string {
    const next = this.route.snapshot.queryParamMap.get('next');
    if (next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) return next;
    if (this.viewer.can('VIEW_DASHBOARD')) {
      // Artists with a public studio land on their dashboard; new artists build one first.
      return this.artist.published() ? '/dashboard' : '/studio/edit';
    }
    return '/';
  }
}
