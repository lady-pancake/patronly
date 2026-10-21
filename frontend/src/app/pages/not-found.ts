import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto flex max-w-[680px] flex-col items-center gap-6 px-4 py-32 text-center">
      <h1 class="font-serif text-5xl font-normal"><ng-content>Nothing here.</ng-content></h1>
      <a
        routerLink="/"
        class="flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-85"
        >Back to home</a
      >
    </main>
  `,
})
export class NotFound {}
