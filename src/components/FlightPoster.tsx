import iberiaA330 from '../assets/iberia-a330.png'
import iberiaA319 from '../assets/aircraft/iberia-a319.png'
import iberiaA320 from '../assets/aircraft/iberia-a320.png'
import iberiaA321 from '../assets/aircraft/iberia-a321.png'
import vuelingA321neo from '../assets/aircraft/vueling-a321neo.png'
import alaska737700 from '../assets/aircraft/alaska-737-700.png'
import alaska737800 from '../assets/aircraft/alaska-737-800.png'
import alaska737900er from '../assets/aircraft/alaska-737-900er.png'
import alaska737Max8 from '../assets/aircraft/alaska-737-max-8.png'
import alaska737Max9 from '../assets/aircraft/alaska-737-max-9.png'
import alaskaE175 from '../assets/aircraft/alaska-e175.png'
// Alaska 787-9 uses the DDS-referenced transparent Dreamliner cutout.
import alaska7879 from '../assets/aircraft/alaska-787-9.png'
import type { Flight } from '../data/sampleFlight'
import { DestinationOverlay } from './DestinationOverlay'

export type PosterPalette = {
  name: string
  background: string
  foreground: string
  muted: string
  decoration: {
    flowerPrimary: string
    flowerSecondary: string
    flowerCenter: string
    foliage: string
    leafVein: string
    bridge: string
    fog: string
  }
}

type FlightPosterProps = {
  flight: Flight
  palette: PosterPalette
  className?: string
}

export function FlightPoster({ flight, palette, className = '' }: FlightPosterProps) {
  const statusLabel = flight.status === 'current' ? 'IN FLIGHT' : 'UP NEXT'
  const artworkByAircraft: Record<string, string> = flight.airlineIata === 'AS'
    ? {
        B737: alaska737700,
        B738: alaska737800,
        B739: alaska737900er,
        B38M: alaska737Max8,
        B39M: alaska737Max9,
        E75L: alaskaE175,
        B789: alaska7879,
      }
    : flight.airlineIata === 'VY'
      ? { A21N: vuelingA321neo }
      : {
        A319: iberiaA319,
        A320: iberiaA320,
        A321: iberiaA321,
        A332: iberiaA330,
      }
  const aircraftArtwork = artworkByAircraft[flight.aircraftCode]
  const destinationClass = flight.destination === 'SFO' ? 'destination-sfo' : ''

  return (
    <article
      className={`flight-poster ${destinationClass} ${className}`}
      style={{
        '--poster-bg': palette.background,
        '--poster-fg': palette.foreground,
        '--poster-muted': palette.muted,
        '--overlay-flower-primary': palette.decoration.flowerPrimary,
        '--overlay-flower-secondary': palette.decoration.flowerSecondary,
        '--overlay-flower-center': palette.decoration.flowerCenter,
        '--overlay-foliage': palette.decoration.foliage,
        '--overlay-leaf-vein': palette.decoration.leafVein,
        '--overlay-bridge': palette.decoration.bridge,
        '--overlay-fog': palette.decoration.fog,
      } as React.CSSProperties}
      aria-label={`${flight.airline} flight ${flight.airlineIata} ${flight.flightNumber} poster`}
    >
      <DestinationOverlay flight={flight} />
      <header className="poster-heading">
        <div className="poster-status">
          <p className="poster-label">{statusLabel}</p>
          {flight.tailUrl && (
            <img
              className="poster-tail-mark"
              src={flight.tailUrl}
              alt={`${flight.airline} tail artwork`}
              onError={(event) => {
                event.currentTarget.hidden = true
              }}
            />
          )}
        </div>
        <p className="poster-date">{flight.departureDate}</p>
      </header>

      <div className="poster-title-block">
        <h2>{flight.airlineIata} {flight.flightNumber}</h2>
        <p>{flight.origin}<span aria-hidden="true"> → </span>{flight.destination}</p>
      </div>

      <figure className="aircraft-stage">
        {aircraftArtwork ? (
          <img
            src={aircraftArtwork}
            alt={`Side profile of an ${flight.airline} ${flight.aircraftName}`}
          />
        ) : (
          <p className="aircraft-pending">AIRCRAFT ARTWORK<br />PENDING ASSIGNMENT</p>
        )}
      </figure>

      <footer className="poster-details">
        <div className="poster-detail-primary">
          <p className="poster-label">{flight.aircraftLabel ?? 'Aircraft'}</p>
          <p>{flight.aircraftName}</p>
          <p className="poster-code">
            {flight.aircraftCode}{flight.aircraftNote ? ` · ${flight.aircraftNote}` : ''}
          </p>
        </div>
        <div className="poster-detail-route">
          <p className="poster-label">ROUTE</p>
          <p>{flight.originCity} / {flight.destinationCity}</p>
          <p className="poster-times">{flight.departureTime} · {flight.arrivalTime}</p>
        </div>
      </footer>
    </article>
  )
}
