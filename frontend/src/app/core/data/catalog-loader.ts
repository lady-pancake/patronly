import { inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { GraphQLService } from '../graphql.service';
import { setCatalogue } from './catalog';
import type { ArtistSeed, Availability } from './models';

/** Raw artist as the API returns it. */
export interface ApiArtist {
  slug: string | null;
  position: number;
  displayName: string;
  studio: string;
  medium: string;
  city: string;
  priceMin: number;
  priceMax: number;
  commissions: number;
  likes: number;
  hue: number;
  chroma: number;
  site: string;
  replyNote: string;
  tags: string[];
  quote: string;
  bio: string | null;
  availability: 'OPEN' | 'WAITLIST' | 'CLOSED';
  coverUrl: string | null;
  portraitUrl: string | null;
  processUrl: string | null;
  processVideoUrl: string | null;
  coverVideoUrl: string | null;
  rateTiers?: { name: string; detail: string; priceFrom: number; priceTo: number }[] | null;
  works: { title: string; material: string; imageUrl: string | null }[];
  reviews: { quote: string; author: string }[];
}

export const CATALOGUE_QUERY = /* GraphQL */ `
  query Catalogue {
    artists(limit: 200) {
      slug
      position
      displayName
      studio
      medium
      city
      priceMin
      priceMax
      commissions
      likes
      hue
      chroma
      site
      replyNote
      tags
      quote
      bio
      availability
      coverUrl
      portraitUrl
      processUrl
      processVideoUrl
      coverVideoUrl
      rateTiers {
        name
        detail
        priceFrom
        priceTo
      }
      works {
        title
        material
        imageUrl
      }
      reviews {
        quote
        author
      }
    }
  }
`;

const AVAILABILITY: Record<ApiArtist['availability'], Availability> = {
  OPEN: 'Open',
  WAITLIST: 'Waitlist',
  CLOSED: 'Closed',
};

const orUndefined = <T>(v: T | null) => v ?? undefined;

/** Converts an API artist to the shape the UI's catalogue is built from. */
export function fromApi(a: ApiArtist): ArtistSeed | null {
  if (!a.slug) return null; // Artists without a URL slug can't be linked to yet.
  return {
    id: a.slug,
    name: a.displayName,
    studio: a.studio,
    medium: a.medium,
    city: a.city,
    min: a.priceMin,
    max: a.priceMax,
    commissions: a.commissions,
    likes: a.likes,
    hue: a.hue,
    c: a.chroma,
    site: a.site,
    reply: a.replyNote,
    tags: a.tags,
    quote: a.quote,
    works: a.works.map((w) =>
      w.imageUrl ? [w.title, w.material, w.imageUrl] : [w.title, w.material],
    ),
    reviews: a.reviews.map((r) => ({ q: r.quote, by: r.author })),
    bio: (a.bio ?? '').split(/\n\s*\n/).filter(Boolean),
    avail: AVAILABILITY[a.availability],
    cover: orUndefined(a.coverUrl),
    portrait: orUndefined(a.portraitUrl),
    process: orUndefined(a.processUrl),
    processVideo: orUndefined(a.processVideoUrl),
    coverVideo: orUndefined(a.coverVideoUrl),
    rates: a.rateTiers?.map((t) => ({
      name: t.name,
      detail: t.detail,
      from: t.priceFrom,
      to: t.priceTo,
    })),
  };
}

/**
 * Runs at startup: loads the catalogue from the API. When the API can't be
 * reached, or has no studios yet, the bundled sample data stays in place so
 * the app still works on its own.
 */
export async function loadCatalogue(): Promise<void> {
  const gql = inject(GraphQLService);
  try {
    const data = await firstValueFrom(
      gql.query<{ artists: ApiArtist[] }>(CATALOGUE_QUERY).pipe(timeout(5000)),
    );
    const seeds = [...data.artists]
      .sort((x, y) => x.position - y.position)
      .map(fromApi)
      .filter((a): a is ArtistSeed => a !== null);
    if (seeds.length) {
      setCatalogue(seeds, 'api');
      return;
    }
    console.warn(
      'Patronly: the API has no studios yet, showing sample data. Run `python -m app.seed`.',
    );
  } catch (err) {
    console.warn('Patronly: couldn’t load studios from the API, showing sample data.', err);
  }
}
