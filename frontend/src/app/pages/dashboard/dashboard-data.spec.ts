import { INBOX_SEED, inboxId } from '../../core/data/inbox-seed';
import {
  INQUIRIES,
  PAYDAY,
  PENDING,
  activeCommissions,
  timeline,
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

  it('lays commissions out across months, keeping undated deals off the timeline', () => {
    const t = timeline(0);
    expect(t.months.map((m) => m.label)).toEqual(['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']);
    const bars = t.groups.flatMap((g) => g.bars);
    const stage = (n: string) => bars.find((b) => b.name === n)?.stage;
    expect(stage('Elin Lindqvist')).toBe('wip');
    expect(stage('James Hartley')).toBe('deposit');
    expect(stage('Marta Kowalski')).toBe('contract');
    expect(stage('Matteo Rossi')).toBe('booked');
    expect(t.unscheduled.map((p) => p.name)).toEqual(['Leo Carrington', 'Henrik Dahl']);
    expect(t.today).toBeGreaterThan(100 / 6);
    expect(t.today).toBeLessThan(200 / 6);
  });
});
