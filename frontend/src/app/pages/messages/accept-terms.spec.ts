import { contractText, isoIn, longDate } from './accept-terms';
import { priceFromBudget } from './accept-dialog';

describe('accepting a commission', () => {
  it('fills the contract template with the agreed terms', () => {
    const text = contractText(
      {
        artist: 'June Park',
        studio: 'Studio June',
        patron: 'Sofia Brandt',
        piece: 'Wedding portrait',
        total: 3500,
      },
      {
        size: 'Canvas, up to 60cm',
        medium: 'Oil',
        revisions: 2,
        delivery: 'Shipping',
        notes: '',
        depositPct: 30,
        startDate: '2026-11-02',
        dueDate: '2027-01-15',
      },
    );
    expect(text).toContain('Between June Park (Studio June), the artist, and Sofia Brandt');
    expect(text).toContain(
      'Work begins on Nov 2, 2026 and the piece is delivered by Jan 15, 2027.',
    );
    expect(text).toContain('A deposit of $1,050 (30%)');
    expect(text).toContain('balance of $2,450');
    expect(text).toContain('2 rounds of revisions are included');
  });

  it('guesses a price from the patron’s budget', () => {
    expect(priceFromBudget('$3k–$4k', 900)).toBe(3500);
    expect(priceFromBudget('Under $1.5k', 900)).toBe(1500);
    expect(priceFromBudget(null, 900)).toBe(900);
  });

  it('writes dates out', () => {
    expect(longDate('2026-11-02')).toBe('Nov 2, 2026');
    expect(isoIn(10, new Date(2026, 9, 25))).toBe('2026-11-04');
  });
});
