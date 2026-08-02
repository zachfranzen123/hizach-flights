import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Cloud,
  Cpu,
  Database,
  Frame,
  Image,
  Mail,
  Plane,
  Radio,
  Wifi,
} from 'lucide-react'
import frameBedroomCycle from '../assets/demo/frame-bedroom-cycle.gif'
import frameBedroomStill from '../assets/demo/frame-bedroom-still.jpg'
import firstPoster from '../assets/journal/first-poster.webp'
import flightJson from '../assets/journal/flight-json.webp'
import flightyCalendar from '../assets/journal/flighty-calendar.webp'
import lifestyleTriptych from '../assets/journal/lifestyle-triptych.webp'
import matboardOrder from '../assets/journal/matboard-order.webp'
import r2Bucket from '../assets/journal/r2-bucket.webp'
import type { Flight } from '../data/sampleFlight'
import { CodeNotebook } from './CodeNotebook'
import { FlightPoster, type PosterPalette } from './FlightPoster'

type ProjectJournalProps = {
  onOpenDisplay: () => void
  posterFlight: Flight
  palette: PosterPalette
}

const pipeline = [
  { label: 'Flighty', detail: 'calendar', icon: CalendarDays },
  { label: 'Cloudflare', detail: 'worker', icon: Cloud },
  { label: 'FlightAware', detail: 'aircraft', icon: Radio },
  { label: 'Logostream', detail: 'tail mark', icon: Plane },
  { label: 'The poster', detail: 'render', icon: Frame },
]

const projectRules = [
  ['01', 'Show flight mode a few hours before departure.'],
  ['02', 'Keep it on through a tight or immediate connection.'],
  ['03', 'After landing, return to photos when no connection is coming.'],
  ['04', 'Prefer the assigned aircraft; otherwise show the typical historical type and label it.'],
  ['05', 'Email me when artwork is missing—never leave a blank aircraft stage.'],
]

const hardware = [
  {
    number: '01',
    title: 'Display',
    name: 'Seeed Studio 13.3-inch Spectra 6 color ePaper',
    note: 'The physical screen. Ordered.',
    icon: Frame,
  },
  {
    number: '02',
    title: 'Controller',
    name: 'XIAO ePaper Display Board EE02',
    note: 'ESP32-S3 with Wi-Fi and BLE. Ordered.',
    icon: Cpu,
  },
  {
    number: '03',
    title: 'Frame',
    name: '11 × 14 frame + custom white matboard',
    note: '7⅞ × 10½-inch visible opening. Ordered.',
    icon: Image,
  },
]

const showcasePalettes: PosterPalette[] = [
  {
    name: 'Island ochre',
    background: '#d9a126',
    foreground: '#17140c',
    muted: '#514319',
    decoration: {
      flowerPrimary: '#a9342b',
      flowerSecondary: '#fff1c2',
      flowerCenter: '#6a3a24',
      foliage: '#244c3e',
      leafVein: '#a9c09a',
      bridge: '#7b2e29',
      fog: '#fff1c2',
    },
  },
  {
    name: 'Homecoming',
    background: '#164b91',
    foreground: '#fffdf5',
    muted: '#d9e5f4',
    decoration: {
      flowerPrimary: '#e95d4f',
      flowerSecondary: '#fff0c2',
      flowerCenter: '#e4b536',
      foliage: '#173f35',
      leafVein: '#7fa98a',
      bridge: '#f2b7a5',
      fog: '#d9e5f4',
    },
  },
  {
    name: 'Aviation blue',
    background: '#164b91',
    foreground: '#fffdf5',
    muted: '#d9e5f4',
    decoration: {
      flowerPrimary: '#e95d4f',
      flowerSecondary: '#fff0c2',
      flowerCenter: '#e4b536',
      foliage: '#173f35',
      leafVein: '#7fa98a',
      bridge: '#f2b7a5',
      fog: '#d9e5f4',
    },
  },
]

type LifestyleMockupProps = {
  scene: 'bedroom' | 'entry' | 'reading'
  label: string
  behavior: string
  flight: Flight
  palette: PosterPalette
}

function LifestyleMockup({ scene, label, behavior, flight, palette }: LifestyleMockupProps) {
  return (
    <article className="lifestyle-card">
      <div
        className={`lifestyle-scene lifestyle-scene-${scene}`}
        style={{ '--lifestyle-sheet': `url(${lifestyleTriptych})` } as React.CSSProperties}
      >
        <div className="physical-frame" aria-label="Accurate-scale 11 by 14 inch frame mockup">
          <div className="physical-mat">
            <div className="physical-opening">
              <FlightPoster flight={flight} palette={palette} />
            </div>
          </div>
        </div>
      </div>
      <div className="lifestyle-caption">
        <p>{label}</p>
        <span>{behavior}</span>
      </div>
    </article>
  )
}

export function ProjectJournal({ onOpenDisplay, posterFlight, palette }: ProjectJournalProps) {
  const hawaiiFlight: Flight = {
    ...posterFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '877',
    origin: 'SFO', originCity: 'San Francisco', destination: 'HNL', destinationCity: 'Honolulu',
    departureDate: '12 AUG 2026', departureTime: '09:15 PDT', arrivalTime: '11:42 HST',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738', tailUrl: undefined, overlayVariant: 1,
  }
  const sfoFlight: Flight = {
    ...posterFlight,
    airline: 'Alaska Airlines', airlineIata: 'AS', airlineIcao: 'ASA', flightNumber: '655',
    origin: 'SEA', originCity: 'Seattle', destination: 'SFO', destinationCity: 'San Francisco',
    departureDate: '01 AUG 2026', departureTime: '10:47 PDT', arrivalTime: '12:58 PDT',
    aircraftName: 'Boeing 737-800', aircraftCode: 'B738', tailUrl: undefined, overlayVariant: 0,
  }
  const classicFlight: Flight = { ...posterFlight, tailUrl: undefined }

  return (
    <>
      <header className="journal-header">
        <a className="journal-brand" href="#top" aria-label="Zach Flights project home">
          <span>ZF</span>
          ZACH / FLIGHTS
        </a>
        <nav aria-label="Project sections">
          <a href="#idea">The idea</a>
          <a href="#system">How it works</a>
          <a href="#build">Build log</a>
          <button type="button" onClick={onOpenDisplay}>Live display ↗</button>
        </nav>
      </header>

      <main id="top" className="journal-main">
        <section className="journal-hero">
          <div className="journal-hero-copy">
            <p className="journal-eyebrow">A PERSONAL HARDWARE + SOFTWARE PROJECT</p>
            <h1>Building a flight poster that knows where I’m going.</h1>
            <p className="journal-dek">I’m a flight attendant and aviation geek building one living e-paper frame for home. It turns my upcoming trips into aviation art—and lets my household see where in the world I am.</p>
            <div className="journal-actions">
              <button className="journal-primary" type="button" onClick={onOpenDisplay}>
                View the live display <ArrowRight aria-hidden="true" />
              </button>
              <a href="#idea">Start at the beginning <ArrowDown aria-hidden="true" /></a>
            </div>
            <div className="journal-status">
              <span>NOW</span>
              <p><i aria-hidden="true" /> Panel, controller &amp; matboard ordered</p>
            </div>
          </div>

          <div className="journal-hero-visual">
            <figure className="journal-room-image">
              <img src={frameBedroomStill} alt="Accurate-scale bedroom mockup of the flight frame" width="960" height="600" />
              <figcaption>01 / THE FRAME AT HOME — MOCKUP</figcaption>
            </figure>
            <div className="journal-poster-sample" aria-label="Current working flight poster preview">
              <FlightPoster flight={posterFlight} palette={palette} />
            </div>
            <p className="annotation annotation-panel">13.3″ SPECTRA 6<br />COLOR E-PAPER</p>
            <p className="annotation annotation-frame">11 × 14 FRAME<br />7⅞ × 10½ OPENING</p>
          </div>
        </section>

        <section className="journal-section story-section" id="idea">
          <div className="section-index">01</div>
          <div className="journal-section-heading">
            <p className="journal-eyebrow">THE IDEA</p>
            <h2>A creative way to bring my trips home.</h2>
            <p>I spend a lot of time in airplanes and a lot of time thinking about them. I wanted an object at home that felt more like aviation art than a flight tracker: visually appealing, personal, and useful to the people who want to know where I am.</p>
          </div>
          <div className="story-grid">
            <div className="story-notes">
              <blockquote>“Where am I flying next—and how can that information become something beautiful?”</blockquote>
              <p>The poster is aviation artwork first: one flight, the aircraft I’ll likely be working or riding on, a bold field of color, and destination details. Behind it, live data quietly keeps everything accurate. After I land, the frame returns to photographs instead of becoming another blank screen.</p>
              <figure className="document-shot first-poster-shot">
                <img src={firstPoster} alt="Early blue Iberia flight poster prototype" width="760" height="1054" loading="lazy" />
                <figcaption><span>ITERATION 01</span> The first live poster</figcaption>
              </figure>
            </div>
            <figure className="document-shot calendar-shot">
              <img src={flightyCalendar} alt="Flighty-synced Google Calendar event supplying the itinerary behind a poster" width="1400" height="995" loading="lazy" />
              <figcaption><span>BEHIND THE ART</span> Flighty keeps the itinerary current</figcaption>
            </figure>
          </div>
        </section>

        <section className="journal-section lifestyle-section" id="in-the-room">
          <div className="section-index">02</div>
          <div className="journal-section-heading split-heading">
            <div>
              <p className="journal-eyebrow">THE DISPLAY IN REAL LIFE</p>
              <h2>One frame. A different mood for every trip.</h2>
            </div>
            <p>The frame remains physically honest in every scene: 11 × 14 inches, with a 7⅞ × 10½-inch visible opening. Only the digital artwork changes.</p>
          </div>

          <div className="lifestyle-grid">
            <LifestyleMockup
              scene="bedroom"
              label="SFO → HNL · ISLAND OCHRE"
              behavior="Hawai‘i trips add bold plumeria, hibiscus and tropical foliage tuned for the six-color screen."
              flight={hawaiiFlight}
              palette={showcasePalettes[0]}
            />
            <LifestyleMockup
              scene="entry"
              label="SEA → SFO · HOMECOMING"
              behavior="Arrivals into my home airport switch to a rotating Golden Gate background treatment."
              flight={sfoFlight}
              palette={showcasePalettes[1]}
            />
            <LifestyleMockup
              scene="reading"
              label="SFO → MAD · AVIATION BLUE"
              behavior="Everywhere else uses the quieter poster system: aircraft, route and a strong field of color."
              flight={classicFlight}
              palette={showcasePalettes[2]}
            />
          </div>

          <div className="scale-note" aria-label="Physical frame dimensions">
            <span>TRUE PROPORTIONS</span>
            <p><b>11 × 14″</b> outside frame</p>
            <i aria-hidden="true" />
            <p><b>7⅞ × 10½″</b> visible display</p>
            <i aria-hidden="true" />
            <p><b>3:4</b> live poster ratio</p>
          </div>
        </section>

        <section className="journal-section system-section" id="system">
          <div className="section-index">03</div>
          <div className="journal-section-heading split-heading">
            <div>
              <p className="journal-eyebrow">THE SOFTWARE</p>
              <h2>How an upcoming trip becomes a poster.</h2>
            </div>
            <p>The browser never sees private credentials. A Cloudflare Worker fetches and interprets the calendar, enriches the flight, proxies licensed airline marks, and returns only the display data.</p>
          </div>

          <div className="pipeline" aria-label="Flight data pipeline">
            {pipeline.map(({ label, detail, icon: Icon }, index) => (
              <div className="pipeline-item" key={label}>
                <div className="pipeline-node">
                  <Icon aria-hidden="true" />
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </div>
                {index < pipeline.length - 1 && <ArrowRight className="pipeline-arrow" aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className="integration-grid">
            <article>
              <span>01 / SCHEDULE</span>
              <h3>Flighty calendar</h3>
              <p>The ICS feed supplies the route, flight number and local timing. It remains the source of truth for which trips belong to me.</p>
            </article>
            <article>
              <span>02 / ENRICH</span>
              <h3>FlightAware AeroAPI</h3>
              <p>When an aircraft is assigned, that wins. Before assignment, recent route history supplies a clearly labeled typical aircraft instead.</p>
            </article>
            <article>
              <span>03 / IDENTIFY</span>
              <h3>Logostream</h3>
              <p>The airline tail mark is requested through the Worker with my community key. Attribution stays visible and the key stays private.</p>
            </article>
            <article>
              <span>04 / REMEMBER</span>
              <h3>R2 + Resend</h3>
              <p>R2 holds my personal photo rotation. Resend alerts me once when a new airline-and-aircraft artwork combination is missing.</p>
            </article>
          </div>

          <figure className="json-strip">
            <img src={flightJson} alt="Raw JSON returned by the private current-flight endpoint" width="1396" height="150" loading="lazy" />
            <figcaption>THE HANDOFF — a small, private JSON response becomes the visual poster</figcaption>
          </figure>

          <CodeNotebook />
        </section>

        <section className="journal-section rules-section">
          <div className="section-index">04</div>
          <div className="rules-layout">
            <div className="journal-section-heading">
              <p className="journal-eyebrow">THE AUTOMATION RULES</p>
              <h2>The frame should know when to become useful.</h2>
              <p className="testing-label"><Clock3 aria-hidden="true" /> Designed now · hardware testing next</p>
            </div>
            <ol className="rules-list">
              {projectRules.map(([number, rule]) => (
                <li key={number}><span>{number}</span><p>{rule}</p></li>
              ))}
            </ol>
          </div>
          <div className="logic-diagram" aria-label="Display mode decision logic">
            <div><Clock3 aria-hidden="true" /><span>NEXT FLIGHT<br /><b>≤ LEAD WINDOW?</b></span></div>
            <ArrowRight aria-hidden="true" />
            <div className="logic-flight"><Plane aria-hidden="true" /><span>YES<br /><b>FLIGHT MODE</b></span></div>
            <ArrowRight aria-hidden="true" />
            <div><CalendarDays aria-hidden="true" /><span>LANDED +<br /><b>NO CONNECTION?</b></span></div>
            <ArrowRight aria-hidden="true" />
            <div className="logic-photo"><Image aria-hidden="true" /><span>YES<br /><b>PHOTO MODE</b></span></div>
          </div>
        </section>

        <section className="journal-section build-section" id="build">
          <div className="section-index">05</div>
          <div className="journal-section-heading split-heading">
            <div>
              <p className="journal-eyebrow">BUILD LOG</p>
              <h2>Iterations, not a product roadmap.</h2>
            </div>
            <p>This is one personal frame, built in public. Each version answers the next practical question: can I trust the data, recognize the aircraft, enjoy the poster, and live with it on the wall?</p>
          </div>

          <div className="build-timeline">
            <article>
              <time>JUL 31</time>
              <h3>From sample to live data</h3>
              <ul>
                <li><Check /> First Iberia poster online</li>
                <li><Check /> Flighty calendar connected</li>
                <li><Check /> FlightAware + Logostream added</li>
                <li><Check /> flights.hizach.com launched</li>
              </ul>
            </article>
            <article>
              <time>AUG 01</time>
              <h3>From website to object</h3>
              <ul>
                <li><Check /> Destination art experiments</li>
                <li><Check /> Private R2 photo portal</li>
                <li><Check /> Missing-artwork email alerts</li>
                <li><Check /> Panel, board, frame + mat ordered</li>
              </ul>
            </article>
            <article className="timeline-next">
              <time>NEXT</time>
              <h3>The hardware bench</h3>
              <ul>
                <li><Clock3 /> Connect the EE02 and panel</li>
                <li><Clock3 /> Tune the Spectra 6 palette</li>
                <li><Clock3 /> Test automatic mode changes</li>
                <li><Clock3 /> Fit it behind the matboard</li>
              </ul>
            </article>
          </div>

          <div className="media-wall">
            <figure className="media-wall-room">
              <picture>
                <source media="(prefers-reduced-motion: reduce)" srcSet={frameBedroomStill} />
                <img src={frameBedroomCycle} alt="Bedroom mockup cycling between a flight poster and monochrome photos" width="960" height="600" loading="lazy" />
              </picture>
              <figcaption>FLIGHT MODE ↔ PHOTO MODE — CONCEPT MOCKUP</figcaption>
            </figure>
            <figure className="media-wall-r2">
              <img src={r2Bucket} alt="The private Cloudflare R2 photo bucket setup" width="900" height="1186" loading="lazy" />
              <figcaption>MY PRIVATE PHOTO BUCKET</figcaption>
            </figure>
            <div className="media-note">
              <Image aria-hidden="true" />
              <h3>Photo mode matters.</h3>
              <p>A flight poster is useful for a few hours. The rest of the time, the frame should quietly rotate through my own photographs.</p>
              <a href="/photos">Open the private photo portal ↗</a>
            </div>
          </div>
        </section>

        <section className="journal-section hardware-section">
          <div className="section-index">06</div>
          <div className="journal-section-heading split-heading">
            <div>
              <p className="journal-eyebrow">THE PHYSICAL BUILD</p>
              <h2>The physical build is now real.</h2>
            </div>
            <p>These are the parts I actually settled on and ordered—not a hypothetical shopping list.</p>
          </div>

          <div className="hardware-grid">
            {hardware.map(({ number, title, name, note, icon: Icon }) => (
              <article key={number}>
                <div><span>{number}</span><Icon aria-hidden="true" /></div>
                <p>{title}</p>
                <h3>{name}</h3>
                <small><i aria-hidden="true" /> {note}</small>
              </article>
            ))}
          </div>

          <div className="hardware-detail">
            <figure className="document-shot matboard-shot">
              <img src={matboardOrder} alt="Custom 11-by-14-inch matboard configurator with the screen opening" width="900" height="1398" loading="lazy" />
              <figcaption><span>ORDERED</span> The custom matboard setup</figcaption>
            </figure>
            <div className="wiring-note">
              <p className="journal-eyebrow">THE SIGNAL PATH</p>
              <div className="wiring-diagram">
                <span>13.3″<br /><b>PANEL</b></span><ArrowRight /><span>FPC<br /><b>CABLE</b></span><ArrowRight /><span>EE02<br /><b>BOARD</b></span><Wifi /><span>PRIVATE<br /><b>DISPLAY URL</b></span>
              </div>
              <h3>What happens when the box arrives</h3>
              <ol>
                <li><span>1</span> Bench-test the panel and controller.</li>
                <li><span>2</span> Render the poster at native resolution and tune it for six-color e-paper.</li>
                <li><span>3</span> Let the EE02 fetch the private display endpoint over Wi-Fi.</li>
                <li><span>4</span> Implement the flight/photo mode rules on the device.</li>
                <li><span>5</span> Fit, cable-manage, hang—and document what fails.</li>
              </ol>
              <a className="text-link" href="https://wiki.seeedstudio.com/getting_started_with_ee02/" target="_blank" rel="noreferrer">Read the official EE02 setup guide ↗</a>
            </div>
          </div>
        </section>

        <section className="journal-cta">
          <p className="journal-eyebrow">FOLLOW ALONG</p>
          <h2>The website is the build notebook.</h2>
          <p>I’ll keep adding the parts that work, the visual experiments that don’t, and the final assembly once the Seeed panel and EE02 arrive.</p>
          <button className="journal-primary" type="button" onClick={onOpenDisplay}>See what is working now <ArrowRight /></button>
        </section>

        <section className="journal-credits" id="credits">
          <div>
            <h2>Sources &amp; credits</h2>
            <p>Flight details come from my private Flighty calendar and are enriched with FlightAware AeroAPI. Airline marks are supplied by Logostream under its community license. Hardware documentation comes from Seeed Studio.</p>
          </div>
          <div>
            <a href="https://www.flighty.com/" target="_blank" rel="noreferrer">Flighty ↗</a>
            <a href="https://www.flightaware.com/aeroapi/" target="_blank" rel="noreferrer">FlightAware ↗</a>
            <a href="https://airline.logostream.dev/" target="_blank" rel="noreferrer">Logostream ↗</a>
            <a href="https://wiki.seeedstudio.com/getting_started_with_ee02/" target="_blank" rel="noreferrer">Seeed Studio ↗</a>
          </div>
          <p className="project-disclaimer">Personal and non-commercial. This is not a product or service and is not affiliated with Flighty, FlightAware, Logostream, Seeed Studio, Iberia, Alaska Airlines, or any airline.</p>
        </section>
      </main>

      <footer className="journal-footer">
        <p>A one-frame experiment by <a href="https://www.hizach.com" target="_blank" rel="noreferrer">Zach Franzen</a>.</p>
        <p><Database aria-hidden="true" /> Built on Cloudflare Workers + R2 <Mail aria-hidden="true" /> Alerts by Resend</p>
      </footer>
    </>
  )
}
