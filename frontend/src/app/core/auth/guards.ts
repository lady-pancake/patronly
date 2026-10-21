import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { type Entitlement, ViewerStore } from './viewer.store';

/** Sends visitors without a guest pass to the password gate, then back here afterwards. */
export const guest: CanActivateFn = async (_route, state) => {
  // Inject before awaiting: the injection context ends at the first await.
  const router = inject(Router);
  const viewer = await inject(ViewerStore).whenLoaded();
  return viewer ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};

/**
 * Lets the page open only when the current view can do `entitlement`.
 * No guest pass goes to the gate; a view without the action goes home.
 */
export function entitled(entitlement: Entitlement): CanActivateFn {
  return async (_route, state) => {
    const router = inject(Router);
    const store = inject(ViewerStore);
    const viewer = await store.whenLoaded();
    if (!viewer) return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
    return store.can(entitlement) ? true : router.createUrlTree(['/']);
  };
}
