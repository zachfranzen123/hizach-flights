import type { Flight } from '../data/sampleFlight'
import goldenGateTower from '../assets/destination/golden-gate-tower-poster.webp'
import goldenGateUnderpass from '../assets/destination/golden-gate-underpass-poster.webp'
import sfoFogBackground from '../assets/destination/sfo-fog-background.webp'
import sfoSunriseBackground from '../assets/destination/sfo-sunrise-background.webp'

const hawaiiAirports = new Set([
  'HNL', 'OGG', 'KOA', 'LIH', 'ITO', 'MKK', 'LNY', 'JHM', 'HNM',
])

type OverlayProps = {
  flight: Flight
}

type MotifProps = {
  transform: string
  scale?: number
}

function stableVariant(flight: Flight, count: number) {
  const identity = `${flight.airlineIata}${flight.flightNumber}${flight.origin}${flight.destination}${flight.departureDate}`
  let hash = 0
  for (const character of identity) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  return Math.abs(hash) % count
}

export function getSfoVariant(flight: Flight) {
  return flight.overlayVariant === undefined
    ? stableVariant(flight, 4)
    : Math.abs(flight.overlayVariant) % 4
}

function Plumeria({ transform, scale = 1 }: MotifProps) {
  return (
    <g transform={`${transform} scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((rotation) => (
        <ellipse
          key={rotation}
          cx="0"
          cy="-12"
          rx="8"
          ry="15"
          transform={`rotate(${rotation})`}
          fill="var(--overlay-flower-secondary)"
        />
      ))}
      <circle r="5" fill="var(--overlay-flower-center)" />
    </g>
  )
}

function Hibiscus({ transform, scale = 1 }: MotifProps) {
  return (
    <g transform={`${transform} scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((rotation) => (
        <ellipse
          key={rotation}
          cx="0"
          cy="-17"
          rx="14"
          ry="22"
          transform={`rotate(${rotation})`}
          fill="var(--overlay-flower-primary)"
        />
      ))}
      <circle r="7" fill="var(--overlay-flower-center)" />
      <path d="M 2 -4 C 13 -17, 18 -25, 24 -34" fill="none" stroke="var(--overlay-flower-center)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="25" cy="-35" r="3" fill="var(--overlay-flower-center)" />
    </g>
  )
}

function TropicalLeaf({ transform, scale = 1 }: MotifProps) {
  return (
    <g transform={`${transform} scale(${scale})`}>
      <path d="M 0 0 C -31 -19, -40 -58, -8 -88 C 21 -62, 30 -24, 0 0 Z" fill="var(--overlay-foliage)" />
      <path d="M 0 -2 C -3 -28, -4 -54, -8 -82" fill="none" stroke="var(--overlay-leaf-vein)" strokeWidth="2" />
    </g>
  )
}

function HawaiiOverlay({ variant }: { variant: number }) {
  if (variant === 1) {
    return (
      <svg className="destination-overlay hawaii-overlay lei-overlay" viewBox="0 0 300 400" aria-hidden="true">
        <path d="M -12 316 C 55 253, 111 245, 185 266" fill="none" stroke="var(--overlay-foliage)" strokeWidth="3" />
        <Plumeria transform="translate(5 313)" scale={0.72} />
        <Plumeria transform="translate(35 287) rotate(-15)" scale={0.58} />
        <Hibiscus transform="translate(67 269) rotate(20)" scale={0.42} />
        <Plumeria transform="translate(101 257)" scale={0.52} />
        <Plumeria transform="translate(139 257) rotate(18)" scale={0.38} />
        <Hibiscus transform="translate(171 265) rotate(-18)" scale={0.27} />
      </svg>
    )
  }

  if (variant === 2) {
    return (
      <svg className="destination-overlay hawaii-overlay base-overlay" viewBox="0 0 300 400" aria-hidden="true">
        <TropicalLeaf transform="translate(17 407) rotate(-24)" scale={0.88} />
        <TropicalLeaf transform="translate(65 413) rotate(35)" scale={0.72} />
        <Plumeria transform="translate(24 376)" scale={0.56} />
        <Plumeria transform="translate(49 388) rotate(22)" scale={0.4} />
        <TropicalLeaf transform="translate(285 407) rotate(22)" scale={0.88} />
        <TropicalLeaf transform="translate(242 414) rotate(-34)" scale={0.68} />
        <Hibiscus transform="translate(271 383) rotate(-12)" scale={0.48} />
        <Plumeria transform="translate(240 394)" scale={0.38} />
      </svg>
    )
  }

  return (
    <svg className="destination-overlay hawaii-overlay corner-overlay" viewBox="0 0 300 400" aria-hidden="true">
      <TropicalLeaf transform="translate(306 95) rotate(40)" scale={0.86} />
      <TropicalLeaf transform="translate(286 22) rotate(-28)" scale={0.72} />
      <Hibiscus transform="translate(273 64) rotate(-8)" scale={0.58} />
      <Plumeria transform="translate(246 107) rotate(15)" scale={0.42} />
      <Plumeria transform="translate(291 124) rotate(-20)" scale={0.34} />
    </svg>
  )
}

function SfoOverlay({ variant }: { variant: number }) {
  if (variant === 1) {
    return (
      <div className="destination-overlay sfo-overlay sfo-fog-background" aria-hidden="true">
        <img className="sfo-background-art" src={sfoFogBackground} alt="" />
        <img className="sfo-background-tower" src={goldenGateTower} alt="" />
      </div>
    )
  }

  if (variant === 2) {
    return (
      <div className="destination-overlay sfo-overlay sfo-type-background" aria-hidden="true">
        <div className="sfo-type-field">
          {Array.from({ length: 10 }, (_, index) => <span key={index}>SAN FRANCISCO</span>)}
        </div>
        <img className="sfo-type-tower" src={goldenGateTower} alt="" />
      </div>
    )
  }

  if (variant === 3) {
    return (
      <div className="destination-overlay sfo-overlay sfo-night-background" aria-hidden="true">
        <div className="sfo-night-sun" />
        <div className="sfo-night-fog sfo-night-fog-one" />
        <div className="sfo-night-fog sfo-night-fog-two" />
        <img className="sfo-night-bridge" src={goldenGateUnderpass} alt="" />
      </div>
    )
  }

  return (
    <img className="destination-overlay sfo-overlay sfo-sunrise-background" src={sfoSunriseBackground} alt="" aria-hidden="true" />
  )
}

export function DestinationOverlay({ flight }: OverlayProps) {
  const requestedVariant = flight.overlayVariant

  if (hawaiiAirports.has(flight.destination)) {
    const variant = requestedVariant === undefined ? stableVariant(flight, 3) : Math.abs(requestedVariant) % 3
    return <HawaiiOverlay variant={variant} />
  }

  if (flight.destination === 'SFO') {
    const variant = getSfoVariant(flight)
    return <SfoOverlay variant={variant} />
  }

  return null
}
