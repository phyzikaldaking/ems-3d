// ─── Artist profiles ────────────────────────────────────────────────────────

export interface TrackEntry {
  title: string
  feat?: string
  plays: string
  bpm?: number
  key?: string
}

export interface ArtistProfile {
  id: string
  name: string
  genre: string
  districtId: string
  buildingId: string
  bio: string
  role: string
  followers: number
  monthlyListeners: number
  tracks: TrackEntry[]
  verified: boolean
}

export const ARTISTS: ArtistProfile[] = [
  {
    id: 'yxng-blvck',
    name: 'YXNG BLVCK',
    genre: 'Trap',
    districtId: 'trap-ave',
    buildingId: 'trap-young-loft',
    bio: 'Dark melodic trap from the south. Signed to Cartel Records. Known for layered 808s and introspective lyricism.',
    role: 'Artist · Cartel Records',
    followers: 24600,
    monthlyListeners: 148000,
    verified: true,
    tracks: [
      { title: 'No Fear', feat: 'prod. Metro', plays: '1.2M', bpm: 140, key: 'C# Min' },
      { title: 'Drip Season', plays: '842K', bpm: 130, key: 'G Min' },
      { title: 'Ice Cold', plays: '614K', bpm: 145, key: 'A Min' },
      { title: 'Stay Solid', plays: '391K', bpm: 128, key: 'F# Min' },
      { title: 'No Hook', plays: '287K', bpm: 138 },
    ],
  },
  {
    id: 'prod-8lack',
    name: 'prod. 8LACK',
    genre: 'Trap',
    districtId: 'trap-ave',
    buildingId: 'trap-ghost-flats',
    bio: 'In-house producer for Cartel Records. Signature sound: chopped samples over thunderous 808s. 6 platinum production credits.',
    role: 'Producer · Cartel Records',
    followers: 18300,
    monthlyListeners: 92000,
    verified: true,
    tracks: [
      { title: 'Dark Meditation (Instrumental)', plays: '720K', bpm: 140 },
      { title: 'Pressure Season (Instrumental)', plays: '503K', bpm: 88 },
      { title: 'Type Beat Vol. 3', plays: '292K', bpm: 155 },
    ],
  },
  {
    id: 'lila-voss',
    name: 'LILA VOSS',
    genre: 'R&B',
    districtId: 'rnb-blvd',
    buildingId: 'rnb-loft-a',
    bio: "Velvet vocals with a sharp pen. LILA VOSS is After Midnight's fastest-rising act. Neo-soul meets modern R&B.",
    role: 'Artist · After Midnight',
    followers: 31200,
    monthlyListeners: 210000,
    verified: true,
    tracks: [
      { title: 'Champagne Problems', plays: '2.1M', bpm: 85, key: 'Db Maj' },
      { title: 'Slow Burn', plays: '1.4M', bpm: 76, key: 'F Min' },
      { title: 'After Hours', plays: '887K', bpm: 91 },
      { title: 'Call Me', plays: '612K', bpm: 80 },
    ],
  },
  {
    id: 'saint-dollar',
    name: 'SAINT$',
    genre: 'R&B',
    districtId: 'rnb-blvd',
    buildingId: 'rnb-loft-b',
    bio: 'Trap-influenced R&B heavyweight. SAINT$ blends melodic hooks with raw street narrative. 3M streams this quarter.',
    role: 'Artist · After Midnight',
    followers: 16800,
    monthlyListeners: 98000,
    verified: false,
    tracks: [
      { title: 'Glass Ceiling', plays: '940K', bpm: 92, key: 'B Min' },
      { title: 'Midnight Run', plays: '611K', bpm: 88 },
      { title: 'Gold Chain', plays: '402K', bpm: 96 },
    ],
  },
  {
    id: 'shadow-67',
    name: 'SHADOW 67',
    genre: 'Drill',
    districtId: 'drill-district',
    buildingId: 'drill-crew-block',
    bio: "UK drill pioneer with a transatlantic fanbase. SHADOW 67 runs Sliding Hats HQ's most active roster slot.",
    role: 'Artist · Sliding Hats HQ',
    followers: 44100,
    monthlyListeners: 334000,
    verified: true,
    tracks: [
      { title: 'Cold Streets', plays: '3.8M', bpm: 140, key: 'D Min' },
      { title: 'No Moves', plays: '2.2M', bpm: 138 },
      { title: 'Steel City', plays: '1.1M', bpm: 142 },
      { title: 'Shadows & Hats', plays: '820K', bpm: 140 },
    ],
  },
  {
    id: 'mc-cipher',
    name: 'MC CIPHER',
    genre: 'Hip-Hop',
    districtId: 'hiphop-hwy',
    buildingId: 'hh-mc-palace',
    bio: "Battle-rap legend turned mainstream act. MC CIPHER's wordplay is EMS-certified legendary. Label Row HQ A-lister.",
    role: 'Artist · Label Row HQ',
    followers: 58700,
    monthlyListeners: 480000,
    verified: true,
    tracks: [
      { title: 'Cipher King', plays: '4.2M', bpm: 94, key: 'E Min' },
      { title: 'Bar For Bar', plays: '3.1M', bpm: 90 },
      { title: 'On Record', plays: '2.4M', bpm: 86 },
      { title: 'The Blueprint (pt. 3)', plays: '1.8M', bpm: 92 },
      { title: 'Old School, New Wave', plays: '920K', bpm: 88 },
    ],
  },
]

export function getArtistByBuilding(buildingId: string): ArtistProfile | undefined {
  return ARTISTS.find((a) => a.buildingId === buildingId)
}

// ─── Studio sessions per building ───────────────────────────────────────────

export interface StudioSession {
  roomId: string
  roomName: string
  artist: string | null
  engineerName: string | null
  status: 'recording' | 'mixing' | 'mastering' | 'available'
  bpm: number | null
  genre: string | null
  ratePerHour: number
}

export const STUDIO_SESSIONS: Record<string, StudioSession[]> = {
  'trap-studio-808': [
    { roomId: 'A', roomName: 'Suite A — 808 Den',        artist: 'YXNG BLVCK',   engineerName: 'J. Malone',    status: 'recording',  bpm: 140, genre: 'Trap',    ratePerHour: 120 },
    { roomId: 'B', roomName: 'Suite B — The Vault',       artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,     ratePerHour: 120 },
    { roomId: 'C', roomName: 'Suite C — Mixing Booth',    artist: 'prod. 8LACK',  engineerName: 'T. Rivers',    status: 'mixing',     bpm: 92,  genre: 'Trap',    ratePerHour: 95  },
    { roomId: 'D', roomName: 'Suite D — Mastering',       artist: 'DJ Cold',      engineerName: 'A. Westfield', status: 'mastering',  bpm: null, genre: null,     ratePerHour: 95  },
  ],
  'rnb-velvet-studio': [
    { roomId: 'A', roomName: 'Velvet A — Main Room',      artist: 'LILA VOSS',    engineerName: 'M. Davis',     status: 'recording',  bpm: 85,  genre: 'R&B',    ratePerHour: 150 },
    { roomId: 'B', roomName: 'Velvet B — Vocal Booth',    artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,    ratePerHour: 150 },
    { roomId: 'C', roomName: 'Velvet C — String Room',    artist: 'SAINT$',       engineerName: 'C. Moore',     status: 'mixing',     bpm: 88,  genre: 'R&B',    ratePerHour: 130 },
  ],
  'drill-steel-factory': [
    { roomId: 'A', roomName: 'Factory A — The Press',     artist: 'SHADOW 67',    engineerName: 'K. Stone',     status: 'recording',  bpm: 140, genre: 'Drill',  ratePerHour: 110 },
    { roomId: 'B', roomName: 'Factory B — Mix Room',      artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,    ratePerHour: 110 },
  ],
  'hh-boom-bap': [
    { roomId: 'A', roomName: 'Boom Bap A — Main Stage',   artist: 'MC CIPHER',    engineerName: 'S. Brown',     status: 'recording',  bpm: 94,  genre: 'Hip-Hop', ratePerHour: 135 },
    { roomId: 'B', roomName: 'Boom Bap B — Freestyle',    artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,     ratePerHour: 135 },
    { roomId: 'C', roomName: 'Boom Bap C — SP-1200',      artist: 'J. Digits',    engineerName: 'B. Monk',      status: 'mixing',     bpm: 90,  genre: 'Hip-Hop', ratePerHour: 110 },
  ],
  'pop-hit-factory': [
    { roomId: 'A', roomName: 'Hit Factory A — Platinum',  artist: 'NOVA',         engineerName: 'L. Harper',    status: 'recording',  bpm: 120, genre: 'Pop',     ratePerHour: 180 },
    { roomId: 'B', roomName: 'Hit Factory B — Hook Room', artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,     ratePerHour: 180 },
    { roomId: 'C', roomName: 'Hit Factory C — Vocal',     artist: 'ARIA SKYE',    engineerName: 'P. Holt',      status: 'mixing',     bpm: 128, genre: 'Pop',     ratePerHour: 160 },
  ],
  'afro-lagos-studio': [
    { roomId: 'A', roomName: 'Lagos A — The Bridge',      artist: 'AFRO KING',    engineerName: 'O. Adeyemi',   status: 'recording',  bpm: 104, genre: 'Afrobeats', ratePerHour: 125 },
    { roomId: 'B', roomName: 'Lagos B — Open',            artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,       ratePerHour: 125 },
  ],
  'drill-lab': [
    { roomId: 'A', roomName: 'Lab A — Session Room',      artist: 'BUNKER BOY',   engineerName: 'R. Flint',     status: 'recording',  bpm: 138, genre: 'Drill',   ratePerHour: 100 },
    { roomId: 'B', roomName: 'Lab B — Mix Suite',         artist: null,           engineerName: null,           status: 'available',  bpm: null, genre: null,     ratePerHour: 100 },
  ],
}

export function getStudioSessions(buildingId: string): StudioSession[] {
  return STUDIO_SESSIONS[buildingId] ?? STUDIO_SESSIONS['trap-studio-808']!
}

// ─── Marketplace listings per building ──────────────────────────────────────

export interface MarketplaceListing {
  id: string
  name: string
  producer: string
  type: 'Beat' | 'Stems' | 'Sample Pack' | 'Acapella' | 'Loop Kit'
  bpm: number | null
  key: string | null
  price: number
  premiumPrice: number
  exclusivePrice: number
  genre: string
  sold: boolean
  plays: number
  featured?: boolean
}

export const MARKETPLACE_LISTINGS: Record<string, MarketplaceListing[]> = {
  'trap-plug-market': [
    { id: 'TRP-001', name: 'Dark Meditation',    producer: 'prod. 8LACK',  type: 'Beat',        bpm: 140, key: 'C# Min', price: 29.99,  premiumPrice: 59.99,  exclusivePrice: 299,  genre: 'Trap',    sold: false, plays: 4820, featured: true },
    { id: 'TRP-002', name: 'Pressure Season',    producer: 'COLDKEV',      type: 'Stems',       bpm: 88,  key: 'F Min',  price: 49.99,  premiumPrice: 99.99,  exclusivePrice: 499,  genre: 'Trap',    sold: false, plays: 3110 },
    { id: 'TRP-003', name: 'Glass Throne',       producer: 'prod. 8LACK',  type: 'Beat',        bpm: 162, key: 'A Min',  price: 24.99,  premiumPrice: 49.99,  exclusivePrice: 249,  genre: 'Trap',    sold: true,  plays: 9820 },
    { id: 'TRP-004', name: 'Jungle Fever Kit',   producer: 'DRUMHAVEN',    type: 'Sample Pack', bpm: null, key: null,    price: 19.99,  premiumPrice: 39.99,  exclusivePrice: 149,  genre: 'Trap',    sold: false, plays: 2240 },
    { id: 'TRP-005', name: 'Ghost Protocol',     producer: 'prod. 8LACK',  type: 'Loop Kit',    bpm: 145, key: 'D Min',  price: 34.99,  premiumPrice: 69.99,  exclusivePrice: 349,  genre: 'Trap',    sold: false, plays: 1870 },
  ],
  'rnb-silk-market': [
    { id: 'RNB-001', name: 'Velvet Nights',       producer: 'SILKWAVE',     type: 'Beat',        bpm: 76,  key: 'Db Maj', price: 39.99,  premiumPrice: 79.99,  exclusivePrice: 399,  genre: 'R&B',     sold: false, plays: 3210, featured: true },
    { id: 'RNB-002', name: 'After Midnight Kit',  producer: 'M. Davis',     type: 'Sample Pack', bpm: null, key: null,    price: 24.99,  premiumPrice: 49.99,  exclusivePrice: 199,  genre: 'R&B',     sold: false, plays: 1850 },
    { id: 'RNB-003', name: 'Slow Burn (Stems)',   producer: 'SILKWAVE',     type: 'Stems',       bpm: 80,  key: 'F Min',  price: 59.99,  premiumPrice: 119.99, exclusivePrice: 599,  genre: 'R&B',     sold: false, plays: 2790 },
  ],
  'hh-main-market': [
    { id: 'HH-001',  name: 'Cipher King Beat',    producer: 'BOOMBOXX',     type: 'Beat',        bpm: 90,  key: 'E Min',  price: 34.99,  premiumPrice: 74.99,  exclusivePrice: 349,  genre: 'Hip-Hop', sold: false, plays: 6120, featured: true },
    { id: 'HH-002',  name: 'Vintage Breaks Vol.4',producer: 'CRATE DIG',    type: 'Sample Pack', bpm: null, key: null,    price: 29.99,  premiumPrice: 59.99,  exclusivePrice: 249,  genre: 'Hip-Hop', sold: false, plays: 4310 },
    { id: 'HH-003',  name: 'Boom Bap Blueprint',  producer: 'BOOMBOXX',     type: 'Stems',       bpm: 88,  key: 'D Min',  price: 49.99,  premiumPrice: 99.99,  exclusivePrice: 499,  genre: 'Hip-Hop', sold: false, plays: 3820 },
    { id: 'HH-004',  name: 'SP-1200 Drums',       producer: 'J. Digits',    type: 'Loop Kit',    bpm: null, key: null,    price: 22.99,  premiumPrice: 44.99,  exclusivePrice: 179,  genre: 'Hip-Hop', sold: true,  plays: 7100 },
  ],
  'hh-sample-shop': [
    { id: 'SMP-001', name: 'Soul Chops Vol. 6',   producer: 'CRATE DIG',    type: 'Sample Pack', bpm: null, key: null,    price: 24.99,  premiumPrice: 49.99,  exclusivePrice: 199,  genre: 'Hip-Hop', sold: false, plays: 2810 },
    { id: 'SMP-002', name: 'Rare Breaks 1995',    producer: 'J. Digits',    type: 'Loop Kit',    bpm: null, key: null,    price: 19.99,  premiumPrice: 39.99,  exclusivePrice: 149,  genre: 'Hip-Hop', sold: false, plays: 1640 },
  ],
  'pop-shop': [
    { id: 'POP-001', name: 'Glass Skies Hook',    producer: 'L. Harper',    type: 'Beat',        bpm: 120, key: 'C Maj',  price: 44.99,  premiumPrice: 89.99,  exclusivePrice: 449,  genre: 'Pop',     sold: false, plays: 5340, featured: true },
    { id: 'POP-002', name: 'Radio Ready Pack',    producer: 'P. Holt',      type: 'Sample Pack', bpm: null, key: null,    price: 34.99,  premiumPrice: 69.99,  exclusivePrice: 299,  genre: 'Pop',     sold: false, plays: 3120 },
  ],
  'afro-market': [
    { id: 'AFR-001', name: 'Lagos Riddim',        producer: 'O. Adeyemi',   type: 'Beat',        bpm: 104, key: 'G Maj',  price: 39.99,  premiumPrice: 79.99,  exclusivePrice: 399,  genre: 'Afrobeats', sold: false, plays: 4210, featured: true },
    { id: 'AFR-002', name: 'Amapiano Toolkit',    producer: 'AMAPIANO BOSS',type: 'Loop Kit',    bpm: 116, key: 'A Maj',  price: 29.99,  premiumPrice: 59.99,  exclusivePrice: 299,  genre: 'Amapiano',  sold: false, plays: 3780 },
  ],
  'drill-arsenal': [
    { id: 'DRL-001', name: 'Steel Drums Vol. 2',  producer: 'K. Stone',     type: 'Loop Kit',    bpm: 140, key: 'D Min',  price: 27.99,  premiumPrice: 54.99,  exclusivePrice: 279,  genre: 'Drill',   sold: false, plays: 3440, featured: true },
    { id: 'DRL-002', name: 'Bunker Sessions Kit', producer: 'SHADOW 67',    type: 'Sample Pack', bpm: null, key: null,    price: 22.99,  premiumPrice: 44.99,  exclusivePrice: 219,  genre: 'Drill',   sold: false, plays: 2190 },
  ],
}

export function getMarketplaceListings(buildingId: string): MarketplaceListing[] {
  return MARKETPLACE_LISTINGS[buildingId] ?? MARKETPLACE_LISTINGS['trap-plug-market']!
}

// ─── Label rosters per building ─────────────────────────────────────────────

export interface RosterArtist {
  name: string
  tier: 'New Signing' | 'Rising' | 'Platinum'
  genre: string
  streams: string
  dealType: 'Single Deal' | 'EP Deal' | 'Album Deal' | 'Distribution'
}

export const LABEL_ROSTERS: Record<string, { description: string; artists: RosterArtist[] }> = {
  'trap-cartel-label': {
    description: "The label running Trap Ave. 8 platinum records and 3 #1 mixtapes. Signing artists across every tier — from newcomers to certified acts.",
    artists: [
      { name: 'YXNG BLVCK',  tier: 'Platinum',    genre: 'Trap', streams: '12M',  dealType: 'Album Deal' },
      { name: 'prod. 8LACK', tier: 'Platinum',    genre: 'Trap', streams: '8.4M', dealType: 'Distribution' },
      { name: 'ICE BABY',    tier: 'Rising',      genre: 'Trap', streams: '2.1M', dealType: 'EP Deal' },
      { name: 'GHOST UNIT',  tier: 'Rising',      genre: 'Trap', streams: '980K', dealType: 'Single Deal' },
      { name: 'TRAPKID X',   tier: 'New Signing', genre: 'Trap', streams: '140K', dealType: 'Single Deal' },
    ],
  },
  'rnb-midnight-label': {
    description: "Premier R&B powerhouse. After Midnight has produced 15 Top-40 hits this year alone and is actively building the next generation of R&B stars.",
    artists: [
      { name: 'LILA VOSS',    tier: 'Platinum',    genre: 'R&B',      streams: '18M',  dealType: 'Album Deal' },
      { name: 'SAINT$',       tier: 'Rising',      genre: 'R&B',      streams: '3.2M', dealType: 'EP Deal' },
      { name: 'REMI BLUE',    tier: 'Rising',      genre: 'Neo-Soul', streams: '1.8M', dealType: 'EP Deal' },
      { name: 'VELVET JONES', tier: 'New Signing', genre: 'R&B',      streams: '280K', dealType: 'Single Deal' },
    ],
  },
  'hh-label-row': {
    description: "Label Row HQ is the most powerful label in EMS. Corner office on the 20th floor. If your music is ready, this is the room where deals get done.",
    artists: [
      { name: 'MC CIPHER',   tier: 'Platinum',    genre: 'Hip-Hop', streams: '42M',  dealType: 'Album Deal' },
      { name: 'J. DIGITS',   tier: 'Platinum',    genre: 'Hip-Hop', streams: '22M',  dealType: 'Distribution' },
      { name: 'FLEX MONTY',  tier: 'Rising',      genre: 'Hip-Hop', streams: '4.1M', dealType: 'EP Deal' },
      { name: 'WORD SMITH',  tier: 'Rising',      genre: 'Hip-Hop', streams: '2.4M', dealType: 'Single Deal' },
      { name: 'LYRIC LANE',  tier: 'New Signing', genre: 'Hip-Hop', streams: '380K', dealType: 'Single Deal' },
      { name: 'QUEEN BARS',  tier: 'New Signing', genre: 'Hip-Hop', streams: '190K', dealType: 'Single Deal' },
    ],
  },
  'pop-radio-tower': {
    description: "Radio Tower is Pop Plaza's distribution and label HQ. 9 artists broken into mainstream this year. Hook-driven, format-focused, commercially relentless.",
    artists: [
      { name: 'NOVA',        tier: 'Platinum', genre: 'Pop', streams: '38M',  dealType: 'Album Deal' },
      { name: 'ARIA SKYE',   tier: 'Rising',   genre: 'Pop', streams: '6.3M', dealType: 'EP Deal' },
      { name: 'ECHO SOUND',  tier: 'Rising',   genre: 'Pop', streams: '3.9M', dealType: 'Single Deal' },
    ],
  },
  'afro-naija-label': {
    description: "Naija Records is the EMS home for Afrobeats, Amapiano, and Afropop. We bridge Lagos, London, and LA. Our roster is global by design.",
    artists: [
      { name: 'AFRO KING',      tier: 'Platinum',    genre: 'Afrobeats', streams: '31M',  dealType: 'Album Deal' },
      { name: 'AMAPIANO BOSS',  tier: 'Rising',      genre: 'Amapiano',  streams: '5.2M', dealType: 'EP Deal' },
      { name: 'DIASPORA GIRL',  tier: 'New Signing', genre: 'Afropop',   streams: '420K', dealType: 'Single Deal' },
    ],
  },
  'drill-sliding-hats-hq': {
    description: "Sliding Hats HQ controls the Drill District. Our production standards are unmatched. If it's not drill, it's not signed here.",
    artists: [
      { name: 'SHADOW 67',   tier: 'Platinum',    genre: 'Drill', streams: '28M',  dealType: 'Album Deal' },
      { name: 'STEEL BLADE', tier: 'Rising',      genre: 'Drill', streams: '3.8M', dealType: 'EP Deal' },
      { name: 'BUNKER BOY',  tier: 'Rising',      genre: 'Drill', streams: '1.4M', dealType: 'Single Deal' },
      { name: 'COLD CHROME', tier: 'New Signing', genre: 'Drill', streams: '220K', dealType: 'Single Deal' },
    ],
  },
}

export function getLabelRoster(buildingId: string) {
  return LABEL_ROSTERS[buildingId] ?? LABEL_ROSTERS['hh-label-row']!
}

// ─── Club events per building ────────────────────────────────────────────────

export interface ClubEvent {
  id: string
  name: string
  time: string
  date: string
  status: 'live' | 'upcoming' | 'sold-out'
  capacity: number
  attending: number
  type: 'Battle' | 'Showcase' | 'Listening Party' | 'Late Night Session'
  host: string
}

export const CLUB_EVENTS: Record<string, ClubEvent[]> = {
  'trap-block-club': [
    { id: 'TRP-EV1', name: 'Late Night Trap Session',  time: 'Tonight · 11 PM', date: 'Apr 21', status: 'live',     capacity: 80,  attending: 72, type: 'Late Night Session', host: 'DJ COLD' },
    { id: 'TRP-EV2', name: 'Beat Battle Vol. 9',       time: 'Fri · 9 PM',      date: 'Apr 25', status: 'upcoming', capacity: 100, attending: 48, type: 'Battle',             host: 'MC CIPHER' },
    { id: 'TRP-EV3', name: 'Trap Showcase: Spring',    time: 'Sat · 8 PM',      date: 'Apr 26', status: 'upcoming', capacity: 120, attending: 83, type: 'Showcase',           host: 'Cartel Records' },
  ],
  'rnb-fanclub': [
    { id: 'RNB-EV1', name: 'Slow Jam Night',           time: 'Tonight · 10 PM', date: 'Apr 21', status: 'live',     capacity: 60,  attending: 54, type: 'Late Night Session', host: 'LILA VOSS' },
    { id: 'RNB-EV2', name: 'R&B Artist Showcase Q2',  time: 'Thu · 8 PM',      date: 'Apr 24', status: 'upcoming', capacity: 80,  attending: 42, type: 'Showcase',           host: 'After Midnight' },
  ],
  'hh-grind-club': [
    { id: 'HH-EV1',  name: 'Cipher Night',             time: 'Tonight · 9 PM',  date: 'Apr 21', status: 'live',     capacity: 100, attending: 88, type: 'Battle',             host: 'MC CIPHER' },
    { id: 'HH-EV2',  name: 'Producer Showcase Vol.12', time: 'Sat · 7 PM',      date: 'Apr 26', status: 'upcoming', capacity: 120, attending: 97, type: 'Showcase',           host: 'BOOMBOXX' },
    { id: 'HH-EV3',  name: 'Old School vs. New Wave',  time: 'Sun · 6 PM',      date: 'Apr 27', status: 'upcoming', capacity: 150, attending: 63, type: 'Listening Party',    host: 'Label Row HQ' },
  ],
  'pop-fanclub-hq': [
    { id: 'POP-EV1', name: 'NOVA Album Listening Party', time: 'Tonight · 8 PM', date: 'Apr 21', status: 'sold-out', capacity: 80,  attending: 80, type: 'Listening Party', host: 'Radio Tower' },
    { id: 'POP-EV2', name: 'Pop Showcase: Radio Picks',  time: 'Fri · 7 PM',    date: 'Apr 25', status: 'upcoming', capacity: 100, attending: 71, type: 'Showcase',        host: 'ARIA SKYE' },
  ],
  'afro-sound-bar': [
    { id: 'AFR-EV1', name: 'Amapiano Sundown Session',  time: 'Tonight · 8 PM', date: 'Apr 21', status: 'live',     capacity: 90,  attending: 67, type: 'Late Night Session', host: 'AMAPIANO BOSS' },
    { id: 'AFR-EV2', name: 'Naija Showcase April',      time: 'Sat · 6 PM',     date: 'Apr 26', status: 'upcoming', capacity: 120, attending: 44, type: 'Showcase',           host: 'Naija Records' },
  ],
  'drill-bunker': [
    { id: 'DRL-EV1', name: 'No Cap — Bunker Sessions',  time: 'Tonight · 11 PM', date: 'Apr 21', status: 'live',    capacity: 50,  attending: 48, type: 'Late Night Session', host: 'SHADOW 67' },
    { id: 'DRL-EV2', name: 'Drill Battle IV',            time: 'Fri · 10 PM',    date: 'Apr 25', status: 'upcoming', capacity: 70, attending: 29, type: 'Battle',             host: 'Sliding Hats HQ' },
  ],
}

export function getClubEvents(buildingId: string): ClubEvent[] {
  return CLUB_EVENTS[buildingId] ?? CLUB_EVENTS['hh-grind-club']!
}

// ─── Listening room "now playing" per building ──────────────────────────────

export interface NowPlaying {
  title: string
  artist: string
  bpm: number
  key: string
  listeners: number
}

export const ROOM_NOW_PLAYING: Record<string, NowPlaying> = {
  'trap-ice-room':    { title: 'No Fear (prod. Metro)',  artist: 'YXNG BLVCK',    bpm: 140, key: 'C# Min', listeners: 14 },
  'rnb-rooftop':      { title: 'Champagne Problems',     artist: 'LILA VOSS',     bpm: 85,  key: 'Db Maj', listeners: 22 },
  'drill-bunker':     { title: 'Cold Streets',           artist: 'SHADOW 67',     bpm: 140, key: 'D Min',  listeners: 18 },
  'hh-cipher':        { title: 'Bar For Bar',            artist: 'MC CIPHER',     bpm: 90,  key: 'E Min',  listeners: 31 },
  'pop-the-stage':    { title: 'Glass Skies',            artist: 'NOVA',          bpm: 120, key: 'C Maj',  listeners: 55 },
  'afro-garden-room': { title: 'Amapiano Sundown',       artist: 'AMAPIANO BOSS', bpm: 104, key: 'G Maj',  listeners: 29 },
}

export function getRoomNowPlaying(buildingId: string): NowPlaying {
  return ROOM_NOW_PLAYING[buildingId] ?? ROOM_NOW_PLAYING['trap-ice-room']!
}
