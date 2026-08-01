import aircraftArtwork from '../assets/iberia-a330.png'
import type { Flight } from '../data/sampleFlight'

export type PosterPalette = {
  name: string
  background: string
  foreground: string
  muted: string
}

type FlightPosterProps = {
  flight: Flight
  palette: PosterPalette
  className?: string
}

export function FlightPoster({ flight, palette, className = '' }: FlightPosterProps) {
  const statusLabel = flight.status === 'current' ? 'IN FLIGHT' : 'UP NEXT'

  return (
    <article
      className={`flight-poster ${className}`}
      style={{
        '--poster-bg': palette.background,
        '--poster-fg': palette.foreground,
        '--poster-muted': palette.muted,
      } as React.CSSProperties}
      aria-label={`${flight.airline} flight ${flight.airlineIata} ${flight.flightNumber} poster`}
    >
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
        {flight.aircraftCode === 'A332' ? (
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
          <p className="poster-label">AIRCRAFT</p>
          <p>{flight.aircraftName}</p>
          <p className="poster-code">{flight.aircraftCode}</p>
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
