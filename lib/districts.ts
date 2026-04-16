// Epic MusicSpace — the 6 genre districts that make up the city.
// Colors are tuned to read at-a-glance from the ArcRotate bird's-eye view.

export type DistrictId =
  | 'trap-ave'
  | 'rnb-blvd'
  | 'drill-district'
  | 'hiphop-hwy'
  | 'pop-plaza'
  | 'afro-alley';

export interface District {
  id: DistrictId;
  name: string;
  tagline: string;
  genre: string;
  /** Hex color, used for ground plane + building accents */
  color: string;
  /** Grid slot (col, row) in the 3x2 city layout */
  grid: [number, number];
  /** How many placeholder buildings to render in this zone */
  buildings: number;
}

export const DISTRICTS: District[] = [
  {
    id: 'trap-ave',
    name: 'Trap Ave',
    tagline: '808s, adlibs, and ice.',
    genre: 'Trap',
    color: '#B026FF', // neon purple
    grid: [0, 0],
    buildings: 8,
  },
  {
    id: 'rnb-blvd',
    name: 'R&B Blvd',
    tagline: 'Slow jams. Rooftop lounges. Grown folks only.',
    genre: 'R&B',
    color: '#FF3D8A', // magenta
    grid: [1, 0],
    buildings: 7,
  },
  {
    id: 'drill-district',
    name: 'Drill District',
    tagline: 'Steel, shadows, sliding hats.',
    genre: 'Drill',
    color: '#2EE6D6', // cyan
    grid: [2, 0],
    buildings: 9,
  },
  {
    id: 'hiphop-hwy',
    name: 'Hip-Hop Highway',
    tagline: 'Boom bap to now. The main drag.',
    genre: 'Hip-Hop',
    color: '#FFB800', // gold
    grid: [0, 1],
    buildings: 10,
  },
  {
    id: 'pop-plaza',
    name: 'Pop Plaza',
    tagline: 'Hooks that will not leave your head.',
    genre: 'Pop',
    color: '#FF6B35', // neon orange
    grid: [1, 1],
    buildings: 8,
  },
  {
    id: 'afro-alley',
    name: 'Afrobeats Alley',
    tagline: 'Lagos → London → LA.',
    genre: 'Afrobeats',
    color: '#3DFF74', // neon green
    grid: [2, 1],
    buildings: 7,
  },
];

/** City layout constants. Each district is a square tile in a 3x2 grid. */
export const CITY = {
  TILE_SIZE: 60,       // district plane size in world units
  TILE_GAP: 6,         // street gap between districts
  GRID_COLS: 3,
  GRID_ROWS: 2,
} as const;

/** Returns the world-space center (x, z) of a district tile. */
export function districtCenter(district: District): { x: number; z: number } {
  const { TILE_SIZE, TILE_GAP, GRID_COLS, GRID_ROWS } = CITY;
  const stride = TILE_SIZE + TILE_GAP;
  const totalW = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_GAP;
  const totalH = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_GAP;
  const originX = -totalW / 2 + TILE_SIZE / 2;
  const originZ = -totalH / 2 + TILE_SIZE / 2;
  return {
    x: originX + district.grid[0] * stride,
    z: originZ + district.grid[1] * stride,
  };
}
