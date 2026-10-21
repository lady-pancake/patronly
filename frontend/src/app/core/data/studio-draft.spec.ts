import {
  SEED_DRAFT,
  buildStudio,
  draftRange,
  orderedPieces,
  stepValidity,
  typeTiers,
} from './studio-draft';

describe('studio draft', () => {
  const priced = {
    ...SEED_DRAFT,
    types: SEED_DRAFT.types.map((t, i) =>
      i === 0 ? { ...t, from: '400', to: '900' } : i === 2 ? { ...t, to: '6000' } : t,
    ),
  };

  it('works out the price range from every type', () => {
    expect(draftRange(SEED_DRAFT)).toEqual({ min: 0, max: 0 });
    expect(draftRange(priced)).toEqual({ min: 400, max: 6000 });
  });

  it('needs a price before the pricing step is complete', () => {
    expect(stepValidity(SEED_DRAFT)[4]).toBe(false);
    expect(stepValidity(priced).every(Boolean)).toBe(true);
  });

  it('labels each type by what was filled in', () => {
    expect(typeTiers(priced.types).map((t) => t.range)).toEqual(['$400–$900', '—', 'Up to $6k']);
  });

  it('puts the search-card pieces first', () => {
    const d = { ...SEED_DRAFT, featured: ['seed4', 'seed2'] };
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
