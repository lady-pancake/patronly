import { decorate, fmt } from './catalog';
import type { Artist, ArtistSeed, RateTier } from './models';
import { MEDIUMS } from './seed';

/** A piece of work the artist uploaded in the studio builder. */
export interface Piece {
  id: string;
  /** Image URL, or a data URL for an upload. */
  src: string;
  title: string;
  medium: string;
  tags: string[];
}

/** A kind of commission the artist offers, priced and planned separately. */
export interface CommissionType {
  id: string;
  name: string;
  /** Prices are kept as typed so a half-filled field stays as entered. */
  from: string;
  to: string;
  weeks: number;
  /** Total studio hours one piece takes. */
  hours: number;
}

/** Everything the studio builder collects. */
export interface StudioDraft {
  name: string;
  studio: string;
  city: string;
  website: string;
  mediums: string[];
  tags: string[];
  customTags: string[];
  bio: string;
  quote: string;
  pieces: Piece[];
  /** Up to three piece ids shown on the search card, large spot first. */
  featured: string[];
  portrait: string | null;
  cover: string | null;
  coverVideo: string | null;
  process: string | null;
  processVideo: string | null;
  types: CommissionType[];
  hoursPerWeek: number;
  avail: 'Open' | 'Closed';
}

export const STEP_LABELS = ['Basics', 'Medium', 'Story', 'Work', 'Pricing', 'Calendar'] as const;

export const PRESET_TAGS = [
  'Ships worldwide',
  'Local only',
  'Travels for work',
  'Large-scale',
  'Gift-ready',
  'Digital files included',
  'Framing available',
  'Rush orders',
];

export const WORK_TAG_SUGGESTIONS = [
  'Portrait',
  'Pet portrait',
  'Family',
  'Wedding',
  'Landscape',
  'Seascape',
  'Still life',
  'Botanical',
  'Interior',
  'Abstract',
  'Figurative',
  'Miniature',
  'Large-scale',
  'Black & white',
];

export const AVAIL_CHOICES: { id: StudioDraft['avail']; label: string; sub: string }[] = [
  { id: 'Open', label: 'Taking commissions', sub: 'Patrons can send you inquiries' },
  { id: 'Closed', label: 'Not right now', sub: 'Your studio is visible but inquiries are paused' },
];

/**
 * An empty studio. The builder's sample studio (Alex Ward, with prices) lives in
 * the database and is loaded from the API (`studioTemplate`); this is the
 * starting point before it arrives, or if the API can't be reached.
 */
export const BLANK_DRAFT: StudioDraft = {
  name: '',
  studio: '',
  city: '',
  website: '',
  mediums: [],
  tags: [],
  customTags: [],
  bio: '',
  quote: '',
  pieces: [],
  featured: [],
  portrait: null,
  cover: null,
  coverVideo: null,
  process: null,
  processVideo: null,
  types: [
    { id: 's0', name: 'Small', from: '', to: '', weeks: 3, hours: 9 },
    { id: 's1', name: 'Medium', from: '', to: '', weeks: 8, hours: 64 },
    { id: 's2', name: 'Large', from: '', to: '', weeks: 16, hours: 240 },
  ],
  hoursPerWeek: 30,
  avail: 'Open',
};

/** Lowest and highest price across all commission types (0 when unset). */
export function draftRange(d: StudioDraft): { min: number; max: number } {
  const nums = d.types.flatMap((t) => [+t.from || 0, +t.to || 0]).filter(Boolean);
  return nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : { min: 0, max: 0 };
}

export function rangeLabel(d: StudioDraft): string | null {
  const { min, max } = draftRange(d);
  return min && max > min ? `${fmt(min)} – ${fmt(max)}` : null;
}

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Whether each of the six steps has what it needs. Work and Calendar are always fine. */
export function stepValidity(d: StudioDraft): boolean[] {
  const { min, max } = draftRange(d);
  return [!!d.name.trim(), d.mediums.length > 0, !!d.bio.trim(), true, min > 0 && max > min, true];
}

/** Rate rows for the studio page, one per commission type. */
export function typeTiers(types: CommissionType[]): RateTier[] {
  return types.map((t) => ({
    name: t.name.trim() || 'Untitled type',
    lead: `About ${t.weeks} ${t.weeks === 1 ? 'week' : 'weeks'} to finish`,
    range:
      t.from && t.to
        ? `${fmt(+t.from)}–${fmt(+t.to)}`
        : t.from
          ? `From ${fmt(+t.from)}`
          : t.to
            ? `Up to ${fmt(+t.to)}`
            : '—',
  }));
}

/** Pieces in display order: the three on the search card first, then the rest. */
export function orderedPieces(d: StudioDraft): Piece[] {
  const featured = d.featured
    .map((id) => d.pieces.find((p) => p.id === id))
    .filter((p): p is Piece => !!p);
  return [...featured, ...d.pieces.filter((p) => !d.featured.includes(p.id))];
}

const host = (url: string) =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

/** Turns a draft into the artist record the studio page renders. */
export function buildStudio(d: StudioDraft): Artist {
  const medium = MEDIUMS.find((m) => m.name === d.mediums[0]) ?? MEDIUMS[0];
  const { min, max } = draftRange(d);
  const lo = min > 0 ? min : 500;
  const hi = max > lo ? max : lo * 6;
  const slug =
    d.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z]+/g, '-') || 'you';
  const site = d.website.trim() ? host(d.website.trim()) : `patronly.art/${slug}`;
  const seed: ArtistSeed = {
    id: 'me',
    name: d.name.trim() || 'Your name',
    studio: d.studio.trim() || 'Your studio',
    medium: medium.name,
    city: d.city.trim() || 'Your city',
    min: lo,
    max: hi,
    commissions: 0,
    likes: 0,
    hue: medium.hue,
    c: 0.09,
    site,
    reply: 'New to Patronly. Reply time shows after a few inquiries.',
    tags: [...d.mediums, ...d.tags],
    quote: d.quote.trim() || 'A line in your own words.',
    works: orderedPieces(d).map((p, i) => [
      p.title.trim() || `Untitled ${i + 1}`,
      p.medium.trim() || medium.name,
      p.src,
    ]),
    reviews: [],
    bio: (d.bio.trim() || 'Your story goes here.').split(/\n\s*\n/),
    avail: d.avail,
    portrait: d.portrait ?? undefined,
    cover: d.cover ?? undefined,
    coverVideo: d.cover ? undefined : (d.coverVideo ?? undefined),
    process: d.process ?? undefined,
    processVideo: d.process ? undefined : (d.processVideo ?? undefined),
  };
  const artist = decorate(seed);
  return {
    ...artist,
    tiers: typeTiers(d.types),
    link: {
      label: site,
      href: d.website.trim() ? d.website.trim() : '#',
    },
  };
}

/** Reads an image file and scales it down so it fits comfortably in browser storage. */
export function readImage(file: File, maxSide = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn’t read ${file.name}`));
    };
    img.src = url;
  });
}
