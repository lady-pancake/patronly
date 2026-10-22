import type { Artist, ArtistSeed, Availability, RateTier, WizardAnswers } from './models';
import { AVAIL_MAP, BUDGETS, ROLE, SEED_ARTISTS } from './seed';

/** oklch colour from a hue, lightness and chroma. */
export const tone = (h: number, l: number, c: number) => `oklch(${l} ${c} ${h})`;

/** $400, $1.2k, $6k */
export const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${n}`;

const round = (n: number) => (n > 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10);

const imageBg = (src: string, fallback = '#EEE8DD') =>
  `${fallback} url('${src}') center/cover no-repeat`;

export const AVAILABILITY: Record<
  Availability,
  { label: string; dot: string; bg: string; fg: string }
> = {
  Open: {
    label: 'Taking commissions',
    dot: 'oklch(0.6 0.15 155)',
    bg: 'oklch(0.94 0.06 155)',
    fg: 'oklch(0.38 0.1 155)',
  },
  Waitlist: {
    label: 'Waitlist open',
    dot: 'oklch(0.7 0.15 70)',
    bg: 'oklch(0.95 0.07 85)',
    fg: 'oklch(0.42 0.1 60)',
  },
  Closed: {
    label: 'Not taking commissions',
    dot: 'oklch(0.556 0 0)',
    bg: 'oklch(0.94 0 0)',
    fg: 'oklch(0.35 0 0)',
  },
};

/** Small / Medium / Large price bands spread between the artist's min and max. */
export function rateTiers(a: Pick<ArtistSeed, 'min' | 'max' | 'medium'>): RateTier[] {
  const weeks =
    a.medium === 'Murals' || a.medium === 'Sculpture'
      ? [6, 12, 24]
      : a.medium === 'Photography' || a.medium === 'Illustration'
        ? [2, 4, 8]
        : [3, 8, 16];
  const names = ['Small', 'Medium', 'Large'];
  const n = names.length;
  const pts = Array.from({ length: n + 1 }, (_, i) =>
    i === 0 ? a.min : i === n ? a.max : round(a.min * Math.pow(a.max / a.min, i / n)),
  );
  return names.map((name, i) => ({
    name,
    lead: `About ${weeks[i]} weeks to finish`,
    range: `${fmt(pts[i])}–${fmt(pts[i + 1])}`,
  }));
}

export function decorate(a: ArtistSeed): Artist {
  const availability = a.avail ?? AVAIL_MAP[a.id] ?? 'Open';
  const hasImages = a.works.some((w) => !!w[2]);
  // Once a studio has real photos, leave out entries that would only be a colour block.
  const works = hasImages ? a.works.filter((w) => !!w[2]) : a.works;
  const lights = [0.62, 0.78, 0.48, 0.7, 0.55, 0.84];
  return {
    ...a,
    role: ROLE[a.medium] ?? a.medium,
    first: a.name.split(' ')[0],
    bg: tone(a.hue, 0.68, a.c),
    heroBg: a.cover ? imageBg(a.cover, tone(a.hue, 0.42, a.c * 0.9)) : tone(a.hue, 0.42, a.c * 0.9),
    processBg: a.process ? imageBg(a.process, tone(a.hue, 0.55, a.c)) : tone(a.hue, 0.55, a.c),
    tint: tone(a.hue, 0.86, a.c * 0.5),
    portraitBg: a.portrait
      ? `${tone(a.hue, 0.8, a.c * 0.6)} url('${a.portrait}') center 20%/cover no-repeat`
      : tone(a.hue, 0.8, a.c * 0.6),
    priceLabel: `${fmt(a.min)} – ${fmt(a.max)}`,
    likesLabel: a.likes.toLocaleString('en-US'),
    availability,
    availLabel: AVAILABILITY[availability].label,
    workList: works.map(([title, material, src], i) => ({
      title,
      material,
      src,
      bg: src ? imageBg(src) : tone(a.hue + ((i % 3) - 1) * 14, lights[i % lights.length], a.c),
    })),
    tiers: a.rates?.length
      ? a.rates.map((r) => ({ name: r.name, lead: r.detail, range: `${fmt(r.from)}–${fmt(r.to)}` }))
      : rateTiers(a),
    link: { label: a.site, href: `https://${a.site}` },
    hasImages,
  };
}

/*
 * The catalogue. It starts as the bundled sample data and is replaced by the
 * API's artists at startup (see catalog-loader.ts), before any page renders.
 * These are `let` exports so importers see the replacement.
 */
export let ARTISTS: Artist[] = [];
let BY_ID = new Map<string, Artist>();

/**
 * Artists shown in browse lists. Like the prototype, studios without any
 * real artwork stay out of listings until they upload some.
 */
export let LISTED: Artist[] = [];

/** Where the current catalogue came from. */
export let CATALOGUE_SOURCE: 'api' | 'sample' = 'sample';

export function setCatalogue(seeds: ArtistSeed[], source: 'api' | 'sample'): void {
  ARTISTS = seeds.map(decorate);
  BY_ID = new Map(ARTISTS.map((a) => [a.id, a]));
  LISTED = ARTISTS.filter((a) => a.hasImages);
  CATALOGUE_SOURCE = source;
}

setCatalogue(SEED_ARTISTS, 'sample');

export const artistById = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

export const mediumArt = (name: string) => `/images/mediums/${name.toLowerCase()}.png`;

/** Artists that fit a set of new-search answers, most saved first. */
export function matchArtists(w: WizardAnswers, pool: Artist[] = LISTED): Artist[] {
  const b = w.budget ? BUDGETS[w.budget] : undefined;
  return pool
    .filter(
      (a) =>
        (!w.mediums.length || w.mediums.includes(a.medium)) &&
        (!b || (a.min <= b[1] && a.max >= b[0])) &&
        (w.avail === 'No, I’d like to start soon'
          ? a.availability === 'Open'
          : w.avail === 'Yes, I’m happy to wait'
            ? a.availability !== 'Closed'
            : true),
    )
    .sort((x, y) => y.likes - x.likes);
}

/** Chips that summarise a search, in question order. */
export const searchChips = (w: WizardAnswers) =>
  [...w.mediums, w.purpose, w.size, w.budget, w.timeline].filter((v): v is string => !!v);
