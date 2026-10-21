/**
 * Sample numbers for the artist dashboard, taken from the prototype. They
 * stand in for real payouts, inquiries and commissions until the API has them.
 * "Today" is fixed so the sample schedule always reads the same way.
 */
import { tone } from '../../core/data/catalog';

export const TODAY = new Date(2026, 9, 12);
const DAY = 864e5;
const WEEK = 7 * DAY;

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const monthDay = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
const at = (iso: string) => new Date(iso + 'T12:00');

// ── Payday ──────────────────────────────────────────────────────────────

const PAYOUT_GROSS = 780 + 1960;
export const PAYDAY = {
  net: money(PAYOUT_GROSS - Math.round(PAYOUT_GROSS * 0.08)),
  when: 'Friday, 16 October · in 4 days',
};

// ── Earnings ────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** [paid, upcoming under contract] for each month of 2026. */
const EARN: [number, number][] = [
  [2100, 0],
  [3400, 0],
  [1200, 0],
  [4600, 0],
  [2800, 0],
  [3900, 0],
  [5200, 0],
  [2400, 0],
  [3100, 0],
  [1840, 4980],
  [0, 3360],
  [0, 2180],
];
const COMPLETED = [1, 2, 1, 2, 1, 2, 3, 1, 2, 1, 0, 0];
const DUE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1];

export interface EarningsBar {
  month: string;
  full: string;
  paidPct: number;
  upPct: number;
  totalPct: number;
  current: boolean;
  rows: { label: string; value: string; color: string }[];
}

export function earnings() {
  const max = Math.max(...EARN.map(([p, u]) => p + u));
  const bars: EarningsBar[] = EARN.map(([paid, up], i) => {
    const rows = [
      ...(paid ? [{ label: 'Paid', value: money(paid), color: 'var(--primary)' }] : []),
      ...(up ? [{ label: 'Upcoming', value: money(up), color: 'var(--sage)' }] : []),
      ...(paid && up ? [{ label: 'Total', value: money(paid + up), color: 'transparent' }] : []),
      ...(COMPLETED[i]
        ? [{ label: 'Commissions completed', value: String(COMPLETED[i]), color: 'transparent' }]
        : []),
      ...(DUE[i]
        ? [{ label: 'Commissions due', value: String(DUE[i]), color: 'transparent' }]
        : []),
    ];
    return {
      month: MONTHS[i],
      full: new Date(2026, i, 1).toLocaleString('en-US', { month: 'long' }) + ' 2026',
      paidPct: (paid / max) * 100,
      upPct: (up / max) * 100,
      totalPct: ((paid + up) / max) * 100,
      current: i === TODAY.getMonth(),
      rows,
    };
  });
  return {
    earned: money(EARN.reduce((a, [p]) => a + p, 0)),
    upcoming: money(EARN.reduce((a, [, u]) => a + u, 0)),
    bars,
  };
}

// ── Inquiries ───────────────────────────────────────────────────────────

export interface InquiryRow {
  name: string;
  avatar: string;
  when: string;
  text: string;
  meta: string;
}

export const INQUIRIES: InquiryRow[] = (
  [
    [
      'Sofia Brandt',
      150,
      'Yesterday',
      'Wedding portrait from a photo of us on the day, to hang above the fireplace.',
      '$3k–$4k · By June',
    ],
    [
      'Tomás Reyes',
      250,
      'Oct 9',
      'Our greyhound, Lupe. Something small and warm for the hallway.',
      'Under $1.5k · Flexible',
    ],
    [
      'Amelia Hart',
      30,
      'Oct 7',
      'Our two daughters in the garden, as a gift for my husband’s 50th.',
      '$2k–$3k · By December',
    ],
    [
      'Kenji Mori',
      200,
      'Oct 5',
      'A small study of the view from our kitchen window in Kyoto.',
      'Under $1.5k · Flexible',
    ],
    [
      'Nadia Petrova',
      320,
      'Oct 3',
      'Portrait of my grandfather from his army photograph, 1962.',
      '$1.5k–$2k · By March',
    ],
  ] as [string, number, string, string, string][]
).map(([name, hue, when, text, meta]) => ({
  name,
  avatar: tone(hue, 0.88, 0.04),
  when,
  text,
  meta,
}));

// ── Commissions ─────────────────────────────────────────────────────────

interface Commission {
  patron: string;
  type: string;
  /** Percent of the work done. */
  done: number;
  dueVerb: string;
  start: string;
  due: string;
  total: number;
  balance: number;
  hours: number;
}

const COMMISSIONS: Commission[] = [
  {
    patron: 'Elin Lindqvist',
    type: 'Canvas, up to 90cm',
    done: 90,
    dueVerb: 'Pick up on',
    start: '2026-08-17',
    due: '2026-10-23',
    total: 3200,
    balance: 2240,
    hours: 40,
  },
  {
    patron: 'Chidi Okafor',
    type: 'Canvas, up to 120cm',
    done: 40,
    dueVerb: 'Ship by',
    start: '2026-09-14',
    due: '2026-11-20',
    total: 4800,
    balance: 3360,
    hours: 120,
  },
  {
    patron: 'Ruth Adler',
    type: 'Canvas, up to 60cm',
    done: 15,
    dueVerb: 'Ship by',
    start: '2026-10-02',
    due: '2026-12-18',
    total: 2600,
    balance: 1820,
    hours: 60,
  },
  {
    patron: 'James Hartley',
    type: 'Small study',
    done: 0,
    dueVerb: 'Deliver by',
    start: '2026-10-09',
    due: '2027-01-15',
    total: 1200,
    balance: 840,
    hours: 20,
  },
];

export interface ActiveRow {
  patron: string;
  type: string;
  totalHours: string;
  started: string;
  weeksLeft: string;
  urgent: boolean;
  dueLabel: string;
  total: string;
  paid: string;
  paidPct: number;
  balance: string;
}

export function activeCommissions(): ActiveRow[] {
  return COMMISSIONS.map((c) => {
    const due = at(c.due);
    const weeks = Math.max(0, Math.ceil((due.getTime() - TODAY.getTime()) / WEEK));
    const paid = c.total - c.balance;
    return {
      patron: c.patron,
      type: c.type,
      totalHours: `${c.hours} hrs total`,
      started: `Started ${monthDay(at(c.start))}`,
      weeksLeft: `${weeks} ${weeks === 1 ? 'week' : 'weeks'} left`,
      urgent: weeks <= 2,
      dueLabel: `${c.dueVerb} ${monthDay(due)}`,
      total: money(c.total),
      paid: `${money(paid)} paid`,
      paidPct: (paid / c.total) * 100,
      balance: `${money(c.balance)} due`,
    };
  });
}

/** Hours booked this week, with remaining work spread evenly up to each due date. */
export function weekLoad(capacity = 30) {
  const thisWeek = new Date(TODAY.getTime() + 12 * 36e5);
  const weekIndex = (d: Date) => Math.floor((d.getTime() - thisWeek.getTime()) / WEEK);
  const hours = COMMISSIONS.reduce((sum, c) => {
    const a = Math.max(0, weekIndex(at(c.start)));
    const b = Math.max(a, weekIndex(at(c.due)));
    const left = c.hours * (1 - c.done / 100);
    return a === 0 ? sum + left / (b - a + 1) : sum;
  }, 0);
  const pct = Math.min(100, (hours / capacity) * 100);
  return {
    label: `${Math.round(hours)} of ${capacity} studio hours`,
    pct,
    over: hours > capacity,
    near: hours >= capacity * 0.9,
  };
}

export interface PendingRow {
  name: string;
  type: string;
  accepted: string;
  total: string;
  deposit: string;
  sent: boolean;
}

/** Accepted inquiries still waiting on a signed contract. */
export const PENDING: PendingRow[] = (
  [
    ['Marta Kowalski', 'Canvas, up to 60cm', 2400, 'Oct 8', true],
    ['Leo Carrington', 'Canvas, up to 90cm', 3600, 'Oct 11', true],
    ['Henrik Dahl', 'Small study', 950, 'Oct 12', false],
  ] as [string, string, number, string, boolean][]
).map(([name, type, total, accepted, sent]) => ({
  name,
  type,
  accepted,
  total: money(total),
  deposit: `${money(Math.round(total * 0.3))} deposit on signing`,
  sent,
}));

// ── Calendar ────────────────────────────────────────────────────────────

type Stage = 'done' | 'wip' | 'booked';

/** [patron, type, first month, last month, stage] */
const BOOKINGS: [string, string, string, string, Stage][] = [
  ['Ana Sousa', 'Small study', '2025-12', '2026-01', 'done'],
  ['Marc Dubois', 'Canvas, up to 60cm', '2026-01', '2026-02', 'done'],
  ['Inês Carvalho', 'Small study', '2026-02', '2026-02', 'done'],
  ['Hugo Lemaire', 'Canvas, up to 90cm', '2026-02', '2026-03', 'done'],
  ['Grace Whitfield', 'Canvas, up to 60cm', '2026-03', '2026-04', 'done'],
  ['Yara Haddad', 'Canvas, up to 120cm', '2026-03', '2026-05', 'done'],
  ['Pedro Alves', 'Small study', '2026-04', '2026-04', 'done'],
  ['Noah Bennett', 'Canvas, up to 60cm', '2026-05', '2026-06', 'done'],
  ['Lena Fischer', 'Small study', '2026-06', '2026-06', 'done'],
  ['Sara Costa', 'Canvas, up to 90cm', '2026-06', '2026-07', 'done'],
  ['Ollie Grant', 'Small study', '2026-07', '2026-07', 'done'],
  ['Beatriz Lima', 'Canvas, up to 60cm', '2026-07', '2026-07', 'done'],
  ['Felix Wagner', 'Canvas, up to 90cm', '2026-07', '2026-08', 'done'],
  ['Jonas Weber', 'Canvas, up to 60cm', '2026-08', '2026-09', 'done'],
  ['Amara Obi', 'Small study', '2026-09', '2026-09', 'done'],
  ['Claire Moreau', 'Canvas, up to 90cm', '2026-08', '2026-10', 'done'],
  ...COMMISSIONS.map(
    (c) =>
      [c.patron, c.type, c.start.slice(0, 7), c.due.slice(0, 7), 'wip'] as [
        string,
        string,
        string,
        string,
        Stage,
      ],
  ),
  ['Matteo Rossi', 'Canvas, up to 90cm', '2027-01', '2027-02', 'booked'],
  ['Ingrid Holm', 'Small study', '2027-02', '2027-02', 'booked'],
  ['Laila Nasser', 'Canvas, up to 60cm', '2027-03', '2027-04', 'booked'],
];
// James Hartley hasn't started yet, so he shows as booked rather than in progress.
BOOKINGS.find((b) => b[0] === 'James Hartley')![4] = 'booked';

const TYPE_HOURS: Record<string, number> = {
  'Small study': 10,
  'Canvas, up to 60cm': 24,
  'Canvas, up to 90cm': 40,
  'Canvas, up to 120cm': 60,
};
const MONTH_CAPACITY = 130;

export const STAGES: Record<Stage, { bg: string; fg: string; label: string }> = {
  done: { bg: 'oklch(0.93 0 0)', fg: 'oklch(0.4 0 0)', label: 'Completed' },
  wip: { bg: 'oklch(0.9 0.045 240)', fg: 'oklch(0.35 0.09 250)', label: 'In progress' },
  booked: { bg: 'oklch(0.93 0.03 75)', fg: 'oklch(0.4 0.05 60)', label: 'Booked' },
};

const monthNo = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + m - 1;
};

export interface MonthCard {
  key: number;
  name: string;
  tag: string;
  current: boolean;
  past: boolean;
  loadPct: number;
  loadLabel: string;
  loadTitle: string;
  items: { name: string; title: string; stage: Stage; mark: 'Due' | 'Overdue' | null }[];
  emptyLabel: string;
}

/** Twelve month cards starting `offset` months from this month. */
export function yearView(offset: number): { range: string; months: MonthCard[] } {
  const now = TODAY.getFullYear() * 12 + TODAY.getMonth();
  const months = Array.from({ length: 12 }, (_, k): MonthCard => {
    const n = now + offset + k;
    const year = Math.floor(n / 12);
    const past = n < now;
    const current = n === now;
    const active = BOOKINGS.filter((b) => monthNo(b[2]) <= n && monthNo(b[3]) >= n);
    const hours = Math.round(
      active.reduce((a, b) => a + (TYPE_HOURS[b[1]] ?? 0) / (monthNo(b[3]) - monthNo(b[2]) + 1), 0),
    );
    const pct = Math.min(100, (hours / MONTH_CAPACITY) * 100);
    return {
      key: n,
      name: new Date(year, n % 12, 1).toLocaleString('en-US', { month: 'long' }),
      tag: current ? 'Now' : String(year),
      current,
      past,
      loadPct: pct,
      loadLabel: hours ? (pct >= 100 ? 'Full' : `${Math.round(pct)}% booked`) : 'Open',
      loadTitle: `${hours} of about ${MONTH_CAPACITY} studio hours`,
      items: active.map(([name, type, , end, stage]) => {
        const open = stage !== 'done';
        const overdue = open && monthNo(end) < now && n >= monthNo(end);
        const due = open && !overdue && monthNo(end) === n && current;
        return {
          name,
          title: `${name} · ${type} · ${STAGES[stage].label}`,
          stage,
          mark: overdue ? 'Overdue' : due ? 'Due' : null,
        };
      }),
      emptyLabel: past ? 'No commissions' : 'Open for bookings',
    };
  });
  const y1 = Math.floor((now + offset) / 12);
  const y2 = Math.floor((now + offset + 11) / 12);
  return { range: y1 === y2 ? String(y1) : `${y1}–${String(y2).slice(2)}`, months };
}
