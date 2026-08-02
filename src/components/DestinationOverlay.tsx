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

function GoldenGateTower({ x, top, scale = 1 }: { x: number; top: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${top}) scale(${scale})`}>
      <path
        d="M -27 154 L -20 16 L -13 16 L -9 154 Z M 9 154 L 13 16 L 20 16 L 27 154 Z"
        fill="var(--overlay-bridge)"
      />
      <path d="M -24 25 H 24 L 21 38 H -21 Z M -17 67 H 17 L 16 78 H -16 Z M -13 108 H 13 L 12 118 H -12 Z" fill="var(--overlay-bridge)" />
      <path d="M -23 12 H 23 L 20 20 H -20 Z M -18 7 H 18 L 15 13 H -15 Z" fill="var(--overlay-bridge)" />
      <path d="M -13 38 L 13 67 M 13 38 L -13 67 M -11 78 L 11 108 M 11 78 L -11 108" fill="none" stroke="var(--overlay-bridge)" strokeWidth="3" />
    </g>
  )
}

function BridgeDeck({ y = 305 }: { y?: number }) {
  return (
    <g>
      <path d={`M -15 ${y} H 315`} stroke="var(--overlay-bridge)" strokeWidth="5" />
      <path d={`M -15 ${y + 7} H 315`} stroke="var(--overlay-bridge)" strokeWidth="2" />
      {Array.from({ length: 23 }, (_, index) => {
        const x = -10 + index * 15
        return <path key={x} d={`M ${x} ${y} l 8 7 M ${x + 8} ${y} l -8 7`} stroke="var(--overlay-bridge)" strokeWidth="0.8" />
      })}
    </g>
  )
}

function SfoOverlay({ variant }: { variant: number }) {
  if (variant === 1) {
    return (
      <svg className="destination-overlay sfo-overlay sfo-span" viewBox="0 0 300 400" aria-hidden="true">
        <GoldenGateTower x={74} top={142} scale={0.82} />
        <GoldenGateTower x={226} top={142} scale={0.82} />
        <BridgeDeck y={292} />
        <path d="M -12 292 C 20 242, 47 200, 74 155 C 112 211, 132 250, 150 275 C 168 250, 188 211, 226 155 C 253 200, 280 242, 312 292" fill="none" stroke="var(--overlay-bridge)" strokeWidth="3" />
        {[4, 20, 36, 52, 96, 112, 128, 144, 156, 172, 188, 204, 248, 264, 280, 296].map((x) => {
          const cableY = x < 74
            ? 292 - (74 - x) * 1.55
            : x < 150
              ? 155 + (x - 74) * 1.58
              : x < 226
                ? 275 - (x - 150) * 1.58
                : 155 + (x - 226) * 1.55
          return <path key={x} d={`M ${x} ${cableY} V 292`} stroke="var(--overlay-bridge)" strokeWidth="1" />
        })}
      </svg>
    )
  }

  if (variant === 2) {
    return (
      <svg className="destination-overlay sfo-overlay sfo-crop" viewBox="0 0 300 400" aria-hidden="true">
        <GoldenGateTower x={69} top={118} scale={1.28} />
        <BridgeDeck y={312} />
        <path d="M -30 86 C 3 126, 35 165, 69 137 C 117 200, 168 245, 330 312" fill="none" stroke="var(--overlay-bridge)" strokeWidth="4" />
        {[2, 20, 38, 106, 130, 156, 184, 214, 246, 280].map((x, index) => (
          <path key={x} d={`M ${x} ${index < 3 ? 126 + index * 22 : 192 + (index - 3) * 18} V 312`} stroke="var(--overlay-bridge)" strokeWidth="1.2" />
        ))}
      </svg>
    )
  }

  if (variant === 3) {
    return (
      <svg className="destination-overlay sfo-overlay sfo-fog" viewBox="0 0 300 400" aria-hidden="true">
        <GoldenGateTower x={222} top={121} scale={1.08} />
        <BridgeDeck y={306} />
        <path d="M -20 306 C 63 280, 139 226, 222 142 C 256 189, 286 245, 320 306" fill="none" stroke="var(--overlay-bridge)" strokeWidth="3.5" />
        {[8, 36, 65, 96, 128, 160, 190, 258, 282].map((x, index) => (
          <path key={x} d={`M ${x} ${280 - index * 12} V 306`} stroke="var(--overlay-bridge)" strokeWidth="1" />
        ))}
        <path d="M -28 273 C 30 258, 86 279, 143 268 S 246 250, 328 271 M -30 292 C 39 278, 87 301, 154 289 S 252 274, 330 292 M -25 318 C 42 308, 104 329, 171 316 S 265 303, 328 318" fill="none" stroke="var(--overlay-fog)" strokeWidth="13" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="destination-overlay sfo-overlay sfo-pillar" viewBox="0 0 300 400" aria-hidden="true">
      <GoldenGateTower x={214} top={106} scale={1.34} />
      <BridgeDeck y={315} />
      <path d="M -18 315 C 54 272, 130 220, 214 132 C 249 178, 283 238, 319 315" fill="none" stroke="var(--overlay-bridge)" strokeWidth="4" />
      {[7, 31, 57, 84, 112, 141, 171, 187, 264, 288].map((x, index) => {
        const topY = index < 7 ? 302 - index * 20 : index === 7 ? 160 : 210 + (index - 8) * 38
        return <path key={x} d={`M ${x} ${topY} V 315`} stroke="var(--overlay-bridge)" strokeWidth="1.2" />
      })}
    </svg>
  )
}

export function DestinationOverlay({ flight }: OverlayProps) {
  const requestedVariant = flight.overlayVariant

  if (hawaiiAirports.has(flight.destination)) {
    const variant = requestedVariant === undefined ? stableVariant(flight, 3) : Math.abs(requestedVariant) % 3
    return <HawaiiOverlay variant={variant} />
  }

  if (flight.destination === 'SFO') {
    const variant = requestedVariant === undefined ? stableVariant(flight, 4) : Math.abs(requestedVariant) % 4
    return <SfoOverlay variant={variant} />
  }

  return null
}
