export type HubViewMode = "top" | "all"

export interface RegionMapPreset {
  center: [number, number]
  zoom: number
}

export const DEFAULT_MAP_POSITION: RegionMapPreset = {
  center: [0, 20],
  zoom: 1,
}

export const REGION_MAP_PRESETS: Record<string, RegionMapPreset> = {
  "East Asia": {
    center: [121, 30],
    zoom: 3.2,
  },
  "Southeast Asia": {
    center: [106, 8],
    zoom: 3.6,
  },
  Europe: {
    center: [12, 51],
    zoom: 3.5,
  },
  "North America": {
    center: [-98, 38],
    zoom: 2.7,
  },
  "Middle East": {
    center: [50, 27],
    zoom: 4,
  },
  "South Asia": {
    center: [78, 21],
    zoom: 4.1,
  },
  "South America": {
    center: [-60, -19],
    zoom: 2.8,
  },
  Oceania: {
    center: [145, -26],
    zoom: 3,
  },
  Africa: {
    center: [24, -2],
    zoom: 2.8,
  },
  Global: DEFAULT_MAP_POSITION,
}
