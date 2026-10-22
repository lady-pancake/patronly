import type { CommissionTerms } from '../../core/data/models';

/** A date given as YYYY-MM-DD, written out, e.g. "Nov 2, 2026". */
export function longDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + 'T12:00').toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** A date `days` from `from`, as YYYY-MM-DD. */
export function isoIn(days: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 12);
  return d.toISOString().slice(0, 10);
}

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export interface ContractParties {
  artist: string;
  studio: string;
  patron: string;
  piece: string;
  total: number;
}

/** Patronly's standard commission agreement, filled in with the agreed terms. */
export function contractText(p: ContractParties, t: Omit<CommissionTerms, 'contract'>): string {
  const deposit = Math.round((p.total * t.depositPct) / 100);
  const revisions =
    t.revisions === 0
      ? 'No revisions are included once the sketch is approved.'
      : `${t.revisions} round${t.revisions === 1 ? '' : 's'} of revisions ${t.revisions === 1 ? 'is' : 'are'} included at the sketch stage.`;
  const delivery =
    t.delivery === 'Pickup'
      ? 'The patron collects the finished piece from the studio.'
      : t.delivery === 'Shipping'
        ? 'The artist ships the finished piece, insured, to the patron’s address. Shipping is included.'
        : 'The artist delivers a high-resolution digital file.';
  return [
    `COMMISSION AGREEMENT`,
    ``,
    `Between ${p.artist} (${p.studio}), the artist, and ${p.patron}, the patron.`,
    ``,
    `1. The work`,
    `${p.piece}. ${t.size}, ${t.medium.toLowerCase()}.${t.notes ? ` ${t.notes}` : ''}`,
    ``,
    `2. Dates`,
    `Work begins on ${longDate(t.startDate)} and the piece is delivered by ${longDate(t.dueDate)}. Work starts only once the deposit is paid.`,
    ``,
    `3. Price and payment`,
    `The total price is ${money(p.total)}. A deposit of ${money(deposit)} (${t.depositPct}%) is due on signing and is refundable until work begins. The balance of ${money(p.total - deposit)} is due on delivery.`,
    ``,
    `4. Revisions`,
    revisions,
    ``,
    `5. Delivery`,
    delivery,
    ``,
    `6. Rights`,
    `The artist keeps the copyright and may show the work in their portfolio. The patron owns the original.`,
  ].join('\n');
}
