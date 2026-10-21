import { INBOX_SEED, inboxId } from '../../core/data/inbox-seed';
import {
  INQUIRIES,
  PAYDAY,
  PENDING,
  activeCommissions,
  earnings,
  weekLoad,
  yearView,
} from './dashboard-data';

describe('dashboard sample data', () => {
  it('matches the prototype totals', () => {
    expect(PAYDAY.net).toBe('$2,521');
    expect(earnings().earned).toBe('$30,540');
    expect(earnings().upcoming).toBe('$10,520');
    expect(weekLoad().label).toBe('21 of 30 studio hours');
  });

  it('counts weeks left on each commission', () => {
    const rows = activeCommissions();
    expect(rows.map((r) => r.weeksLeft)).toEqual([
      '2 weeks left',
      '6 weeks left',
      '10 weeks left',
      '14 weeks left',
    ]);
    expect(rows[0].urgent).toBe(true);
    expect(rows[0].paid).toBe('$960 paid');
  });

  it('shows twelve months from this month, with the due piece marked', () => {
    const { range, months } = yearView(0);
    expect(range).toBe('2026–27');
    expect(months[0]).toMatchObject({ name: 'October', tag: 'Now', loadLabel: '44% booked' });
    expect(months[0].items.find((i) => i.name === 'Elin Lindqvist')?.mark).toBe('Due');
    expect(yearView(-12).months[0].past).toBe(true);
  });
});

describe('dashboard links into Messages', () => {
  it('has an incoming conversation for every inquiry, commission and pending contract', () => {
    const names = [
      ...INQUIRIES.map((q) => q.name),
      ...activeCommissions().map((c) => c.patron),
      ...PENDING.map((p) => p.name),
    ];
    const ids = new Set(INBOX_SEED.map((t) => t.id));
    expect(names.filter((n) => !ids.has(inboxId(n)))).toEqual([]);
    expect(inboxId('Tomás Reyes')).toBe('in-tomas-reyes');
  });
});
