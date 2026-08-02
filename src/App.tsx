import { useEffect, useState } from 'react'
import { CalendarDays, Frame, Plane } from 'lucide-react'
import { DisplayDialog } from './components/DisplayDialog'
import { FlightPoster, type PosterPalette } from './components/FlightPoster'
import { PaletteControl } from './components/PaletteControl'
import { sampleFlight } from './data/sampleFlight'
import frameBedroomCycle from './assets/demo/frame-bedroom-cycle.gif'
import frameBedroomStill from './assets/demo/frame-bedroom-still.jpg'

const previewFlights = {
  hawaii: {
    ...sampleFlight,
    airline: 'Alaska Airlines',
    airlineIata: 'AS',
    airlineIcao: 'ASA',
    flightNumber: '877',
    origin: 'SFO',
    originCity: 'San Francisco',
    destination: 'HNL',
    destinationCity: 'Honolulu',
    departureDate: '12 AUG 2026',
    departureTime: '09:15 PDT',
    arrivalTime: '11:42 HST',
    aircraftName: 'Boeing 737-800',
    aircraftCode: 'B738',
  },
  sfo: {
    ...sampleFlight,
    airline: 'Alaska Airlines',
    airlineIata: 'AS',
    airlineIcao: 'ASA',
    flightNumber: '655',
    origin: 'SEA',
    originCity: 'Seattle',
    destination: 'SFO',
    destinationCity: 'San Francisco',
    departureDate: '01 AUG 2026',
    departureTime: '10:47 UTC',
    arrivalTime: '14:02 PDT',
    aircraftName: 'Boeing 737-800',
    aircraftCode: 'B738',
  },
  'sfo-lax': {
    ...sampleFlight,
    airline: 'Alaska Airlines',
    airlineIata: 'AS',
    airlineIcao: 'ASA',
    flightNumber: '341',
    origin: 'LAX',
    originCity: 'Los Angeles',
    destination: 'SFO',
    destinationCity: 'San Francisco',
    departureDate: '07 AUG 2026',
    departureTime: '16:20 PDT',
    arrivalTime: '17:52 PDT',
    aircraftName: 'Embraer E175',
    aircraftCode: 'E75L',
  },
  'sfo-hnl': {
    ...sampleFlight,
    airline: 'Alaska Airlines',
    airlineIata: 'AS',
    airlineIcao: 'ASA',
    flightNumber: '876',
    origin: 'HNL',
    originCity: 'Honolulu',
    destination: 'SFO',
    destinationCity: 'San Francisco',
    departureDate: '14 AUG 2026',
    departureTime: '13:15 HST',
    arrivalTime: '21:32 PDT',
    aircraftName: 'Boeing 737-800',
    aircraftCode: 'B738',
  },
  'sfo-jfk': {
    ...sampleFlight,
    airline: 'Alaska Airlines',
    airlineIata: 'AS',
    airlineIcao: 'ASA',
    flightNumber: '20',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'SFO',
    destinationCity: 'San Francisco',
    departureDate: '22 AUG 2026',
    departureTime: '09:30 EDT',
    arrivalTime: '12:58 PDT',
    aircraftName: 'Boeing 737-800',
    aircraftCode: 'B738',
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

const workflow = [
  {
    icon: CalendarDays,
    title: 'The idea',
    body: 'I wanted the next trip on my Flighty calendar to become something I could hang on a wall.',
  },
  {
    icon: Plane,
    title: 'The artwork',
    body: 'Each poster pairs the flight details with the aircraft and airline I will actually be flying.',
  },
  {
    icon: Frame,
    title: 'The destination',
    body: 'The 13.3-inch color e-paper panel will sit behind a custom mat in an 11 × 14-inch frame.',
  },
]

function App() {
  const previewParams = new URLSearchParams(window.location.search)
  const previewKey = previewParams.get('preview') ?? ''
  const previewVariant = Number.parseInt(previewParams.get('variant') ?? '', 10)
  const requestedPalette = Number.parseInt(previewParams.get('palette') ?? '', 10)
  const [paletteIndex, setPaletteIndex] = useState(
    Number.isInteger(requestedPalette) && requestedPalette >= 0 && requestedPalette < palettes.length
      ? requestedPalette
      : 0,
  )
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
      <header className="site-header">
        <a className="site-brand" href="#top">ZACH / FLIGHTS</a>
        <nav aria-label="Primary navigation">
          <a href="#poster">Poster</a>
          <a href="#about">About</a>
          <a href="/photos">My photos</a>
          <a href="#credits">Credits</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" id="poster">
          <div className="hero-copy">
            <h1>My next<br />flight.</h1>
            <p className="hero-intro">A personal e-paper display for the flights I’m taking.</p>
            <button className="primary-action" type="button" onClick={() => setDisplayOpen(true)}>
              <Frame aria-hidden="true" />
              View the display
            </button>
            <p className="hardware-note">A personal, non-commercial project for my home.</p>
            <PaletteControl palettes={palettes} selected={paletteIndex} onSelect={setPaletteIndex} />
          </div>

          <div className="poster-shell">
            <p className="sample-label">Personal project · prototype display</p>
            <div className="poster-frame">
              <FlightPoster flight={posterFlight} palette={palette} />
            </div>
          </div>
        </section>

        <section className="frame-showcase" id="frame">
          <div className="frame-showcase-copy">
            <p className="frame-kicker">The finished frame</p>
            <h2>Made for one wall.</h2>
            <p>The display switches to a flight poster a few hours before departure, then returns to a rotating photo after I land.</p>
            <p className="frame-spec">11 × 14 in frame · 7⅞ × 10½ in visible opening</p>
          </div>
          <figure className="frame-demo">
            <picture>
              <source media="(prefers-reduced-motion: reduce)" srcSet={frameBedroomStill} />
              <img
                src={frameBedroomCycle}
                alt="An accurate-scale mockup of an 11-by-14-inch e-paper frame cycling between flight posters and black-and-white photos in a bedroom"
                width="960"
                height="600"
                loading="lazy"
              />
            </picture>
            <figcaption>Bedroom mockup · flight mode and photo mode</figcaption>
          </figure>
        </section>

        <section className="process-section" id="about">
          <div className="section-heading">
            <h2>A small personal project.</h2>
            <p>I’m making this for one screen in my own home.</p>
          </div>
          <div className="process-list">
            {workflow.map(({ icon: Icon, title, body }, index) => (
              <article className="process-row" key={title}>
                <span className="process-number">0{index + 1}</span>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sources-section" id="credits">
          <div>
            <h2>Credits</h2>
            <p>Flight details come from my Flighty calendar. Airline branding is used only to identify the airline and aircraft shown in my personal itinerary.</p>
            <p className="project-disclaimer">Personal and non-commercial. This is not a product or service, and it is not affiliated with Flighty, Logostream, Iberia, or any airline.</p>
          </div>
          <p className="attribution">Airline branding via <a href="https://airline.logostream.dev/" target="_blank" rel="noreferrer">Logostream</a>.</p>
        </section>
      </main>

      <footer className="site-footer">
        <p>Personal, non-commercial experiment by <a href="https://www.hizach.com" target="_blank" rel="noreferrer">Zach Franzen</a>.</p>
        <p>Made for one frame at home.</p>
      </footer>

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
