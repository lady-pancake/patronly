/**
 * Sample catalogue ported from the Patronly prototype (Patronly.html).
 * This stands in for the API until the GraphQL schema grows to cover studios,
 * works, reviews and messages.
 */
import type {
  ArtistSeed,
  Availability,
  FeedPost,
  MediumInfo,
  SavedSearch,
  Thread,
  WizardStep,
} from './models';

export const SEED_ARTISTS: ArtistSeed[] = [
  {
    id: 'hana',
    name: 'Hana Ito',
    studio: 'Kiln & Kin',
    medium: 'Ceramics',
    city: 'Kyoto',
    min: 180,
    max: 2400,
    commissions: 212,
    likes: 4120,
    hue: 75,
    c: 0.05,
    site: 'kilnandkin.jp',
    reply: 'Usually replies within 3 days.',
    tags: ['Stoneware', 'Wood-fired', 'Tableware sets', 'Wedding gifts', 'Restaurant orders'],
    quote: 'A cup should feel like it was waiting for your hand.',
    portrait: '/images/portraits/hana.jpg',
    cover: '/images/covers/hana-cover.jpg',
    process: '/images/process/hana-process.jpg',
    works: [
      ['Ash glaze tea set', 'Stoneware, set of 5', '/images/works/hana-tea-set.jpg'],
      ['Daisy mug', 'Hand-painted earthenware, 300ml', '/images/works/hana-mug.jpg'],
      ['Speckled nesting bowls', 'Stoneware, set of 4', '/images/works/hana-bowls.jpg'],
      ['Footed fern bowl', 'Hand-painted porcelain, 16cm', '/images/works/hana-fern-bowl.jpg'],
      ['Kintsugi study', 'Repaired porcelain', '/images/works/hana-kintsugi.jpg'],
    ],
    reviews: [
      { q: 'Our restaurant’s plates are the first thing guests photograph.', by: 'Kai L., Osaka' },
      { q: 'Packed so carefully nothing chipped across an ocean.', by: 'Emma T., Seattle' },
      { q: 'Hana sent glaze tests before firing. Lovely process.', by: 'Mira S., Berlin' },
    ],
    bio: [
      'Hana runs Kiln & Kin from a converted machiya in northern Kyoto with one apprentice and a shared anagama kiln that fires four times a year.',
      'Commissions are scheduled around those firings, so timelines are honest and fixed. She will send glaze tiles to choose from before your pieces are thrown.',
    ],
  },
  {
    id: 'ines',
    name: 'Ines Folau',
    studio: 'Folau Weaving',
    medium: 'Textile',
    city: 'Auckland',
    min: 600,
    max: 3800,
    commissions: 57,
    likes: 1890,
    hue: 20,
    c: 0.11,
    site: 'inesfolau.studio',
    reply: 'Usually replies within 2 days.',
    tags: ['Hand-woven', 'Wool and flax', 'Wall hangings', 'Large-scale', 'Natural dyes'],
    quote: 'Every thread is a decision. I like to make them slowly.',
    works: [
      ['Tide lines', 'Wool and flax, 2×1.4m'],
      ['Red earth', 'Natural dye on wool, 1.2m'],
      ['Stairwell piece', 'Wool, 3.6m drop'],
      ['Small loom no. 9', 'Cotton, 40×40cm'],
      ['Harbour', 'Flax and silk, 1.8m'],
      ['Weft study', 'Wool, 60×90cm'],
    ],
    reviews: [
      {
        q: 'Ines measured our stairwell twice and it fits like it grew there.',
        by: 'Sam & Lou, Wellington',
      },
      { q: 'The colours shift with the afternoon light.', by: 'Rangi P., Auckland' },
      { q: 'A calm, thoughtful collaborator.', by: 'Claire D., Sydney' },
    ],
    bio: [
      'Ines learned to weave from her grandmother in Tonga and now works on a 2.4-metre floor loom in a studio overlooking the Waitematā.',
      'She dyes most of her wool by hand, and every large commission begins with a palette of yarn samples posted to you.',
    ],
  },
  {
    id: 'theo',
    name: 'Theo Laskaris',
    studio: 'Laskaris Photographs',
    medium: 'Photography',
    city: 'Montana',
    min: 800,
    max: 4500,
    commissions: 131,
    likes: 2760,
    hue: 240,
    c: 0.04,
    site: 'laskaris.photo',
    cover: '/images/covers/theo-cover.jpg',
    portrait: '/images/portraits/theo.jpg',
    process: '/images/process/theo-process.jpg',
    rates: [
      { name: 'Mini session', detail: '30 minutes · 15 edited photos', from: 800, to: 1200 },
      { name: 'Family session', detail: '90 minutes · 40 edited photos', from: 1400, to: 2400 },
      {
        name: 'Half day on the ranch',
        detail: '4 hours · photos and 3 prints',
        from: 2800,
        to: 4500,
      },
    ],
    reply: 'Usually replies within 1 day.',
    tags: [
      'Family portraits',
      'Animal portraits',
      'Shot on film',
      'Archival prints',
      'Travels for shoots',
    ],
    quote: 'I wait for the second after people, and horses, stop posing.',
    works: [
      [
        'Poppy field, golden hour',
        'Family session, archival pigment print',
        '/images/works/theo-1.jpg',
      ],
      ['Lena in October', 'Portrait session, medium format film', '/images/works/theo-2.jpg'],
      [
        'Mare above the valley',
        'Animal portrait, archival pigment print',
        '/images/works/theo-5.jpg',
      ],
      ['Mira, looking away', 'Portrait session, medium format film', '/images/works/theo-4.jpg'],
      ['Bruna at rest', 'Animal portrait, silver gelatin print', '/images/works/theo-3.jpg'],
      ['On the bridge', 'Family session, archival pigment print', '/images/works/theo-6.jpg'],
    ],
    reviews: [
      { q: 'Our family photos finally look like us.', by: 'Kate R., Missoula' },
      { q: 'Fast, funny, and the prints are beautiful.', by: 'Hannah W., Denver' },
      { q: 'He got our old mare to look at the camera. A miracle.', by: 'Dimitra & Leo' },
    ],
    bio: [
      'Theo photographs families and the animals they love, from newborns in a poppy field to a horse in its own paddock. He shoots mostly on medium-format film and prints in a darkroom he built in an old barn outside Bozeman.',
      'Commissions include an unhurried outdoor session, a contact sheet you choose from, and hand-made prints you keep.',
    ],
  },
  {
    id: 'june',
    name: 'June Abernethy',
    studio: 'Small Hours Studio',
    medium: 'Painting',
    city: 'Glasgow',
    min: 250,
    max: 1800,
    commissions: 302,
    likes: 5210,
    hue: 300,
    c: 0.07,
    site: 'smallhours.studio',
    reply: 'Usually replies within 1 day.',
    tags: ['Watercolour', 'Ink and wash', 'Landscapes', 'Portraits from life', 'Framing available'],
    quote: 'Watercolour only works if you let the water have its say.',
    cover: '/images/covers/june-cover.jpg',
    portrait: '/images/portraits/june.jpg',
    process: '/images/process/june-process.jpg',
    works: [
      ['Loch, two colours', 'Watercolour on paper, 36×54cm', '/images/works/june-1.jpg'],
      ['Isla, reading', 'Watercolour and crayon, 40×56cm', '/images/works/june-2.jpg'],
      ['Kelvingrove at night', 'Ink and watercolour on board, 30×40cm', '/images/works/june-3.jpg'],
      ['Firth, blue and yellow', 'Watercolour on paper, 36×48cm', '/images/works/june-4.jpg'],
    ],
    reviews: [
      {
        q: 'Our painting of the loch is the best gift I have ever given.',
        by: 'Fiona C., Edinburgh',
      },
      { q: 'Quick colour studies, quicker replies.', by: 'Tom & Ade, Leeds' },
      { q: 'She painted our cat into the window without being asked.', by: 'Isla M., Glasgow' },
    ],
    bio: [
      'June paints in watercolour and ink at a desk by the window in her Partick flat, working from walks along the Clyde and sittings in the studio.',
      'Every commission starts with a sheet of quick colour studies. You pick a favourite, and she builds the finished painting from it.',
    ],
  },
  {
    id: 'lena',
    name: 'Lena Vossberg',
    studio: 'Atelier Vossberg',
    medium: 'Sculpture',
    city: 'Berlin',
    min: 2000,
    max: 18000,
    commissions: 28,
    likes: 1460,
    hue: 260,
    c: 0.02,
    site: 'atelier-vossberg.de',
    reply: 'Usually replies within 3 days.',
    tags: ['Bronze', 'Cast aluminium', 'Garden pieces', 'Public art', 'Plinths included'],
    quote: 'I want the weight of a thing to be part of what it says.',
    works: [
      ['Resting figure', 'Bronze, 80cm'],
      ['Garden stone', 'Cast aluminium'],
      ['Two hands', 'Bronze, 30cm'],
      ['Fountain study', 'Plaster maquette'],
      ['Courtyard piece', 'Bronze, 2.1m'],
      ['Small torso', 'Bronze, 24cm'],
    ],
    reviews: [
      { q: 'The maquette stage made the decision easy.', by: 'Garten Haus, Munich' },
      { q: 'Installed perfectly in our courtyard.', by: 'Anke & Paul, Hamburg' },
      { q: 'A serious artist with a light touch.', by: 'R. Okafor, London' },
    ],
    bio: [
      'Lena works from a former tram depot in Wedding, with a small foundry partner outside the city.',
      'Commissions begin with a plaster maquette you can hold, and every piece ships with its plinth and installation drawings.',
    ],
  },
  {
    id: 'sol',
    name: 'Sol Amari',
    studio: 'Atelier Amari',
    medium: 'Painting',
    city: 'Marrakech',
    min: 400,
    max: 2200,
    commissions: 96,
    likes: 2050,
    hue: 55,
    c: 0.1,
    site: 'solamari.art',
    cover: '/images/covers/sol-cover.jpg',
    processVideo: 'https://www.pexels.com/download/video/8347673/',
    portrait: '/images/portraits/sol.jpg',
    reply: 'Usually replies within 2 days.',
    tags: ['Oil on canvas', 'Landscapes', 'Portraits', 'Travel memories', 'Framing available'],
    quote: 'Tell me about a place you love. I’ll paint it the way it felt to be there.',
    works: [
      ['Tower, looking up', 'Oil on canvas, 80×130cm', '/images/works/sol-1.jpg'],
      ['Summer, unfolding', 'Oil on canvas, 46×60cm', '/images/works/sol-2.jpg'],
      ['Medina, noon', 'Oil on canvas, 70×80cm', '/images/works/sol-3.jpg'],
      ['Head, eyes closed', 'Oil on board, 34×44cm', '/images/works/sol-4.jpg'],
      ['Head in blue', 'Oil on paper, 32×42cm', '/images/works/sol-5.jpg'],
    ],
    reviews: [
      { q: 'Painted the riad where we married. Perfect.', by: 'Yasmin & Joe' },
      { q: 'Framed and shipped beautifully.', by: 'Claudia F., Milan' },
      { q: 'Gentle, warm, very professional.', by: 'Omar B., Rabat' },
    ],
    bio: [
      'Sol paints in oil on canvas and board in a rooftop studio in the medina, usually in the early morning light.',
      'Send photographs of a place or person that matters to you and she will paint it, starting with a small colour study.',
    ],
  },
  {
    id: 'clem',
    name: 'Clémence Aubry',
    studio: 'Atelier Aubry',
    medium: 'Painting',
    city: 'Ghent',
    min: 600,
    max: 4800,
    commissions: 71,
    likes: 1840,
    hue: 120,
    c: 0.06,
    site: 'clemenceaubry.be',
    reply: 'Usually replies within 3 days.',
    tags: [
      'Oil on canvas',
      'Floral still life',
      'Landscapes',
      'Painted from life',
      'Framing available',
    ],
    quote: 'Flowers last a week. I try to keep the light on them a little longer.',
    portrait: '/images/portraits/clem.jpg',
    process: '/images/process/clem-process.jpg',
    works: [
      ['Hawthorn in May', 'Oil on canvas, 30×40cm', '/images/works/clem-1.jpg'],
      ['Hellebores on the step', 'Oil on canvas, 60×80cm', '/images/works/clem-2.jpg'],
      ['Pansies', 'Oil on canvas, 40×32cm', '/images/works/clem-3.jpg'],
      ['Violets in a glass', 'Oil on panel, 20×25cm', '/images/works/clem-4.jpg'],
      ['Dahlias, blue table', 'Oil on canvas, 50×60cm', '/images/works/clem-5.jpg'],
    ],
    reviews: [
      {
        q: 'She painted the roses from our wedding before they faded.',
        by: 'Anouk & Pieter, Antwerp',
      },
      { q: 'The garden looks exactly as my mother kept it.', by: 'Hélène D., Lille' },
    ],
    bio: [
      'Clémence paints flowers and gardens from life in a glasshouse studio on the edge of Ghent.',
      'Bring or send the flowers, or invite her to a garden that matters to you. Each commission begins with a small oil sketch.',
    ],
  },
];

/** [name, hue, artist count] */
export const MEDIUMS: MediumInfo[] = (
  [
    ['Painting', 35, 412],
    ['Illustration', 300, 538],
    ['Ceramics', 75, 287],
    ['Photography', 240, 356],
    ['Sculpture', 260, 143],
    ['Textile', 20, 198],
    ['Murals', 150, 96],
    ['Printmaking', 10, 174],
    ['Jewelry', 85, 231],
    ['Woodwork', 60, 118],
    ['Glass', 200, 64],
    ['Calligraphy', 0, 89],
    ['Embroidery', 340, 152],
    ['Furniture', 50, 77],
    ['Collage', 120, 133],
    ['Mosaic', 180, 58],
  ] as [string, number, number][]
).map(([name, hue, count]) => ({ name, hue, count }));

export const ROLE: Record<string, string> = {
  Painting: 'Painter',
  Illustration: 'Illustrator',
  Ceramics: 'Ceramicist',
  Photography: 'Photographer',
  Sculpture: 'Sculptor',
  Textile: 'Textile artist',
  Murals: 'Muralist',
  Printmaking: 'Printmaker',
  Jewelry: 'Jeweller',
  Woodwork: 'Woodworker',
  Glass: 'Glass artist',
  Calligraphy: 'Calligrapher',
  Embroidery: 'Embroiderer',
  Furniture: 'Furniture maker',
  Collage: 'Collage artist',
  Mosaic: 'Mosaicist',
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    key: 'mediums',
    multi: true,
    q: 'What are you looking for?',
    grid: 'repeat(auto-fill,minmax(150px,1fr))',
  },
  {
    key: 'purpose',
    q: 'What is it for?',
    options: [
      ['For my home', 'A piece to live with'],
      ['A gift', 'Something personal for someone else'],
      ['For a business', 'A lobby, restaurant, office or shop'],
      ['A special occasion', 'A wedding, birth, anniversary or memorial'],
    ],
  },
  {
    key: 'size',
    q: 'How big are you imagining?',
    options: [
      ['Small', 'Fits on a shelf or desk'],
      ['Medium', 'Hangs above a sofa or sits on a table'],
      ['Large', 'Fills a wall or a room'],
      ['Not sure yet', 'The artist can help you decide'],
    ],
  },
  {
    key: 'budget',
    q: 'What would you like to spend?',
    options: [
      ['Under $500', ''],
      ['$500 – $2k', ''],
      ['$2k – $5k', ''],
      ['$5k – $15k', ''],
      ['$15k +', ''],
      ['Show me everything', ''],
    ],
  },
  {
    key: 'timeline',
    q: 'When do you need it?',
    options: [
      ['Whenever it’s ready', 'I’m flexible'],
      ['Within a month', 'A little urgent'],
      ['In 1–3 months', 'The usual pace'],
      ['For a specific date', 'I have a deadline in mind'],
    ],
  },
];

export const BUDGETS: Record<string, [number, number]> = {
  'Under $500': [0, 500],
  '$500 – $2k': [500, 2000],
  '$2k – $5k': [2000, 5000],
  '$5k – $15k': [5000, 15000],
  '$15k +': [15000, 1e9],
};

export const RECENT_SEARCHES: SavedSearch[] = [
  {
    name: 'Oil portrait of my parents',
    wiz: {
      mediums: ['Painting', 'Illustration'],
      purpose: 'A gift',
      size: 'Medium',
      budget: '$500 – $2k',
      timeline: 'In 1–3 months',
    },
    ids: ['sol', 'june'],
  },
];

export const FEED: FeedPost[] = [
  {
    id: 'theo',
    date: 'Oct 9',
    title: 'Two autumn ranch sessions left',
    text: 'The aspens are turning above the valley. I have two half-day sessions free before the first snow, horses and dogs welcome.',
    l: 0.6,
    src: '/images/works/theo-5.jpg',
  },
  {
    id: 'clem',
    date: 'Oct 7',
    title: 'Last of the garden roses',
    text: 'Painting the late roses before the frost. Studies from this week will be in my November newsletter, along with two spring commission slots.',
    l: 0.55,
    src: '/images/works/clem-2.jpg',
  },
  {
    id: 'hana',
    date: 'Oct 4',
    title: 'Autumn firing opens next week',
    text: 'Four commission slots left for the November anagama firing. Glaze tiles go out to everyone booked by the 20th.',
    l: 0.7,
    src: '/images/feed/hana-firing.jpg',
  },
  {
    id: 'sol',
    date: 'Oct 2',
    title: 'Colour studies from the medina',
    text: 'A new set of small studies from the rooftop, in the pinks and ochres of late afternoon. Each one can grow into a larger commission.',
    l: 0.6,
    src: '/images/works/sol-2.jpg',
  },
  {
    id: 'g0',
    date: 'Sep 26',
    title: 'Something new swimming upstream',
    text: 'A large panel is almost finished in the studio: two fish, one current and a lot of green. Prints of the study go to newsletter subscribers first.',
    l: 0.5,
    src: '/images/works/anders-3.jpg',
  },
  {
    id: 'june',
    date: 'Sep 22',
    title: 'Open studio at Small Hours',
    text: 'New watercolours, ink studies and tea at the Partick studio on Saturday 11 October, 11am to 4pm.',
    l: 0.78,
    src: '/images/feed/june-openstudio.jpg',
  },
];

export const AVAIL_MAP: Record<string, Availability> = {
  lena: 'Closed',
};

export const SAMPLE_THREADS: Thread[] = [
  {
    id: 't-sol',
    artistId: 'sol',
    status: 'Quote received',
    updated: 'Oct 6',
    unread: true,
    inq: {
      works: [0, 3],
      type: 'Canvas, up to 90cm',
      budget: '$1.2k–$2.2k',
      timeline: 'For a specific date',
      msg: 'I’d love a portrait of my parents for their 40th anniversary in March. They’re sitting together on the porch in most of my photos.',
      date: 'Oct 2',
    },
    msgs: [
      {
        me: false,
        text: 'Thank you, what a lovely occasion. I have space in my January calendar, which leaves plenty of time before March.',
        time: 'Oct 3, 10:12',
      },
      {
        me: true,
        text: 'That’s perfect. Would you work from photos or meet them?',
        time: 'Oct 3, 14:40',
      },
      {
        me: false,
        text: 'Ideally both. I’ve sent a quote for a 70×90cm canvas, starting with a small colour study. Let me know what you think.',
        time: 'Oct 5, 09:03',
      },
      { me: true, text: 'We love it. Let’s go ahead!', time: 'Oct 5, 18:20' },
      {
        type: 'accepted',
        time: 'Oct 6, 08:30',
        piece: 'Portrait, 70×90cm oil on canvas',
        total: 2000,
        deposit: 600,
        start: 'Jan 12, 2027',
        due: 'Mar 1, 2027',
      },
    ],
  },
  {
    id: 't-hana',
    artistId: 'hana',
    status: 'Awaiting reply',
    updated: 'Sep 30',
    unread: false,
    inq: {
      works: [0, 2],
      type: 'Set of 4–6',
      budget: '$400–$1.3k',
      timeline: 'In 1–3 months',
      msg: 'Could you make a set of six bowls in the ash glaze for our new kitchen?',
      date: 'Sep 30',
    },
    msgs: [],
  },
  {
    id: 't-ines',
    artistId: 'ines',
    status: 'In progress',
    updated: 'Sep 18',
    unread: false,
    inq: {
      works: [2],
      type: 'Large-scale',
      budget: '$2.1k–$3.8k',
      timeline: 'Whenever it’s ready',
      msg: 'Our stairwell has a 3.5m drop and lots of north light. Something in blues and greens?',
      date: 'Aug 21',
    },
    msgs: [
      {
        me: false,
        text: 'Yarn samples are in the post. The deep teal is my favourite with north light.',
        time: 'Aug 28, 16:20',
      },
      { me: true, text: 'They arrived! We love the teal and the sand.', time: 'Sep 4, 19:02' },
      {
        me: false,
        text: 'Wonderful. The warp is on the loom, and I’ll send progress photos every two weeks.',
        time: 'Sep 18, 11:45',
      },
    ],
  },
];

const FIRST = [
  'Amara',
  'Leo',
  'Noor',
  'Felix',
  'Ivy',
  'Tomás',
  'Zara',
  'Oskar',
  'Mei',
  'Ravi',
  'Clara',
  'Jonas',
  'Esme',
  'Kofi',
  'Lucia',
  'Arlo',
  'Saoirse',
  'Matteo',
  'Yuki',
  'Elif',
  'Bram',
  'Nadia',
  'Hugo',
  'Odile',
  'Tariq',
  'Wren',
  'Pia',
  'Emeka',
  'Greta',
  'Soren',
];
const LAST = [
  'Bell',
  'Moreau',
  'Haddad',
  'Lindqvist',
  'Okafor',
  'Reyes',
  'Tanaka',
  'Weiss',
  'Castell',
  'Novak',
  'Adeyemi',
  'Laurent',
  'Kowal',
  'Sato',
  'Ferreira',
  'Hale',
  'Marsh',
  'Varga',
  'Quinn',
  'Duarte',
  'Olsen',
  'Rossi',
  'Mbeki',
  'Kerr',
  'Aalto',
  'Benoit',
  'Cruz',
  'Petrov',
  'Ahn',
  'Lowe',
];
const CITIES = [
  'Copenhagen',
  'Brooklyn',
  'Oaxaca',
  'Seoul',
  'Melbourne',
  'Antwerp',
  'Cape Town',
  'Montréal',
  'Porto',
  'Tbilisi',
  'Edinburgh',
  'Kyoto',
  'Bogotá',
  'Marseille',
  'Vancouver',
  'Istanbul',
];
const GQ = [
  'I make things slowly so they last a long time.',
  'The best commissions start with a story I haven’t heard before.',
  'I want every piece to feel lived with, not just looked at.',
  'Materials tell me what they want to be. I mostly listen.',
];
const GR = [
  { q: 'Thoughtful from first message to delivery.', by: 'Patron, London' },
  { q: 'Exactly what we hoped for, and a little more.', by: 'Patron, New York' },
  { q: 'Clear on price, clear on timing.', by: 'Patron, Paris' },
];
const WT = [
  'Untitled no. 4',
  'Study in ochre',
  'For a quiet room',
  'Morning piece',
  'Commission for A.',
  'Small hours',
  'Second light',
  'Field notes',
];

/** Pads every medium to six studios so browsing feels full, as the prototype did. */
function fillCatalogue(list: ArtistSeed[]): void {
  let k = 0;
  for (const { name: m, hue } of MEDIUMS) {
    const have = list.filter((a) => a.medium === m).length;
    for (let i = have; i < 6; i++, k++) {
      const f = FIRST[k % FIRST.length],
        l = LAST[(k * 7) % LAST.length],
        city = CITIES[(k * 5) % CITIES.length];
      const min = [150, 300, 500, 800, 1200, 2000][(k * 3) % 6];
      list.push({
        id: 'g' + k,
        name: f + ' ' + l,
        studio: l + ' Studio',
        medium: m,
        city,
        min,
        max: min * [4, 6, 8, 5][k % 4],
        commissions: 12 + ((k * 37) % 180),
        likes: 200 + ((k * 613) % 4200),
        hue: (hue + (i - 3) * 12 + 360) % 360,
        c: 0.07,
        site: (f + l).toLowerCase() + '.studio',
        reply:
          k % 4
            ? 'Usually replies within ' + (1 + (k % 4)) + ' days.'
            : 'Usually replies within a day.',
        tags: [m, 'Commissions open', city, ['Ships worldwide', 'Local only', 'Gift-ready'][k % 3]],
        quote: GQ[k % GQ.length],
        works: WT.slice(k % 3, (k % 3) + 6).map((t) => [t, m] as [string, string]),
        reviews: GR,
        avail: (['Open', 'Waitlist', 'Open', 'Closed'] as const)[k % 4],
        bio: [
          f +
            ' works from a studio in ' +
            city +
            ', making ' +
            m.toLowerCase() +
            ' to commission for homes, collectors and gifts.',
          'Every commission starts with a short call about where the piece will live, followed by a sketch or sample before work begins.',
        ],
      });
    }
  }
  const j = list.find((a) => a.medium === 'Jewelry');
  if (j) {
    j.works = [
      ['Baroque pearl drop', 'Brushed gold and freshwater pearl', '/images/works/jewel-1.jpg'],
      ['Twisted knot earrings', 'Recycled 18k gold', '/images/works/jewel-2.jpg'],
      ['Freshwater pearl strand', 'Pearls on silk, 45cm', '/images/works/jewel-3.jpg'],
      ...j.works.slice(3),
    ];
    j.tags = [
      'Gold and pearl',
      'Earrings',
      'Wedding jewellery',
      'Made to order',
      'Ships worldwide',
    ];
  }
  const s = list.find((a) => a.medium === 'Painting' && a.id.startsWith('g'));
  if (s) {
    Object.assign(s, {
      name: 'Anders Bell',
      studio: 'Atelier Bell',
      site: 'andersbell.studio',
      min: 900,
      max: 6000,
      commissions: 41,
      likes: 1880,
      cover: '/images/covers/anders-cover.jpg',
      portrait: '/images/portraits/anders.jpg',
      quote: 'I paint the fish I meet when I close my eyes.',
      tags: [
        'Oil on panel',
        'Surrealism',
        'Dreamlike sea life',
        'Large canvases',
        'Ships worldwide',
      ],
      works: [
        ['The grotto', 'Oil on panel, 70×50cm', '/images/works/anders-1.jpg'],
        ['Anemone choir', 'Oil on canvas, 50×70cm', '/images/works/anders-2.jpg'],
        ['Two going upstream', 'Oil on linen, 60×42cm', '/images/works/anders-3.jpg'],
        ['Meeting at midnight', 'Oil on canvas, 90×58cm', '/images/works/anders-4.jpg'],
        ['Mother and minnow', 'Oil on panel, 50×36cm', '/images/works/anders-5.jpg'],
      ],
      bio: [
        'Anders paints soft, glowing fish that drift through night skies, caves and coral, in a top-floor studio overlooking the harbour in Copenhagen.',
        'Tell him about a dream, a person or a place, and he will turn it into a scene of its own. Every commission starts with a small oil sketch.',
      ],
    });
  }
  const w = list.find((a) => a.medium === 'Woodwork');
  if (w) {
    Object.assign(w, {
      cover: '/images/covers/arlo-cover.jpg',
      portrait: '/images/portraits/arlo.jpg',
      process: '/images/process/arlo-process.jpg',
      quote: 'Every board has a grain to follow. I try not to argue with it.',
      tags: [
        'Hand carving',
        'Turned vessels',
        'Serving boards',
        'Live edge and resin',
        'Ships worldwide',
      ],
      works: [
        ['Interlace panel', 'Carved oak relief, 40×60cm', '/images/works/arlo-1.jpg'],
        ['Scroll frame', 'Carved teak panel, 61×44cm', '/images/works/arlo-2.jpg'],
        ['Bud vase and tray', 'Walnut with resin inlay', '/images/works/arlo-3.jpg'],
        ['Paired serving boards', 'Rosewood, set of 2', '/images/works/arlo-4.jpg'],
        ['Gourd vase', 'Turned maple with bark seam, 22cm', '/images/works/arlo-5.jpg'],
        ['Bark vessel', 'Pine bark on reclaimed oak', '/images/works/arlo-6.jpg'],
      ],
      bio: [
        'Arlo works from a shared woodshop in Brooklyn, hand-carving relief panels and turning vessels from offcuts and storm-felled trees.',
        'Every commission starts with a pencil drawing on the board itself, so you see the grain and the layout before the first cut.',
      ],
    });
  }
}
fillCatalogue(SEED_ARTISTS);
