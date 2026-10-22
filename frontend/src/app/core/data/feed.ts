import { artistById, tone } from './catalog';
import type { Artist, FeedPost } from './models';
import { FEED } from './seed';

export interface FeedEntry extends FeedPost {
  artist: Artist;
  /** CSS background for the post image, with a colour placeholder behind it. */
  img: string;
}

/** Studio announcements, newest first, with their artist attached. */
export function feedEntries(artistId?: string): FeedEntry[] {
  return FEED.filter((p) => !artistId || p.id === artistId).flatMap((p) => {
    const artist = artistById(p.id);
    if (!artist) return [];
    const base = tone(artist.hue, p.l, artist.c);
    return [{ ...p, artist, img: p.src ? `${base} url('${p.src}') center/cover no-repeat` : base }];
  });
}
