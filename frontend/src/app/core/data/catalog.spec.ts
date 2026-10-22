import { ARTISTS, LISTED, artistById, fmt, matchArtists, rateTiers, searchChips } from './catalog';

describe('catalog', () => {
  it('formats prices the way the prototype does', () => {
    expect(fmt(400)).toBe('$400');
    expect(fmt(1200)).toBe('$1.2k');
    expect(fmt(6000)).toBe('$6k');
  });

  it('splits an artist range into three rate tiers', () => {
    const tiers = rateTiers({ min: 400, max: 2200, medium: 'Painting' });
    expect(tiers.map((t) => t.name)).toEqual(['Small', 'Medium', 'Large']);
    expect(tiers[0].range.startsWith('$400')).toBe(true);
    expect(tiers[2].range.endsWith('$2.2k')).toBe(true);
    expect(tiers[0].lead).toBe('About 3 weeks to finish');
  });

  it('fills every medium to six studios and only lists ones with artwork', () => {
    expect(ARTISTS.filter((a) => a.medium === 'Glass')).toHaveLength(6);
    expect(LISTED.every((a) => a.hasImages)).toBe(true);
    expect(LISTED.map((a) => a.id)).toContain('sol');
    expect(LISTED.map((a) => a.id)).not.toContain('lena');
  });

  it('matches search answers by medium and budget, most saved first', () => {
    const matches = matchArtists({ mediums: ['Painting'], budget: '$500 – $2k' });
    expect(matches.map((a) => a.id)).toEqual(['june', 'maren', 'sol', 'g0', 'clem']);
    expect(matchArtists({ mediums: ['Painting'], budget: '$15k +' })).toEqual([]);
  });

  it('summarises answers as chips in question order', () => {
    expect(
      searchChips({ mediums: ['Textile'], purpose: 'A gift', size: null, budget: '$2k – $5k' }),
    ).toEqual(['Textile', 'A gift', '$2k – $5k']);
  });

  it('decorates availability from the seed map', () => {
    expect(artistById('maren')?.availLabel).toBe('Waitlist open');
    expect(artistById('sol')?.availLabel).toBe('Taking commissions');
  });
});
