export type Availability = 'Open' | 'Waitlist' | 'Closed';

/** [title, material, image url] — the image is optional. */
export type WorkTuple = [title: string, material: string, src?: string];

export interface Review {
  q: string;
  by: string;
}

/** Raw artist record, as it would come from the API. */
export interface ArtistSeed {
  id: string;
  name: string;
  studio: string;
  medium: string;
  city: string;
  min: number;
  max: number;
  commissions: number;
  likes: number;
  /** Hue and chroma used for colour placeholders when a work has no image. */
  hue: number;
  c: number;
  site: string;
  reply: string;
  tags: string[];
  quote: string;
  works: WorkTuple[];
  reviews: Review[];
  bio: string[];
  avail?: Availability;
  cover?: string;
  portrait?: string;
  process?: string;
  processVideo?: string;
  /** Short looping video shown behind the studio header. */
  coverVideo?: string;
  /** The artist's own commission options. Without them, min..max is split into three. */
  rates?: ArtistRate[];
}

/** A commission option as the artist entered it. */
export interface ArtistRate {
  name: string;
  /** What it includes, e.g. "90 minutes · 40 edited photos". */
  detail: string;
  from: number;
  to: number;
}

export interface Work {
  title: string;
  material: string;
  src?: string;
  /** CSS background: the image, or a colour placeholder. */
  bg: string;
}

export interface RateTier {
  name: string;
  lead: string;
  range: string;
}

export interface Artist extends ArtistSeed {
  role: string;
  first: string;
  /** Solid colour for avatars. */
  bg: string;
  heroBg: string;
  processBg: string;
  portraitBg: string;
  priceLabel: string;
  likesLabel: string;
  availability: Availability;
  availLabel: string;
  workList: Work[];
  tiers: RateTier[];
  link: { label: string; href: string };
  hasImages: boolean;
}

export interface MediumInfo {
  name: string;
  hue: number;
  count: number;
}

export interface WizardStep {
  key: 'mediums' | 'purpose' | 'size' | 'budget' | 'timeline';
  multi?: boolean;
  q: string;
  grid?: string;
  /** [label, sub-label] */
  options?: [string, string][];
}

export interface WizardAnswers {
  mediums: string[];
  purpose?: string | null;
  size?: string | null;
  budget?: string | null;
  timeline?: string | null;
  avail?: string | null;
}

export interface SavedSearch {
  name: string;
  wiz: WizardAnswers;
  ids: string[];
  sig?: string;
}

export interface FeedPost {
  id: string;
  date: string;
  title: string;
  text: string;
  /** Lightness for the colour placeholder behind the image. */
  l: number;
  src?: string;
}

export interface TextMessage {
  type?: undefined;
  me: boolean;
  text: string;
  time: string;
}

export interface AcceptedMessage {
  type: 'accepted';
  time: string;
  piece: string;
  total: number;
  deposit: number;
  start: string;
  due: string;
  /** Set when the artist accepted in Patronly: the agreed details behind the card. */
  terms?: CommissionTerms;
}

/** What an artist agrees to when accepting a commission. */
export interface CommissionTerms {
  /** Size or format, e.g. "Canvas, up to 60cm". */
  size: string;
  medium: string;
  revisions: number;
  delivery: 'Pickup' | 'Shipping' | 'Digital file';
  notes: string;
  depositPct: number;
  /** Agreed dates, as YYYY-MM-DD. */
  startDate: string;
  dueDate: string;
  /** The contract sent: Patronly's template (its text) or the artist's own file. */
  contract: { kind: 'template'; text: string } | { kind: 'file'; name: string };
}

export type Message = TextMessage | AcceptedMessage;

export interface Inquiry {
  works: number[];
  type: string | null;
  budget: string | null;
  timeline: string | null;
  msg: string;
  date: string;
}

export type ThreadStatus =
  | 'Awaiting reply'
  | 'Quote received'
  | 'Accepted'
  | 'Deposit due'
  | 'In progress'
  // Incoming inquiries, seen by the artist:
  | 'New inquiry'
  | 'Replied'
  | 'Contract to send'
  | 'Awaiting signature';

export interface Thread {
  id: string;
  artistId: string;
  status: ThreadStatus;
  updated: string;
  unread: boolean;
  inq: Inquiry;
  msgs: Message[];
  contract?: { signed?: boolean; paid?: boolean };
  /**
   * Who started the conversation. "outgoing" (the default): you inquired with an
   * artist. "incoming": a patron inquired with your studio; `me` is the artist.
   */
  direction?: 'incoming' | 'outgoing';
  /** For incoming threads: the patron who wrote to you. */
  patron?: { name: string; hue: number };
}
