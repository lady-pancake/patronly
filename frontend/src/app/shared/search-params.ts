import type { Params } from '@angular/router';
import type { WizardAnswers } from '../core/data/models';

/** Encodes search answers as /search query params, opening straight to results. */
export function searchQueryParams(w: WizardAnswers, name?: string): Params {
  return {
    mediums: w.mediums.join(',') || null,
    purpose: w.purpose ?? null,
    size: w.size ?? null,
    budget: w.budget ?? null,
    timeline: w.timeline ?? null,
    avail: w.avail ?? null,
    name: name ?? null,
    results: 1,
  };
}

export function answersFromParams(p: Params): WizardAnswers {
  const str = (k: string) => (typeof p[k] === 'string' && p[k] ? (p[k] as string) : null);
  return {
    mediums: str('mediums')?.split(',').filter(Boolean) ?? [],
    purpose: str('purpose'),
    size: str('size'),
    budget: str('budget'),
    timeline: str('timeline'),
    avail: str('avail'),
  };
}
