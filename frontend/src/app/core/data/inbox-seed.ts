import type { Message, Thread, ThreadStatus } from './models';

/** Id of the incoming conversation with a patron, e.g. "in-sofia-brandt". */
export function inboxId(patron: string): string {
  return (
    'in-' +
    patron
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z]+/g, '-')
  );
}

interface Seed {
  name: string;
  hue: number;
  status: ThreadStatus;
  updated: string;
  unread?: boolean;
  type: string;
  budget: string;
  timeline: string;
  msg: string;
  date: string;
  msgs?: Message[];
}

const them = (text: string, time: string): Message => ({ me: false, text, time });
const me = (text: string, time: string): Message => ({ me: true, text, time });

/**
 * The demo artist's incoming conversations. The names match the dashboard's
 * new inquiries, active commissions and pending contracts, so every row there
 * links to a conversation here.
 */
const SEEDS: Seed[] = [
  // New inquiries, waiting for a reply.
  {
    name: 'Sofia Brandt',
    hue: 150,
    status: 'New inquiry',
    updated: 'Yesterday',
    unread: true,
    type: 'Wedding portrait',
    budget: '$3k–$4k',
    timeline: 'By June',
    msg: 'Wedding portrait from a photo of us on the day, to hang above the fireplace. We married in the hills outside Florence, so lots of soft evening light.',
    date: 'Oct 11',
  },
  {
    name: 'Tomás Reyes',
    hue: 250,
    status: 'New inquiry',
    updated: 'Oct 9',
    unread: true,
    type: 'Pet portrait',
    budget: 'Under $1.5k',
    timeline: 'Flexible',
    msg: 'Our greyhound, Lupe. Something small and warm for the hallway. She’s usually curled up on the green armchair.',
    date: 'Oct 9',
  },
  {
    name: 'Amelia Hart',
    hue: 30,
    status: 'New inquiry',
    updated: 'Oct 7',
    unread: true,
    type: 'Family portrait',
    budget: '$2k–$3k',
    timeline: 'By December',
    msg: 'Our two daughters in the garden, as a gift for my husband’s 50th. It would need to stay a surprise!',
    date: 'Oct 7',
  },
  {
    name: 'Kenji Mori',
    hue: 200,
    status: 'New inquiry',
    updated: 'Oct 5',
    type: 'Small study',
    budget: 'Under $1.5k',
    timeline: 'Flexible',
    msg: 'A small study of the view from our kitchen window in Kyoto. I can send photos from each season.',
    date: 'Oct 5',
  },
  {
    name: 'Nadia Petrova',
    hue: 320,
    status: 'New inquiry',
    updated: 'Oct 3',
    type: 'Portrait from a photograph',
    budget: '$1.5k–$2k',
    timeline: 'By March',
    msg: 'Portrait of my grandfather from his army photograph, 1962. The photo is small and a little faded.',
    date: 'Oct 3',
  },
  // Active commissions.
  {
    name: 'Elin Lindqvist',
    hue: 60,
    status: 'In progress',
    updated: 'Oct 10',
    type: 'Canvas, up to 90cm',
    budget: '$3k–$4k',
    timeline: 'By October',
    msg: 'A portrait of our house in Gotland before we sell it.',
    date: 'Aug 2',
    msgs: [
      me('The canvas is nearly finished. Pick-up is still set for October 23.', 'Oct 10, 09:20'),
      them('Wonderful, we can’t wait to see it in person.', 'Oct 10, 12:05'),
    ],
  },
  {
    name: 'Chidi Okafor',
    hue: 110,
    status: 'In progress',
    updated: 'Oct 6',
    type: 'Canvas, up to 120cm',
    budget: '$4k–$5k',
    timeline: 'By November',
    msg: 'A large piece for our restaurant’s main wall, inspired by Lagos markets.',
    date: 'Sep 1',
    msgs: [me('Underpainting is done. Sending a progress photo this week.', 'Oct 6, 17:40')],
  },
  {
    name: 'Ruth Adler',
    hue: 280,
    status: 'In progress',
    updated: 'Oct 4',
    type: 'Canvas, up to 60cm',
    budget: '$2k–$3k',
    timeline: 'By December',
    msg: 'Portrait of my mother at her piano.',
    date: 'Sep 20',
    msgs: [them('The deposit has gone through. Thank you!', 'Oct 4, 08:15')],
  },
  {
    name: 'James Hartley',
    hue: 15,
    status: 'In progress',
    updated: 'Oct 9',
    type: 'Small study',
    budget: 'Under $1.5k',
    timeline: 'By January',
    msg: 'A small oil study of our boat for my father.',
    date: 'Sep 28',
    msgs: [me('All booked. I’ll start in the second week of October.', 'Oct 9, 11:00')],
  },
  // Accepted, waiting on a contract.
  {
    name: 'Marta Kowalski',
    hue: 340,
    status: 'Awaiting signature',
    updated: 'Oct 8',
    type: 'Canvas, up to 60cm',
    budget: '$2k–$3k',
    timeline: 'By February',
    msg: 'A still life of the flowers from our wedding.',
    date: 'Sep 30',
    msgs: [me('I’ve sent the contract over. Let me know if you have questions.', 'Oct 8, 10:30')],
  },
  {
    name: 'Leo Carrington',
    hue: 180,
    status: 'Awaiting signature',
    updated: 'Oct 11',
    type: 'Canvas, up to 90cm',
    budget: '$3k–$4k',
    timeline: 'By March',
    msg: 'A painting of the coastline near our cottage in Cornwall.',
    date: 'Oct 2',
    msgs: [me('Contract sent. Once it’s signed I’ll book you in for January.', 'Oct 11, 16:10')],
  },
  {
    name: 'Henrik Dahl',
    hue: 90,
    status: 'Contract to send',
    updated: 'Oct 12',
    unread: true,
    type: 'Small study',
    budget: 'Under $1.5k',
    timeline: 'Flexible',
    msg: 'A small study of the birch trees behind our cabin.',
    date: 'Oct 5',
    msgs: [them('Great, we’d love to go ahead. What’s the next step?', 'Oct 12, 09:45')],
  },
];

export const INBOX_SEED: Thread[] = SEEDS.map((s) => ({
  id: inboxId(s.name),
  artistId: 'me',
  direction: 'incoming',
  patron: { name: s.name, hue: s.hue },
  status: s.status,
  updated: s.updated,
  unread: !!s.unread,
  inq: {
    works: [],
    type: s.type,
    budget: s.budget,
    timeline: s.timeline,
    msg: s.msg,
    date: s.date,
  },
  msgs: s.msgs ?? [],
}));
