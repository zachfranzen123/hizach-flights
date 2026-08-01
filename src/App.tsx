import { useEffect, useState } from 'react'
import { CalendarDays, FileImage, Frame, LockKeyhole } from 'lucide-react'
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
    title: 'Flighty calendar',
    body: 'Upcoming flights arrive through a private calendar feed.',
  },
  {
    icon: FileImage,
    title: 'Poster engine',
    body: 'Flight number and aircraft type become one quiet piece of art.',
  },
  {
    icon: Frame,
    title: 'E-paper display',
    body: 'The approved poster will refresh on a dedicated 13.3-inch frame.',
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
        <a className="site-brand" href="#top">HIZACH / FLIGHTS</a>
        <nav aria-label="Primary navigation">
          <a href="#poster">Poster</a>
          <a href="#how-it-works">How it works</a>
          <a href="#sources">Sources</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" id="poster">
          <div className="hero-copy">
            <h1>The next<br />flight, framed.</h1>
            <p className="hero-intro">A living e-paper poster built from my Flighty calendar.</p>
            <button className="primary-action" type="button" onClick={() => setDisplayOpen(true)}>
              <LockKeyhole aria-hidden="true" />
              Open private display
            </button>
            <p className="hardware-note">Built for a 13.3-inch color e-paper frame.</p>
            <PaletteControl palettes={palettes} selected={paletteIndex} onSelect={setPaletteIndex} />
          </div>

          <div className="poster-shell">
            <p className="sample-label">Sample poster · live calendar connection coming next</p>
            <div className="poster-frame">
              <FlightPoster flight={sampleFlight} palette={palette} />
            </div>
          </div>
        </section>

        <section className="process-section" id="how-it-works">
          <div className="section-heading">
            <h2>How it works</h2>
            <p>One flight in. One poster out.</p>
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

        <section className="sources-section" id="sources">
          <div>
            <h2>Sources</h2>
            <p>Flight details originate in Flighty’s calendar export. Aircraft type data and final artwork integrations will be added behind the private display.</p>
          </div>
          <p className="attribution">Airline branding via <a href="https://airline.logostream.dev/" target="_blank" rel="noreferrer">Logostream</a>.</p>
        </section>
      </main>

      <footer className="site-footer">
        <p>Personal experiment by <a href="https://www.hizach.com" target="_blank" rel="noreferrer">Zach Franzen</a>.</p>
        <p>Designed for flights.hizach.com</p>
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
