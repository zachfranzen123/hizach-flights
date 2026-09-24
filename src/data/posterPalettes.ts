import type { PosterPalette } from '../components/FlightPoster'

export const palettes: PosterPalette[] = [
  {
    name: 'Aviation blue', background: '#164b91', foreground: '#fffdf5', muted: '#d9e5f4',
    decoration: { flowerPrimary: '#e95d4f', flowerSecondary: '#fff0c2', flowerCenter: '#e4b536', foliage: '#173f35', leafVein: '#7fa98a', bridge: '#f2b7a5', fog: '#d9e5f4' },
  },
  {
    name: 'Ochre', background: '#d9a126', foreground: '#17140c', muted: '#514319',
    decoration: { flowerPrimary: '#a9342b', flowerSecondary: '#fff1c2', flowerCenter: '#6a3a24', foliage: '#244c3e', leafVein: '#a9c09a', bridge: '#7b2e29', fog: '#fff1c2' },
  },
  {
    name: 'Signal red', background: '#bf3e32', foreground: '#fffaf1', muted: '#f4d7ce',
    decoration: { flowerPrimary: '#fff0c2', flowerSecondary: '#f6c64f', flowerCenter: '#5b3327', foliage: '#20483d', leafVein: '#9bc093', bridge: '#ffd7bd', fog: '#f4d7ce' },
  },
  {
    name: 'Forest', background: '#35664e', foreground: '#fffdf5', muted: '#d7e8dc',
    decoration: { flowerPrimary: '#ed6a58', flowerSecondary: '#fff0c2', flowerCenter: '#e2b63f', foliage: '#a8ca8b', leafVein: '#315a47', bridge: '#f4b89f', fog: '#d7e8dc' },
  },
]

export type PaletteFlightIdentity = {
  airlineIata: string
  flightNumber: string
  start: string
  origin: string
  destination: string
}

export function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function automaticPaletteIndex(flight: PaletteFlightIdentity, paletteCount = palettes.length): number {
  if (paletteCount <= 1 || flight.destination === 'SFO') return 0
  return stableHash(flightPresentationKey(flight)) % paletteCount
}

export function automaticOverlayVariant(flight: PaletteFlightIdentity, variantCount = 3): number {
  if (variantCount <= 1) return 0
  return stableHash(`${flightPresentationKey(flight)}|overlay`) % variantCount
}

function flightPresentationKey(flight: PaletteFlightIdentity): string {
  return `${flight.airlineIata}${flight.flightNumber}|${flight.start}|${flight.origin}|${flight.destination}`
}
