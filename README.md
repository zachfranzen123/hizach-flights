# HiZach / Flights

A personal, non-commercial project for `flights.hizach.com`. It turns my next Flighty calendar event into a portrait-format poster for a future 13.3-inch, 1200 × 1600 color e-paper frame in my home.

## Included

- Public attribution/companion page
- Responsive sample poster for Iberia IB356, SFO → MAD
- Four flat, e-paper-friendly background palettes
- Fullscreen display preview
- Source-independent React components ready for calendar and API data

## Run locally

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```

## Planned private integrations

The deployed project will use encrypted server-side environment values. Never expose them in browser JavaScript.

- `FLIGHTY_CALENDAR_ICS_URL`
- `LOGOSTREAM_API_KEY`
- `FLIGHTAWARE_AEROAPI_KEY`
- `RESEND_API_KEY`
- `ARTWORK_ALERT_TO`

The Worker checks upcoming flights daily at 17:00 UTC. If an assigned or typical
aircraft does not have matching airline artwork, it sends a deduplicated email
from `flight-alerts@hizach.com`. The authenticated `POST /api/test-artwork-alert`
route can be used to test the notification on demand.

The public root should remain a sample/attribution page. Real itinerary data belongs behind an authenticated or unguessable private display endpoint.

## Recommended next implementation step

Deploy this static prototype first, then add a small server-side route that:

1. Reads the private Flighty calendar feed.
2. Extracts the next flight number, route, and schedule.
3. Resolves the aircraft equipment from a flight-status provider.
4. Selects the matching aircraft template and Logostream airline branding.
5. Returns only the finished poster data to the private display URL.

The calendar URL and API keys should be configured as hosting secrets, never committed to this project.

## Artwork note

The included Iberia aircraft is temporary concept artwork generated for this prototype. Replace it with the final aircraft-template and licensed airline-brand composite before production use.
