import {
  BLANK_DRAFT,
  type StudioDraft,
  buildStudio,
  draftRange,
  orderedPieces,
  stepValidity,
  typeTiers,
} from './studio-draft';

/** Shaped like the sample studio the API serves (backend/app/seed/studio_template.json). */
const SAMPLE: StudioDraft = {
  ...BLANK_DRAFT,
  name: 'Alex Ward',
  website: 'https://www.alexward.studio',
  mediums: ['Painting', 'Textile'],
  bio: 'First paragraph.\n\nSecond paragraph.',
  pieces: ['Garden in grey', 'Leaves', 'Magnolia', 'Two florals', 'Lace'].map((title, i) => ({
    id: `seed${i + 1}`,
    src: `/images/works/ob-${i + 1}.jpg`,
    title,
    medium: 'Gouache on paper',
    tags: [],
  })),
  featured: ['seed1', 'seed2', 'seed3'],
  types: BLANK_DRAFT.types.map((t, i) => ({
    ...t,
    from: ['500', '3500', '12000'][i],
    to: ['900', '5500', '20000'][i],
  })),
};

describe('studio draft', () => {
  const unpriced = { ...SAMPLE, types: BLANK_DRAFT.types };
  const priced = {
    ...unpriced,
    types: unpriced.types.map((t, i) =>
      i === 0 ? { ...t, from: '400', to: '900' } : i === 2 ? { ...t, to: '6000' } : t,
    ),
  };

  it('works out the price range from every type', () => {
    expect(draftRange(unpriced)).toEqual({ min: 0, max: 0 });
    expect(draftRange(priced)).toEqual({ min: 400, max: 6000 });
  });

  it('needs a price before the pricing step is complete', () => {
    expect(stepValidity(unpriced)[4]).toBe(false);
    expect(stepValidity(priced).every(Boolean)).toBe(true);
  });

  it('labels each type by what was filled in', () => {
    expect(typeTiers(priced.types).map((t) => t.range)).toEqual(['$400–$900', '—', 'Up to $6k']);
  });

  it('reads the sample prices', () => {
    expect(draftRange(SAMPLE)).toEqual({ min: 500, max: 20000 });
    expect(stepValidity(SAMPLE)[4]).toBe(true);
    expect(stepValidity(BLANK_DRAFT)[0]).toBe(false);
  });

  it('puts the search-card pieces first', () => {
    const d = { ...SAMPLE, featured: ['seed4', 'seed2'] };
    expect(orderedPieces(d).map((p) => p.id)).toEqual([
      'seed4',
      'seed2',
      'seed1',
      'seed3',
      'seed5',
    ]);
  });

  it('builds the studio page record', () => {
    const a = buildStudio(priced);
    expect(a.id).toBe('me');
    expect(a.priceLabel).toBe('$400 – $6k');
    expect(a.link.label).toBe('alexward.studio');
    expect(a.workList[0].title).toBe('Garden in grey');
    expect(a.bio).toHaveLength(2);
  });
});
