// Writes the sample artists from src/app/core/data/seed.ts to
// backend/app/seed/catalogue.json, which `python -m app.seed` loads into the
// database. Run with `npm run export-catalogue` after changing the samples.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({
  entryPoints: [resolve(root, 'src/app/core/data/seed.ts')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const url =
  'data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64');
const { SEED_ARTISTS, AVAIL_MAP } = await import(url);

const artists = SEED_ARTISTS.map((a, position) => ({
  slug: a.id,
  position,
  name: a.name,
  studio: a.studio,
  medium: a.medium,
  city: a.city,
  priceMin: a.min,
  priceMax: a.max,
  commissions: a.commissions,
  likes: a.likes,
  hue: a.hue,
  chroma: a.c,
  site: a.site,
  replyNote: a.reply,
  tags: a.tags,
  quote: a.quote,
  bio: a.bio,
  availability: a.avail ?? AVAIL_MAP[a.id] ?? 'Open',
  coverUrl: a.cover ?? null,
  portraitUrl: a.portrait ?? null,
  processUrl: a.process ?? null,
  processVideoUrl: a.processVideo ?? null,
  coverVideoUrl: a.coverVideo ?? null,
  works: a.works.map(([title, material, imageUrl]) => ({
    title,
    material,
    imageUrl: imageUrl ?? null,
  })),
  reviews: a.reviews.map((r) => ({ quote: r.q, author: r.by })),
}));

const target = resolve(root, '../backend/app/seed/catalogue.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify({ artists }, null, 1) + '\n');
console.log(`Wrote ${artists.length} artists to ${target}`);
