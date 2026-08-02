import type { Flight } from '../data/sampleFlight'

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
      <svg className="destination-overlay sfo-overlay sfo-span" viewBox="0 0 300 400" aria-hidden="true">
        <path d="M -12 313 C 48 238, 105 236, 150 286 C 198 236, 252 239, 312 313" fill="none" stroke="var(--overlay-bridge)" strokeWidth="3" />
        <path d="M 70 260 V 358 M 230 260 V 358 M 54 278 H 86 M 214 278 H 246" fill="none" stroke="var(--overlay-bridge)" strokeWidth="6" />
        <path d="M -8 313 H 308 M 24 288 V 313 M 51 267 V 313 M 96 248 V 313 M 124 259 V 313 M 176 259 V 313 M 204 248 V 313 M 249 267 V 313 M 276 288 V 313" fill="none" stroke="var(--overlay-bridge)" strokeWidth="2" />
      </svg>
    )
  }

  if (variant === 2) {
    return (
      <svg className="destination-overlay sfo-overlay sfo-crop" viewBox="0 0 300 400" aria-hidden="true">
        <path d="M -25 135 C 34 183, 77 209, 132 230 C 195 254, 246 295, 325 366" fill="none" stroke="var(--overlay-bridge)" strokeWidth="4" />
        <path d="M 78 126 V 366 M 45 183 H 111 M 47 209 H 109" fill="none" stroke="var(--overlay-bridge)" strokeWidth="12" />
        <path d="M 4 158 V 177 M 29 177 V 198 M 128 229 V 244 M 171 249 V 269 M 216 276 V 298 M 260 310 V 333" fill="none" stroke="var(--overlay-bridge)" strokeWidth="2" />
      </svg>
    )
  }

  if (variant === 3) {
    return (
      <svg className="destination-overlay sfo-overlay sfo-fog" viewBox="0 0 300 400" aria-hidden="true">
        <path d="M 228 154 V 346 M 204 201 H 252 M 207 226 H 249" fill="none" stroke="var(--overlay-bridge)" strokeWidth="10" />
        <path d="M 34 313 C 91 250, 154 228, 228 194 C 262 178, 290 151, 320 116" fill="none" stroke="var(--overlay-bridge)" strokeWidth="4" />
        <path d="M -20 318 H 320 M -20 338 H 320 M 22 357 H 279" fill="none" stroke="var(--overlay-fog)" strokeWidth="12" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="destination-overlay sfo-overlay sfo-pillar" viewBox="0 0 300 400" aria-hidden="true">
      <path d="M 211 105 V 360 M 174 172 H 248 M 178 204 H 244" fill="none" stroke="var(--overlay-bridge)" strokeWidth="15" />
      <path d="M -12 288 C 64 220, 130 205, 211 165 C 248 147, 282 119, 318 78" fill="none" stroke="var(--overlay-bridge)" strokeWidth="4" />
      <path d="M 16 265 V 289 M 48 240 V 269 M 82 221 V 252 M 119 205 V 237 M 158 190 V 223 M 268 132 V 171 M 295 101 V 144" fill="none" stroke="var(--overlay-bridge)" strokeWidth="2" />
    </svg>
  )
}

export function DestinationOverlay({ flight }: OverlayProps) {
  if (hawaiiAirports.has(flight.destination)) {
    return <HawaiiOverlay variant={stableVariant(flight, 3)} />
  }

  if (flight.destination === 'SFO') {
    return <SfoOverlay variant={stableVariant(flight, 4)} />
  }

  return null
}
