import type { DistrictId, BuildingType } from './districts'

export type NavMode = 'city' | 'district' | 'building' | 'interior'

export interface NavigationState {
  mode: NavMode
  districtId: DistrictId | null
  buildingId: string | null
  buildingName: string | null
  buildingType: BuildingType | null
  buildingDescription: string | null
}

export const INITIAL_NAV: NavigationState = {
  mode: 'city',
  districtId: null,
  buildingId: null,
  buildingName: null,
  buildingType: null,
  buildingDescription: null,
}

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  studio: 'Recording Studio',
  room: 'Listening Room',
  marketplace: 'Marketplace',
  apartment: 'Artist Residence',
  label: 'Label Office',
  club: 'Club / Lounge',
}

export const BUILDING_TYPE_ICONS: Record<BuildingType, string> = {
  studio: '🎙',
  room: '🎵',
  marketplace: '🛍',
  apartment: '🏠',
  label: '🏢',
  club: '🎪',
}
