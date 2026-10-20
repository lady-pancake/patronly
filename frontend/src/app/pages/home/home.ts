import { Component, inject, signal } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { environment } from '../../../environments/environment';
import { Health, HealthService } from '../../core/health.service';

type State =
  { kind: 'loading' } | { kind: 'ok'; health: Health } | { kind: 'error'; message: string };

@Component({
  selector: 'app-home',
  imports: [HlmButton, HlmBadge, HlmCardImports],
  templateUrl: './home.html',
})
export class Home {
  private readonly healthService = inject(HealthService);

  protected readonly graphqlUrl = environment.graphqlUrl;
  protected readonly state = signal<State>({ kind: 'loading' });

  constructor() {
    this.refresh();
  }

  protected refresh(): void {
    this.state.set({ kind: 'loading' });
    this.healthService.check().subscribe({
      next: (health) => this.state.set({ kind: 'ok', health }),
      error: (err: unknown) =>
        this.state.set({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Could not reach the API',
        }),
    });
  }
}
