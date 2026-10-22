import { INBOX_SEED, inboxId } from '../../core/data/inbox-seed';
import {
  INQUIRIES,
  PAYDAY,
  PENDING,
  activeCommissions,
  monthCommissions,
  earnings,
  weekLoad,
  yearView,
} from './dashboard-data';

describe('dashboard sample data', () => {
  it('matches the prototype totals', () => {
    expect(PAYDAY.net).toBe('$2,521');
    expect(earnings().earned).toBe('$30,540');
    expect(earnings().upcoming).toBe('$10,520');
    expect(weekLoad().label).toBe('19 of 30 studio hours');
  });

  it('counts weeks left on each commission', () => {
    const rows = activeCommissions();
    expect(rows.map((r) => r.weeksLeft)).toEqual(['2 weeks left', '6 weeks left', '10 weeks left']);
    expect(rows[0].urgent).toBe(true);
    expect(rows[0].paid).toBe('$960 paid');
  });

  it('keeps a commission waiting on its deposit in pending, not active', () => {
    expect(activeCommissions().some((c) => c.patron === 'James Hartley')).toBe(false);
    expect(PENDING.find((p) => p.name === 'James Hartley')).toMatchObject({
      stage: 'deposit',
      deposit: '$360 deposit due',
    });
  });

  it('shows twelve months from this month, with the due piece marked', () => {
    const { range, months } = yearView(0);
    expect(range).toBe('2026–27');
    expect(months[0]).toMatchObject({ name: 'October', tag: 'Now', loadLabel: '42% booked' });
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

  it('filters commissions by month, keeping undated pending ones in every month ahead', () => {
    const oct = monthCommissions(2026 * 12 + 9);
    expect(oct.inProgress.map((c) => c.patron)).toContain('Elin Lindqvist');
    expect(oct.pending.map((p) => p.name)).toContain('James Hartley');
    expect(oct.completed.map((c) => c.name)).toContain('Claire Moreau');

    const feb = monthCommissions(2027 * 12 + 1);
    expect(feb.pending.map((p) => p.name)).not.toContain('James Hartley');
    expect(feb.pending.map((p) => p.name)).toContain('Henrik Dahl');
    expect(feb.booked.map((b) => b.name)).toContain('Ingrid Holm');

    expect(monthCommissions(2026 * 12 + 5).pending).toEqual([]);
  });
});
