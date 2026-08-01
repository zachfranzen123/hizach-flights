import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { KeyRound, LoaderCircle, RefreshCw, X } from 'lucide-react'
import type { Flight } from '../data/sampleFlight'
import { FlightPoster, type PosterPalette } from './FlightPoster'

type DisplayDialogProps = {
  open: boolean
  onClose: () => void
  flight: Flight
  palette: PosterPalette
}

type LiveFlightResponse = {
  flight: null | {
    airlineIata: string
    airlineIcao: string
    airlineName: string
    destination: string
    end: string
    equipment: null | {
      code: string
      name: string
    }
    flightNumber: string
    origin: string
    start: string
    tailUrl: string
  }
}

type DisplayPhase = 'loading' | 'locked' | 'ready' | 'empty' | 'error'

const airportDetails: Record<string, { city: string; timeZone: string }> = {
  MAD: { city: 'Madrid', timeZone: 'Europe/Madrid' },
  SFO: { city: 'San Francisco', timeZone: 'America/Los_Angeles' },
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

function toPosterFlight(live: NonNullable<LiveFlightResponse['flight']>): Flight {
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
    tailUrl: live.tailUrl,
    status: 'up-next',
  }
}

export function DisplayDialog({ open, onClose, flight, palette }: DisplayDialogProps) {
  const [phase, setPhase] = useState<DisplayPhase>('loading')
  const [liveFlight, setLiveFlight] = useState<Flight | null>(null)
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')

  const loadFlight = useCallback(async (signal?: AbortSignal) => {
    setPhase('loading')
    setMessage('')

    try {
      const response = await fetch('/api/next-flight', {
        credentials: 'same-origin',
        signal,
      })

      if (response.status === 401) {
        setPhase('locked')
        return
      }
      if (!response.ok) throw new Error('The live flight could not be loaded.')

      const data = (await response.json()) as LiveFlightResponse
      if (!data.flight) {
        setPhase('empty')
        return
      }

      setLiveFlight(toPosterFlight(data.flight))
      setPhase('ready')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage(error instanceof Error ? error.message : 'The live flight could not be loaded.')
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    void loadFlight(controller.signal)
    return () => controller.abort()
  }, [loadFlight, open])

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
      await loadFlight()
    } catch {
      setMessage('The display could not be unlocked. Please try again.')
      setPhase('locked')
    }
  }

  if (!open) return null

  return (
    <div className="display-dialog" role="dialog" aria-modal="true" aria-label="Personal flight display">
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close display preview">
        <X aria-hidden="true" />
      </button>

      {phase === 'ready' && liveFlight && (
        <FlightPoster flight={liveFlight} palette={palette} className="poster-fullscreen" />
      )}

      {phase === 'loading' && (
        <div className="display-state" role="status">
          <LoaderCircle className="state-spinner" aria-hidden="true" />
          <p>Loading my next flight…</p>
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
          <h2>No upcoming flight</h2>
          <p>My Flighty calendar does not currently contain a future flight.</p>
          <button
            type="button"
            onClick={() => {
              setLiveFlight(flight)
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
          <button type="button" onClick={() => void loadFlight()}>Try again</button>
        </div>
      )}
    </div>
  )
}
