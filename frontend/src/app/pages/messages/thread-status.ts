import type { Thread, ThreadStatus } from '../../core/data/models';

export const STATUS_STYLE: Record<ThreadStatus, { bg: string; fg: string }> = {
  Accepted: { bg: '#62394F', fg: 'oklch(0.985 0 0)' },
  'Deposit due': { bg: 'oklch(0.95 0.07 85)', fg: 'oklch(0.42 0.1 60)' },
  'Awaiting reply': { bg: 'oklch(0.95 0.07 85)', fg: 'oklch(0.42 0.1 60)' },
  'Quote received': { bg: 'color-mix(in oklab,#62394F 12%,white)', fg: '#62394F' },
  'In progress': { bg: 'oklch(0.94 0.06 155)', fg: 'oklch(0.38 0.1 155)' },
  'New inquiry': { bg: 'oklch(0.95 0.07 85)', fg: 'oklch(0.42 0.1 60)' },
  Replied: { bg: 'color-mix(in oklab,#62394F 12%,white)', fg: '#62394F' },
  'Contract to send': { bg: 'oklch(0.95 0.07 85)', fg: 'oklch(0.42 0.1 60)' },
  'Awaiting signature': { bg: 'color-mix(in oklab,#62394F 12%,white)', fg: '#62394F' },
};

/** Once an artist accepts, the status follows the contract and deposit steps. */
export function threadStatus(t: Thread): ThreadStatus {
  if (t.direction === 'incoming') {
    // Accepted here: follows the patron signing and paying.
    if (t.msgs.some((m) => m.type === 'accepted'))
      return t.contract?.paid
        ? 'In progress'
        : t.contract?.signed
          ? 'Deposit due'
          : 'Awaiting signature';
    // A new inquiry counts as replied once the artist has written back.
    return t.status === 'New inquiry' && t.msgs.some((m) => m.type !== 'accepted' && m.me)
      ? 'Replied'
      : t.status;
  }
  if (!t.msgs.some((m) => m.type === 'accepted')) return t.status;
  return t.contract?.paid ? 'In progress' : t.contract?.signed ? 'Deposit due' : 'Accepted';
}
