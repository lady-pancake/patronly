import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ARTISTS } from '../../core/data/catalog';
import { PatronStore, type Role } from '../../core/data/patron-store';

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
  ...ARTISTS.flatMap((a) => a.works.map((w) => w[2]).filter((s): s is string => !!s)),
  ...['clem', 'june', 'maren', 'sol'].map((id) => `/images/featured/${id}.jpg`),
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-dvh min-h-[720px] overflow-hidden bg-[#EAE4DD]">
      <div class="absolute inset-0 flex justify-center gap-6 sm:gap-11" aria-hidden="true">
        @for (col of columns; track $index) {
          <div class="max-w-[175px] min-w-0 flex-1" [style.margin-top]="col.offset">
            <div class="flex flex-col will-change-transform" [style.animation]="col.animation">
              @for (t of col.tiles; track $index) {
                <div class="mb-[25px] aspect-[7/8] shrink-0" [style.background]="t"></div>
              }
            </div>
          </div>
        }
      </div>
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_34%_40%_at_50%_50%,rgb(234_228_221/.95)_45%,rgb(234_228_221/0)_100%)] max-sm:bg-[radial-gradient(ellipse_70%_45%_at_50%_50%,rgb(234_228_221/.95)_45%,rgb(234_228_221/0)_100%)]"
      ></div>
      <div
        class="pointer-events-none relative flex h-full flex-col items-center justify-center gap-7 p-6 text-center"
      >
        <h1
          class="font-serif text-[clamp(56px,8vw,112px)] leading-[.95] font-normal tracking-[-.03em] italic"
        >
          Patronly
        </h1>
        <div
          role="radiogroup"
          aria-label="Sign in as"
          class="pointer-events-auto flex w-full max-w-[360px] flex-col gap-4 rounded-4xl bg-card p-6 text-left shadow-[0_4px_16px_oklch(0_0_0/.08)] ring-1 ring-black/5"
        >
          <span class="text-sm font-semibold">Sign in as</span>
          <div class="flex flex-col gap-2">
            @for (r of roles; track r.id) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="role() === r.id"
                (click)="role.set(r.id)"
                class="flex min-h-[52px] items-center gap-3 rounded-3xl border px-4 py-3 text-left hover:bg-muted"
                [class]="role() === r.id ? 'border-primary' : 'border-border'"
              >
                <span
                  class="grid size-[18px] shrink-0 place-items-center rounded-full border"
                  [class]="role() === r.id ? 'border-primary' : 'border-input'"
                >
                  @if (role() === r.id) {
                    <span class="size-2 rounded-full bg-primary"></span>
                  }
                </span>
                <span class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{{ r.label }}</span>
                  <span class="text-xs text-muted-foreground">{{ r.desc }}</span>
                </span>
              </button>
            }
          </div>
          <button
            type="button"
            (click)="enter()"
            class="h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:opacity-85"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private readonly router = inject(Router);
  private readonly store = inject(PatronStore);

  protected readonly columns = COLUMNS;
  protected readonly roles: { id: Role; label: string; desc: string }[] = [
    { id: 'patron', label: 'Patron', desc: 'Discover and commission artists' },
    { id: 'artist', label: 'Artist', desc: 'Share your work and take commissions' },
  ];
  protected readonly role = signal<Role>(this.store.role());

  protected enter() {
    this.store.role.set(this.role());
    void this.router.navigateByUrl(this.role() === 'artist' ? '/studio/new' : '/');
  }
}
