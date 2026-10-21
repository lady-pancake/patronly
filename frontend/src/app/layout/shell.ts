import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './site-header';

/** Signed-in layout: sticky header above the page. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SiteHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <router-outlet />
  `,
})
export class Shell {}
