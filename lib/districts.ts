export type BuildingType = 'studio' | 'room' | 'marketplace' | 'apartment' | 'label' | 'club'

export interface BuildingDef {
  id: string
  type: BuildingType
  name: string
  description: string
  floors: number
  isLandmark?: boolean
}

export type DistrictId =
  | 'trap-ave'
  | 'rnb-blvd'
  | 'drill-district'
  | 'hiphop-hwy'
  | 'pop-plaza'
  | 'afro-alley'

export interface District {
  id: DistrictId
  name: string
  tagline: string
  genre: string
  color: string
  grid: [number, number]
  buildings: BuildingDef[]
}

export const DISTRICTS: District[] = [
  {
    id: 'trap-ave',
    name: 'Trap Ave',
    tagline: '808s, adlibs, and ice.',
    genre: 'Trap',
    color: '#B026FF',
    grid: [0, 0],
    buildings: [
      { id: 'trap-studio-808', type: 'studio', name: 'Studio 808', description: 'Where the 808s are born. Premier trap recording and mixing suites.', floors: 14, isLandmark: true },
      { id: 'trap-cartel-label', type: 'label', name: 'Cartel Records', description: 'The label running Trap Ave. Roster of 12 active artists.', floors: 11, isLandmark: true },
      { id: 'trap-ice-room', type: 'room', name: 'The Ice Room', description: 'Subzero listening sessions. Cold music only.', floors: 6 },
      { id: 'trap-plug-market', type: 'marketplace', name: "Plug's Market", description: 'Exclusive heat. Beats, stems, and trap sample packs.', floors: 5 },
      { id: 'trap-block-club', type: 'club', name: 'The Block', description: 'Street-level lounge. Listening parties every night.', floors: 7 },
      { id: 'trap-young-loft', type: 'apartment', name: 'Young Money Loft', description: 'Artist residence and private studio access.', floors: 10 },
      { id: 'trap-ghost-flats', type: 'apartment', name: 'Ghost Flats', description: 'Artist residence.', floors: 8 },
      { id: 'trap-crew-quarters', type: 'apartment', name: 'Crew Quarters', description: 'Artist residence.', floors: 5 },
    ],
  },
  {
    id: 'rnb-blvd',
    name: 'R&B Blvd',
    tagline: 'Slow jams. Rooftop lounges. Grown folks only.',
    genre: 'R&B',
    color: '#FF3D8A',
    grid: [1, 0],
    buildings: [
      { id: 'rnb-velvet-studio', type: 'studio', name: 'Velvet Studios', description: 'World-class R&B production. Soundproof soul in every room.', floors: 15, isLandmark: true },
      { id: 'rnb-midnight-label', type: 'label', name: 'After Midnight', description: 'Premier R&B label. Slow it down, turn it up.', floors: 18, isLandmark: true },
      { id: 'rnb-rooftop', type: 'room', name: 'The Rooftop Lounge', description: 'Curated listening sessions above the skyline.', floors: 8 },
      { id: 'rnb-silk-market', type: 'marketplace', name: 'Silk Market', description: 'Premium stems, vocal chops, and R&B production packs.', floors: 5 },
      { id: 'rnb-fanclub', type: 'club', name: 'Fan Club', description: 'Membership-only listening and artist meet & greets.', floors: 6 },
      { id: 'rnb-loft-a', type: 'apartment', name: 'Artist Loft A', description: 'Artist residence.', floors: 12 },
      { id: 'rnb-loft-b', type: 'apartment', name: 'Artist Loft B', description: 'Artist residence.', floors: 9 },
    ],
  },
  {
    id: 'drill-district',
    name: 'Drill District',
    tagline: 'Steel, shadows, sliding hats.',
    genre: 'Drill',
    color: '#2EE6D6',
    grid: [2, 0],
    buildings: [
      { id: 'drill-steel-factory', type: 'studio', name: 'Steel Factory', description: 'Industrial-grade drill production. Sliding hats mandatory.', floors: 14, isLandmark: true },
      { id: 'drill-sliding-hats-hq', type: 'label', name: 'Sliding Hats HQ', description: 'The label controlling Drill District.', floors: 12, isLandmark: true },
      { id: 'drill-bunker', type: 'room', name: 'The Bunker', description: 'Underground listening sessions. No cap. No sunlight.', floors: 4 },
      { id: 'drill-arsenal', type: 'marketplace', name: 'The Arsenal', description: 'Drill beats, stems, and sample kits.', floors: 6 },
      { id: 'drill-lab', type: 'studio', name: 'The Drill Lab', description: 'Secondary production suite for session producers.', floors: 9 },
      { id: 'drill-crew-block', type: 'apartment', name: 'Crew Block', description: 'Artist residence.', floors: 10 },
      { id: 'drill-shadow-flats', type: 'apartment', name: 'Shadow Flats', description: 'Artist residence.', floors: 8 },
      { id: 'drill-corner', type: 'marketplace', name: 'Corner Store', description: 'Quick loops and one-shots.', floors: 3 },
      { id: 'drill-hood-apts', type: 'apartment', name: 'Hood Apts', description: 'Artist residence.', floors: 6 },
    ],
  },
  {
    id: 'hiphop-hwy',
    name: 'Hip-Hop Highway',
    tagline: 'Boom bap to now. The main drag.',
    genre: 'Hip-Hop',
    color: '#FFB800',
    grid: [0, 1],
    buildings: [
      { id: 'hh-boom-bap', type: 'studio', name: 'Boom Bap Studio', description: 'Classic hip-hop production. SP-1200 in every room.', floors: 16, isLandmark: true },
      { id: 'hh-label-row', type: 'label', name: 'Label Row HQ', description: 'The most powerful label in EMS. Corner office on the top floor.', floors: 20, isLandmark: true },
      { id: 'hh-cipher', type: 'room', name: 'The Cipher', description: 'Group listening, freestyles, and listening parties. Open to all.', floors: 10 },
      { id: 'hh-main-market', type: 'marketplace', name: 'Main Street Market', description: 'The biggest beat marketplace in the city.', floors: 7 },
      { id: 'hh-grind-club', type: 'club', name: 'The Grind', description: 'Late-night sessions and listening parties.', floors: 8 },
      { id: 'hh-sample-shop', type: 'marketplace', name: 'Sample Shop', description: 'Vintage breaks and rare sample packs.', floors: 5 },
      { id: 'hh-producer-loft', type: 'apartment', name: 'Producer Loft', description: 'Artist residence.', floors: 13 },
      { id: 'hh-mc-palace', type: 'apartment', name: "MC's Palace", description: 'Artist residence.', floors: 11 },
      { id: 'hh-old-school', type: 'apartment', name: 'Old School Apts', description: 'Artist residence.', floors: 7 },
      { id: 'hh-the-crib', type: 'apartment', name: 'The Crib', description: 'Artist residence.', floors: 6 },
    ],
  },
  {
    id: 'pop-plaza',
    name: 'Pop Plaza',
    tagline: 'Hooks that will not leave your head.',
    genre: 'Pop',
    color: '#FF6B35',
    grid: [1, 1],
    buildings: [
      { id: 'pop-hit-factory', type: 'studio', name: 'Hit Factory', description: 'Where pop history is made. 18 platinum-certified suites.', floors: 18, isLandmark: true },
      { id: 'pop-the-stage', type: 'room', name: 'The Stage', description: 'Live showcase room with 500-fan capacity. Fans always welcome.', floors: 12, isLandmark: true },
      { id: 'pop-fanclub-hq', type: 'club', name: 'Fan Club HQ', description: 'Membership portal, exclusive drops, and fan experiences.', floors: 15, isLandmark: true },
      { id: 'pop-shop', type: 'marketplace', name: 'Pop Shop', description: 'Hooks, toplines, and pop production packs.', floors: 8 },
      { id: 'pop-radio-tower', type: 'label', name: 'Radio Tower', description: 'Pop label and distribution HQ.', floors: 13 },
      { id: 'pop-star-tower', type: 'apartment', name: 'Star Tower', description: 'Premium artist penthouse suites.', floors: 20 },
      { id: 'pop-glass-loft', type: 'apartment', name: 'Glass Loft', description: 'Artist residence.', floors: 10 },
      { id: 'pop-top-charts', type: 'marketplace', name: 'Top Charts Market', description: 'Trending beats and licensed toplines.', floors: 6 },
    ],
  },
  {
    id: 'afro-alley',
    name: 'Afrobeats Alley',
    tagline: 'Lagos → London → LA.',
    genre: 'Afrobeats',
    color: '#3DFF74',
    grid: [2, 1],
    buildings: [
      { id: 'afro-lagos-studio', type: 'studio', name: 'Lagos Studios', description: 'The bridge between Lagos, London, and LA. Full Afrobeats production.', floors: 14, isLandmark: true },
      { id: 'afro-naija-label', type: 'label', name: 'Naija Records', description: 'Premier Afrobeats and Amapiano label in EMS.', floors: 16, isLandmark: true },
      { id: 'afro-garden-room', type: 'room', name: 'The Garden Room', description: 'Open-air listening sessions. Afrobeats in full bloom.', floors: 9 },
      { id: 'afro-market', type: 'marketplace', name: 'Afro Market', description: 'Afrobeats, Amapiano, and Afropop production packs.', floors: 7 },
      { id: 'afro-sound-bar', type: 'club', name: 'The Sound Bar', description: 'Afrobeats lounge and live listening events. 7 nights a week.', floors: 10 },
      { id: 'afro-diaspora', type: 'apartment', name: 'Diaspora Flats', description: 'Artist residence.', floors: 12 },
      { id: 'afro-lagos-loft', type: 'apartment', name: 'Lagos Loft', description: 'Artist residence.', floors: 8 },
    ],
  },
]

export const CITY = {
  TILE_SIZE: 60,
  TILE_GAP: 6,
  GRID_COLS: 3,
  GRID_ROWS: 2,
} as const

export function districtCenter(district: District): { x: number; z: number } {
  const index = Math.max(0, DISTRICTS.findIndex((entry) => entry.id === district.id))
  const angle = -Math.PI / 2 + (index / DISTRICTS.length) * Math.PI * 2
  const radius = 86

  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
  }
}
