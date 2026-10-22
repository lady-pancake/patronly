import { artistById, LISTED, setCatalogue } from './catalog';
import { type ApiArtist, fromApi } from './catalog-loader';
import { SEED_ARTISTS } from './seed';

const api: ApiArtist = {
  slug: 'ada',
  position: 0,
  displayName: 'Ada Lind',
  studio: 'Lind Studio',
  medium: 'Ceramics',
  city: 'Oslo',
  priceMin: 300,
  priceMax: 2400,
  commissions: 12,
  likes: 340,
  hue: 75,
  chroma: 0.08,
  site: 'adalind.studio',
  replyNote: 'Usually replies within 2 days.',
  tags: ['Ceramics'],
  quote: 'Clay remembers.',
  bio: 'First paragraph.\n\nSecond paragraph.',
  availability: 'WAITLIST',
  coverUrl: null,
  portraitUrl: '/images/portraits/ada.jpg',
  processUrl: null,
  processVideoUrl: null,
  coverVideoUrl: null,
  works: [
    { title: 'Bowl', material: 'Stoneware', imageUrl: '/images/works/ada-1.jpg' },
    { title: 'Jug', material: 'Porcelain', imageUrl: null },
  ],
  reviews: [{ quote: 'Lovely.', author: 'Sam' }],
};

describe('catalogue from the API', () => {
  afterEach(() => setCatalogue(SEED_ARTISTS, 'sample'));

  it('maps API fields to the UI model', () => {
    const a = fromApi(api)!;
    expect(a).toMatchObject({ id: 'ada', name: 'Ada Lind', min: 300, max: 2400, c: 0.08 });
    expect(a.avail).toBe('Waitlist');
    expect(a.bio).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(a.works).toEqual([
      ['Bowl', 'Stoneware', '/images/works/ada-1.jpg'],
      ['Jug', 'Porcelain'],
    ]);
    expect(a.reviews).toEqual([{ q: 'Lovely.', by: 'Sam' }]);
    expect(a.cover).toBeUndefined();
  });

  it('skips artists without a slug', () => {
    expect(fromApi({ ...api, slug: null })).toBeNull();
  });

  it('replaces the catalogue', () => {
    setCatalogue([fromApi(api)!], 'api');
    expect(artistById('ada')?.availLabel).toBe('Waitlist open');
    expect(artistById('june')).toBeUndefined();
    expect(LISTED.map((x) => x.id)).toEqual(['ada']);
  });
});
