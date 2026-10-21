import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Placeholder until the studio builder and artist dashboard land. */
@Component({
  selector: 'app-artist-soon',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="mx-auto flex min-h-dvh max-w-[680px] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <a routerLink="/login" class="font-serif text-[26px] tracking-tight">Patronly</a>
      <h1 class="font-serif text-[clamp(44px,6vw,64px)] leading-none font-normal">
        Let’s build your <em>studio.</em>
      </h1>
      <p class="text-[15px] leading-relaxed text-muted-foreground">
        The studio builder and artist dashboard are coming next. For now you can look around as a
        patron.
      </p>
      <div class="flex gap-2">
        <a
          routerLink="/login"
          class="flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium hover:bg-muted"
          >Back</a
        >
        <a
          routerLink="/"
          class="flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-85"
          >Browse as a patron</a
        >
      </div>
    </main>
  `,
})
export class ArtistSoon {}
