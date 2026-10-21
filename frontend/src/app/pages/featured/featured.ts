import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { artistById } from '../../core/data/catalog';
import type { Artist } from '../../core/data/models';
import { BackLink } from '../../shared/back-link';
import { InquiryLauncher } from '../../shared/inquiry/inquiry-launcher';
import { FEATURED_IDS, FEATURE_INTRO, FEATURE_NOTES } from './featured-content';

@Component({
  selector: 'app-featured',
  imports: [RouterLink, BackLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="pb-24">
      <div class="mx-auto flex max-w-[1400px] px-4 pt-8 sm:px-8">
        <app-back-link to="/">Home</app-back-link>
      </div>
      <header
        class="mx-auto flex max-w-[900px] flex-col items-center gap-5 px-4 pt-12 pb-14 text-center sm:px-8"
      >
        <div class="eyebrow">Featured artists · October 2026</div>
        <h1
          class="font-serif text-[clamp(52px,7vw,96px)] leading-none font-normal tracking-[-.02em]"
        >
          The <em>slow</em> season
        </h1>
        <p class="max-w-[640px] font-serif text-2xl leading-snug text-muted-foreground">
          Four painters working slowly in oil, ink and watercolour, each taking a small number of
          commissions this season.
        </p>
        <div class="flex items-center gap-2.5 text-[13px]">
          <span class="size-8 rounded-full bg-[oklch(0.86_0.05_60)]"></span>
          Curated by <span class="font-semibold">Adaeze Clarke</span
          ><span class="text-muted-foreground">· 6 min read</span>
        </div>
      </header>
      <div class="mx-auto flex max-w-[680px] flex-col gap-5 px-4 pb-18 sm:px-8">
        @for (p of intro; track $index) {
          <p class="text-[17px] leading-[1.75]">{{ p }}</p>
        }
      </div>

      <div class="mx-auto flex max-w-[1400px] flex-col gap-24 px-4 sm:px-8">
        @for (a of artists; track a.id; let i = $index) {
          <article class="flex flex-col gap-8">
            <div
              class="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,1fr)] lg:gap-14"
            >
              <div
                class="aspect-[5/4] rounded-4xl"
                [style.background]="
                  '#EEE8DD url(/images/featured/' + a.id + '.jpg) center/cover no-repeat'
                "
              ></div>
              <div class="flex flex-col items-start gap-5">
                <div class="eyebrow">0{{ i + 1 }} · {{ a.role }} · {{ a.city }}</div>
                <h2 class="font-serif text-[56px] leading-none font-normal tracking-[-.02em]">
                  {{ a.name }}
                </h2>
                <div class="-mt-2 font-serif text-[22px] italic">{{ a.studio }}</div>
                <p class="text-base leading-[1.7]">{{ notes[a.id] }}</p>
                <blockquote class="flex flex-col gap-1 py-1">
                  <p class="font-serif text-2xl leading-snug italic">“{{ a.quote }}”</p>
                  <span class="font-hand text-[28px] leading-none">— {{ a.first }}</span>
                </blockquote>
                <div class="flex flex-wrap items-center gap-4 pt-2">
                  <div class="flex flex-col">
                    <span class="text-[11px] text-muted-foreground">Price range</span>
                    <span class="font-semibold">{{ a.priceLabel }}</span>
                  </div>
                  <a
                    [routerLink]="['/artists', a.id]"
                    class="flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium hover:bg-muted"
                    >Visit studio</a
                  >
                  <button
                    type="button"
                    (click)="inquiry.open(a)"
                    class="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-85"
                  >
                    Inquire
                  </button>
                </div>
              </div>
            </div>
            <div class="grid gap-6 sm:grid-cols-3">
              @for (w of a.workList.slice(0, 3); track w.title) {
                <figure class="flex flex-col gap-2.5">
                  <div class="aspect-[4/3] rounded-3xl" [style.background]="w.bg"></div>
                  <figcaption class="flex flex-col">
                    <span class="font-serif text-lg italic">{{ w.title }}</span>
                    <span class="text-xs text-muted-foreground">{{ w.material }}</span>
                  </figcaption>
                </figure>
              }
            </div>
          </article>
        }
      </div>

      <footer
        class="mx-auto mt-24 flex max-w-[680px] flex-col items-center gap-4 border-t px-4 pt-12 text-center sm:px-8"
      >
        <p class="font-serif text-[26px] leading-snug">
          All four artists are booking into early 2027. Save the ones you love and they’ll be
          waiting for you.
        </p>
        <span class="font-hand text-3xl">— Adaeze</span>
      </footer>
    </main>
  `,
})
export class Featured {
  protected readonly inquiry = inject(InquiryLauncher);
  protected readonly intro = FEATURE_INTRO;
  protected readonly notes = FEATURE_NOTES;
  protected readonly artists = FEATURED_IDS.map((id) => artistById(id) as Artist);
}
