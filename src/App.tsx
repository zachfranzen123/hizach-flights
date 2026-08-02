import { useEffect, useState } from 'react'
import { DisplayDialog } from './components/DisplayDialog'
import type { PosterPalette } from './components/FlightPoster'
import { ProjectJournal } from './components/ProjectJournal'
import { sampleFlight } from './data/sampleFlight'

const previewFlights = {
  hawaii: {
    ...sampleFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '877',
    origin: 'SFO', originCity: 'San Francisco', destination: 'HNL', destinationCity: 'Honolulu',
    departureDate: '12 AUG 2026', departureTime: '09:15 PDT', arrivalTime: '11:42 HST',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738',
  },
  sfo: {
    ...sampleFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '655',
    origin: 'SEA', originCity: 'Seattle', destination: 'SFO', destinationCity: 'San Francisco',
    departureDate: '01 AUG 2026', departureTime: '10:47 UTC', arrivalTime: '14:02 PDT',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738',
  },
  'sfo-lax': {
    ...sampleFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '341',
    origin: 'LAX', originCity: 'Los Angeles', destination: 'SFO', destinationCity: 'San Francisco',
    departureDate: '07 AUG 2026', departureTime: '16:20 PDT', arrivalTime: '17:52 PDT',
    aircraftName: 'Embraer E175', aircraftCode: 'E75L',
  },
  'sfo-hnl': {
    ...sampleFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '876',
    origin: 'HNL', originCity: 'Honolulu', destination: 'SFO', destinationCity: 'San Francisco',
    departureDate: '14 AUG 2026', departureTime: '13:15 HST', arrivalTime: '21:32 PDT',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738',
  },
  'sfo-jfk': {
    ...sampleFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '20',
    origin: 'JFK', originCity: 'New York', destination: 'SFO', destinationCity: 'San Francisco',
    departureDate: '22 AUG 2026', departureTime: '09:30 EDT', arrivalTime: '12:58 PDT',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738',
  },
} satisfies Record<string, typeof sampleFlight>

const palettes: PosterPalette[] = [
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

function App() {
  const previewParams = new URLSearchParams(window.location.search)
  const previewKey = previewParams.get('preview') ?? ''
  const previewVariant = Number.parseInt(previewParams.get('variant') ?? '', 10)
  const requestedPalette = Number.parseInt(previewParams.get('palette') ?? '', 10)
  const paletteIndex = Number.isInteger(requestedPalette) && requestedPalette >= 0 && requestedPalette < palettes.length
    ? requestedPalette
    : 0
  const [displayOpen, setDisplayOpen] = useState(false)
  const palette = palettes[paletteIndex]
  const previewFlight = previewFlights[previewKey as keyof typeof previewFlights]
  const posterFlight = previewFlight && Number.isFinite(previewVariant)
    ? { ...previewFlight, overlayVariant: previewVariant }
    : previewFlight ?? sampleFlight

  useEffect(() => {
    if (!displayOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDisplayOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [displayOpen])

  return (
    <>
      <ProjectJournal onOpenDisplay={() => setDisplayOpen(true)} posterFlight={posterFlight} palette={palette} />
      <DisplayDialog
        open={displayOpen}
        onClose={() => setDisplayOpen(false)}
        flight={posterFlight}
        palette={palette}
      />
    </>
  )
}

export default App
