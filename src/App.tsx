import { useEffect, useState } from 'react'
import { CalendarDays, Frame, Plane } from 'lucide-react'
import { DisplayDialog } from './components/DisplayDialog'
import { FlightPoster, type PosterPalette } from './components/FlightPoster'
import { PaletteControl } from './components/PaletteControl'
import { sampleFlight } from './data/sampleFlight'

const palettes: PosterPalette[] = [
  { name: 'Aviation blue', background: '#164b91', foreground: '#fffdf5', muted: '#d9e5f4' },
  { name: 'Ochre', background: '#d9a126', foreground: '#17140c', muted: '#514319' },
  { name: 'Signal red', background: '#bf3e32', foreground: '#fffaf1', muted: '#f4d7ce' },
  { name: 'Forest', background: '#35664e', foreground: '#fffdf5', muted: '#d7e8dc' },
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
    body: 'Eventually this page will live on a 13.3-inch color e-paper frame in my home.',
  },
]

function App() {
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [displayOpen, setDisplayOpen] = useState(false)
  const palette = palettes[paletteIndex]

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
              <FlightPoster flight={sampleFlight} palette={palette} />
            </div>
          </div>
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
        flight={sampleFlight}
        palette={palette}
      />
    </>
  )
}

export default App
