import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { KeyRound, LoaderCircle, RefreshCw, X } from 'lucide-react'
import type { Flight } from '../data/sampleFlight'
import { automaticPaletteIndex, palettes } from '../data/posterPalettes'
import { FlightPoster, type PosterPalette } from './FlightPoster'

type DisplayDialogProps = {
  open: boolean
  onClose: () => void
  flight: Flight
  palette: PosterPalette
}

export type LiveFlight = {
    airlineIata: string
    airlineIcao: string
    airlineName: string
    destination: string
    end: string
    equipment: null | {
      code: string
      name: string
    }
    equipmentSource: 'manual-override' | 'flightaware-assigned' | 'flightaware-typical' | 'not-yet-available'
    equipmentEvidence: null | {
      matchingCount: number
      totalCount: number
    }
    flightNumber: string
    origin: string
    overlayVariant: number
    paletteIndex: number
    start: string
    tailUrl: string
}

type CurrentPhoto = {
  id: string
  name: string
  updatedAt: string
}

type CurrentFrameResponse =
  | { kind: 'unconfirmed'; fetchedAt: null }
  | { kind: 'empty'; fetchedAt: string }
  | { kind: 'photo'; photo: CurrentPhoto; fetchedAt: string }
  | { kind: 'flight'; flight: LiveFlight; paletteIndex: number; overlayVariant: number; fetchedAt: string }

type DisplayPhase = 'loading' | 'locked' | 'ready' | 'unconfirmed' | 'empty' | 'error'

const airportDetails: Record<string, { city: string; timeZone: string }> = {
  ANC: { city: 'Anchorage', timeZone: 'America/Anchorage' },
  BOI: { city: 'Boise', timeZone: 'America/Boise' },
  BOS: { city: 'Boston', timeZone: 'America/New_York' },
  BIO: { city: 'Bilbao', timeZone: 'Europe/Madrid' },
  BCN: { city: 'Barcelona', timeZone: 'Europe/Madrid' },
  BUR: { city: 'Burbank', timeZone: 'America/Los_Angeles' },
  DCA: { city: 'Washington', timeZone: 'America/New_York' },
  DEN: { city: 'Denver', timeZone: 'America/Denver' },
  EUG: { city: 'Eugene', timeZone: 'America/Los_Angeles' },
  FCO: { city: 'Rome', timeZone: 'Europe/Rome' },
  GEG: { city: 'Spokane', timeZone: 'America/Los_Angeles' },
  HNL: { city: 'Honolulu', timeZone: 'Pacific/Honolulu' },
  IAD: { city: 'Washington', timeZone: 'America/New_York' },
  IAH: { city: 'Houston', timeZone: 'America/Chicago' },
  IND: { city: 'Indianapolis', timeZone: 'America/Indiana/Indianapolis' },
  JFK: { city: 'New York', timeZone: 'America/New_York' },
  JNU: { city: 'Juneau', timeZone: 'America/Juneau' },
  KOA: { city: 'Kona', timeZone: 'Pacific/Honolulu' },
  LAS: { city: 'Las Vegas', timeZone: 'America/Los_Angeles' },
  LAX: { city: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  LIH: { city: 'Lihue', timeZone: 'Pacific/Honolulu' },
  MAD: { city: 'Madrid', timeZone: 'Europe/Madrid' },
  MCI: { city: 'Kansas City', timeZone: 'America/Chicago' },
  MCO: { city: 'Orlando', timeZone: 'America/New_York' },
  MSP: { city: 'Minneapolis', timeZone: 'America/Chicago' },
  OAK: { city: 'Oakland', timeZone: 'America/Los_Angeles' },
  OGG: { city: 'Maui', timeZone: 'Pacific/Honolulu' },
  ORD: { city: 'Chicago', timeZone: 'America/Chicago' },
  PAE: { city: 'Everett', timeZone: 'America/Los_Angeles' },
  PDX: { city: 'Portland', timeZone: 'America/Los_Angeles' },
  PHX: { city: 'Phoenix', timeZone: 'America/Phoenix' },
  RNO: { city: 'Reno', timeZone: 'America/Los_Angeles' },
  SEA: { city: 'Seattle', timeZone: 'America/Los_Angeles' },
  SJC: { city: 'San Jose', timeZone: 'America/Los_Angeles' },
  SMF: { city: 'Sacramento', timeZone: 'America/Los_Angeles' },
  SFO: { city: 'San Francisco', timeZone: 'America/Los_Angeles' },
  SNA: { city: 'Santa Ana', timeZone: 'America/Los_Angeles' },
  SAN: { city: 'San Diego', timeZone: 'America/Los_Angeles' },
  STL: { city: 'St. Louis', timeZone: 'America/Chicago' },
  TPA: { city: 'Tampa', timeZone: 'America/New_York' },
  YVR: { city: 'Vancouver', timeZone: 'America/Vancouver' },
  YYC: { city: 'Calgary', timeZone: 'America/Edmonton' },
}

function dateLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone,
  })
    .format(new Date(iso))
    .toUpperCase()
}

function timeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
    timeZoneName: 'short',
  }).format(new Date(iso))
}

function frameFetchLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function toPosterFlight(live: LiveFlight): Flight {
  const origin = airportDetails[live.origin] ?? { city: live.origin, timeZone: 'UTC' }
  const destination = airportDetails[live.destination] ?? { city: live.destination, timeZone: 'UTC' }

  return {
    airline: live.airlineName,
    airlineIata: live.airlineIata,
    airlineIcao: live.airlineIcao,
    flightNumber: live.flightNumber,
    origin: live.origin,
    originCity: origin.city,
    destination: live.destination,
    destinationCity: destination.city,
    departureDate: dateLabel(live.start, origin.timeZone),
    departureTime: timeLabel(live.start, origin.timeZone),
    arrivalTime: timeLabel(live.end, destination.timeZone),
    aircraftName: live.equipment?.name ?? 'Aircraft pending',
    aircraftCode: live.equipment?.code ?? 'TBD',
    aircraftLabel: live.equipmentSource === 'flightaware-typical' ? 'Typical aircraft' : 'Aircraft',
    aircraftNote: live.equipmentSource === 'flightaware-typical' && live.equipmentEvidence
      ? `${live.equipmentEvidence.matchingCount} of ${live.equipmentEvidence.totalCount} recent flights`
      : undefined,
    tailUrl: live.tailUrl,
    overlayVariant: live.overlayVariant,
    status: 'up-next',
  }
}

export function DisplayDialog({ open, onClose, flight, palette }: DisplayDialogProps) {
  const [phase, setPhase] = useState<DisplayPhase>('loading')
  const [liveFlights, setLiveFlights] = useState<Flight[]>([])
  const [livePaletteIndices, setLivePaletteIndices] = useState<number[]>([])
  const [currentPhoto, setCurrentPhoto] = useState<CurrentPhoto | null>(null)
  const [frameFetchedAt, setFrameFetchedAt] = useState<string | null>(null)
  const [flightIndex, setFlightIndex] = useState(0)
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')

  const loadCurrentFrame = useCallback(async (signal?: AbortSignal) => {
    setPhase('loading')
    setMessage('')

    try {
      const response = await fetch('/api/current-frame', {
        credentials: 'same-origin',
        signal,
      })

      if (response.status === 401) {
        setPhase('locked')
        return
      }
      if (!response.ok) throw new Error('The current frame could not be loaded.')

      const data = (await response.json()) as CurrentFrameResponse
      setFrameFetchedAt(data.fetchedAt)
      if (data.kind === 'unconfirmed') {
        setCurrentPhoto(null)
        setLiveFlights([])
        setLivePaletteIndices([])
        setPhase('unconfirmed')
        return
      }
      if (data.kind === 'empty') {
        setCurrentPhoto(null)
        setPhase('empty')
        return
      }

      if (data.kind === 'photo') {
        setCurrentPhoto(data.photo)
        setLiveFlights([])
        setLivePaletteIndices([])
      } else {
        setCurrentPhoto(null)
        setLiveFlights([toPosterFlight(data.flight)])
        setLivePaletteIndices([data.paletteIndex ?? automaticPaletteIndex(data.flight)])
      }
      setFlightIndex(0)
      setPhase('ready')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage(error instanceof Error ? error.message : 'The current frame could not be loaded.')
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    void loadCurrentFrame(controller.signal)
    return () => controller.abort()
  }, [loadCurrentFrame, open])

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setPhase('loading')
    setMessage('')

    try {
      const response = await fetch('/api/unlock', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        setMessage('That display token was not accepted.')
        setPhase('locked')
        return
      }

      setToken('')
      await loadCurrentFrame()
    } catch {
      setMessage('The display could not be unlocked. Please try again.')
      setPhase('locked')
    }
  }

  if (!open) return null

  const frameCheckInIsStale = frameFetchedAt
    ? Date.now() - new Date(frameFetchedAt).getTime() > 30 * 60 * 1000
    : true
  const frameStatus = frameCheckInIsStale
    ? 'Last image sent · check-in overdue'
    : 'Last image sent'
  const frameFetchTime = frameFetchedAt ? frameFetchLabel(frameFetchedAt) : null

  return (
    <div className="display-dialog" role="dialog" aria-modal="true" aria-label="Personal flight display">
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close display preview">
        <X aria-hidden="true" />
      </button>

      {phase === 'ready' && currentPhoto && (
        <div className="live-photo-preview">
          <img
            src={`/api/photos/${currentPhoto.id}/display?live=${encodeURIComponent(currentPhoto.updatedAt)}`}
            alt={currentPhoto.name}
          />
          <p>
            {frameStatus} · photo
            {frameFetchTime && <time dateTime={frameFetchedAt ?? undefined}>Frame fetched {frameFetchTime}</time>}
          </p>
        </div>
      )}

      {phase === 'ready' && !currentPhoto && liveFlights[flightIndex] && (
        <>
          <FlightPoster
            flight={liveFlights[flightIndex]}
            palette={palettes[livePaletteIndices[flightIndex] ?? 0] ?? palettes[0]}
            className="poster-fullscreen"
          />
          <p className="live-frame-label">
            {frameStatus} · flight
            {frameFetchTime && <time dateTime={frameFetchedAt ?? undefined}>Frame fetched {frameFetchTime}</time>}
          </p>
        </>
      )}

      {phase === 'loading' && (
        <div className="display-state" role="status">
          <LoaderCircle className="state-spinner" aria-hidden="true" />
          <p>Loading the current frame…</p>
        </div>
      )}

      {phase === 'unconfirmed' && (
        <div className="display-state" role="status">
          <RefreshCw aria-hidden="true" />
          <h2>Display hasn’t checked in yet</h2>
          <p>The website cannot confirm what is physically on the frame until the EE02 requests its next image.</p>
          <button type="button" onClick={() => void loadCurrentFrame()}>Check again</button>
        </div>
      )}

      {phase === 'locked' && (
        <form className="display-state unlock-form" onSubmit={unlock}>
          <KeyRound aria-hidden="true" />
          <div>
            <h2>Private display</h2>
            <p>Enter the display token to load my real itinerary.</p>
          </div>
          <label htmlFor="display-token">Display token</label>
          <input
            id="display-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />
          {message && <p className="state-error" role="alert">{message}</p>}
          <button type="submit">Unlock my display</button>
        </form>
      )}

      {phase === 'empty' && (
        <div className="display-state">
          <h2>No current frame</h2>
          <p>The frame has no active flight or enabled photo right now.</p>
          <button
            type="button"
            onClick={() => {
              setLiveFlights([flight])
              setLivePaletteIndices([Math.max(0, palettes.indexOf(palette))])
              setFlightIndex(0)
              setPhase('ready')
            }}
          >
            View sample poster
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="display-state">
          <RefreshCw aria-hidden="true" />
          <h2>Couldn’t load the display</h2>
          <p>{message}</p>
          <button type="button" onClick={() => void loadCurrentFrame()}>Try again</button>
        </div>
      )}
    </div>
  )
}
