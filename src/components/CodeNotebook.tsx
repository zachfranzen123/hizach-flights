import { useState } from 'react'

const snippets = {
  calendar: {
    label: '01 / CALENDAR PARSER',
    filename: 'worker.ts · flightIdentity()',
    code: `const route = summary.match(
  /\\b([A-Z]{3})\\b\\s*(?:→|->|TO)\\s*\\b([A-Z]{3})\\b/
)

const flight = summary.match(
  /(?:^|[•·|\\s])([A-Z0-9]{2})\\s*(\\d{1,4})\\b/
)

return {
  origin: route[1],
  destination: route[2],
  airlineIata: flight[1],
  flightNumber: flight[2],
}`,
  },
  equipment: {
    label: '02 / AIRCRAFT FALLBACK',
    filename: 'worker.ts · flightAwareEquipment()',
    code: `if (matching?.aircraft_type) {
  return {
    equipment: matching.aircraft_type,
    source: 'flightaware-assigned'
  }
}

const typical = Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])[0]

return {
  equipment: typical?.[0] ?? null,
  source: typical
    ? 'flightaware-typical'
    : 'not-yet-available'
}`,
  },
  artwork: {
    label: '03 / MISSING ARTWORK',
    filename: 'worker.ts · missingArtwork()',
    code: `const missing = flights.filter((flight) => {
  const code = flight.equipment?.code
  return code && !artworkByAirline
    [flight.airlineIata]?.has(code)
})

if (missing.length) {
  await sendMissingArtworkAlert(env)
  // One email per airline / aircraft pair
  // cached for 30 days
}`,
  },
} as const

type SnippetKey = keyof typeof snippets

export function CodeNotebook() {
  const [selected, setSelected] = useState<SnippetKey>('calendar')
  const snippet = snippets[selected]

  return (
    <div className="code-notebook">
      <div className="code-tabs" role="tablist" aria-label="Project code examples">
        {(Object.keys(snippets) as SnippetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected === key}
            className={selected === key ? 'is-selected' : ''}
            onClick={() => setSelected(key)}
          >
            {snippets[key].label}
          </button>
        ))}
      </div>
      <div className="code-window">
        <p className="code-filename">{snippet.filename}</p>
        <pre><code>{snippet.code}</code></pre>
      </div>
    </div>
  )
}
