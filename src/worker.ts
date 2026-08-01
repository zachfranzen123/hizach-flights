/// <reference types="@cloudflare/workers-types" />

type Env = {
  ASSETS: Fetcher
  DISPLAY_ACCESS_TOKEN: string
  FLIGHTY_CALENDAR_ICS_URL: string
  FLIGHTAWARE_AEROAPI_KEY: string
  LOGOSTREAM_API_KEY: string
}

type FlightEquipment = {
  code: string
  name: string
}

type ParsedCalendarEvent = {
  summary: string
  description: string
  location: string
  start: Date
  end: Date
}

type FlightAwareFlight = {
  aircraft_type?: string | null
  registration?: string | null
  scheduled_out?: string | null
  scheduled_off?: string | null
  origin?: { code_iata?: string | null; code?: string | null }
  destination?: { code_iata?: string | null; code?: string | null }
}

const MAX_CALENDAR_BYTES = 1_000_000
const MAX_UNLOCK_BYTES = 4_096

const airlineIcaoByIata: Record<string, string> = {
  AF: 'AFR',
  AS: 'ASA',
  IB: 'IBE',
}

const airlineNameByIata: Record<string, string> = {
  AF: 'Air France',
  AS: 'Alaska Airlines',
  IB: 'Iberia',
}

const equipmentByFlight: Record<string, FlightEquipment> = {
  IB356: { code: 'A332', name: 'Airbus A330-200' },
}

const equipmentNameByIcao: Record<string, string> = {
  A319: 'Airbus A319',
  A320: 'Airbus A320',
  A321: 'Airbus A321',
  A332: 'Airbus A330-200',
  A333: 'Airbus A330-300',
  A359: 'Airbus A350-900',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B737: 'Boeing 737-700',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900ER',
  B789: 'Boeing 787-9',
  CRJX: 'Bombardier CRJ-1000',
  E75L: 'Embraer 175',
}

function noStoreHeaders(extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra)
  headers.set('Cache-Control', 'no-store')
  return headers
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: noStoreHeaders() })
}

async function timingSafeTokenMatch(candidate: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const candidateBytes = new Uint8Array(candidateHash)
  const expectedBytes = new Uint8Array(expectedHash)
  let difference = 0
  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= candidateBytes[index] ^ expectedBytes[index]
  }
  return difference === 0
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie')
  if (!cookie) return null

  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    if (part.slice(0, separator).trim() !== name) continue
    return decodeURIComponent(part.slice(separator + 1).trim())
  }

  return null
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get('Authorization')
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null
  const candidate = bearer ?? cookieValue(request, 'hizach_display')
  if (!candidate || !env.DISPLAY_ACCESS_TOKEN) return false
  return timingSafeTokenMatch(candidate, env.DISPLAY_ACCESS_TOKEN)
}

async function readTextLimited(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get('Content-Length') ?? 0)
  if (declaredLength > maxBytes) throw new Error('Response is too large')
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('Response is too large')
    }
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

function decodeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function propertyLine(block: string, propertyName: string): string | null {
  const prefix = `${propertyName.toUpperCase()}`
  return block
    .split('\n')
    .find((line) => {
      const upper = line.toUpperCase()
      return upper.startsWith(`${prefix}:`) || upper.startsWith(`${prefix};`)
    }) ?? null
}

function propertyValue(block: string, propertyName: string): string {
  const line = propertyLine(block, propertyName)
  if (!line) return ''
  const separator = line.indexOf(':')
  return separator === -1 ? '' : decodeIcsText(line.slice(separator + 1))
}

function zonedDate(parts: number[], timeZone: string): Date {
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts
  const initial = Date.UTC(year, month - 1, day, hour, minute, second)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const displayed = Object.fromEntries(
    formatter
      .formatToParts(new Date(initial))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  )
  const displayedAsUtc = Date.UTC(
    displayed.year,
    displayed.month - 1,
    displayed.day,
    displayed.hour,
    displayed.minute,
    displayed.second,
  )
  return new Date(initial - (displayedAsUtc - initial))
}

function parseIcsDate(line: string | null): Date | null {
  if (!line) return null
  const separator = line.indexOf(':')
  if (separator === -1) return null

  const metadata = line.slice(0, separator)
  const value = line.slice(separator + 1).trim()
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!match) return null

  const parts = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  ]

  if (match[7] === 'Z' || !match[4]) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
  }

  const timeZone = metadata.match(/TZID=([^;:]+)/i)?.[1]
  if (timeZone) {
    try {
      return zonedDate(parts, timeZone)
    } catch {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
    }
  }

  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
}

export function parseCalendar(ics: string): ParsedCalendarEvent[] {
  const unfolded = ics.replace(/\r?\n[ \t]/g, '').replace(/\r\n/g, '\n')
  return unfolded
    .split('BEGIN:VEVENT')
    .slice(1)
    .map((chunk) => chunk.split('END:VEVENT')[0])
    .map((block) => {
      const start = parseIcsDate(propertyLine(block, 'DTSTART'))
      const end = parseIcsDate(propertyLine(block, 'DTEND')) ?? start
      if (!start || !end) return null
      return {
        summary: propertyValue(block, 'SUMMARY'),
        description: propertyValue(block, 'DESCRIPTION'),
        location: propertyValue(block, 'LOCATION'),
        start,
        end,
      }
    })
    .filter((event): event is ParsedCalendarEvent => event !== null)
}

export function flightIdentity(event: ParsedCalendarEvent) {
  const summary = event.summary.toUpperCase()
  const searchable = `${summary}\n${event.description.toUpperCase()}`
  const route =
    summary.match(/\b([A-Z]{3})\b\s*(?:→|➞|⟶|->|–|—|\/|TO)\s*\b([A-Z]{3})\b/) ??
    summary.match(/\b([A-Z]{3})\b\s*[^A-Z0-9\n]{1,6}\s*\b([A-Z]{3})\b/)
  const flight =
    summary.match(/(?:^|[•·|\s])([A-Z0-9]{2})\s*[- ]?\s*(\d{1,4})\b/) ??
    searchable.match(/\b(IB|AS|AF)\s*[- ]?\s*(\d{1,4})\b/)
  if (!route || !flight) return null

  const airlineIata = flight[1]
  const flightNumber = flight[2]
  return {
    origin: route[1],
    destination: route[2],
    airlineIata,
    airlineIcao: airlineIcaoByIata[airlineIata] ?? airlineIata,
    airlineName: airlineNameByIata[airlineIata] ?? airlineIata,
    flightNumber,
  }
}

async function calendarEvents(env: Env): Promise<ParsedCalendarEvent[]> {
  const calendarResponse = await fetch(env.FLIGHTY_CALENDAR_ICS_URL, {
    headers: { Accept: 'text/calendar' },
  })
  if (!calendarResponse.ok) throw new Error(`Calendar returned ${calendarResponse.status}`)

  const calendarText = await readTextLimited(calendarResponse, MAX_CALENDAR_BYTES)
  return parseCalendar(calendarText)
}

async function flightAwareEquipment(
  identity: NonNullable<ReturnType<typeof flightIdentity>>,
  event: ParsedCalendarEvent,
  env: Env,
): Promise<{
  equipment: FlightEquipment | null
  registration: string | null
  source: 'flightaware-assigned' | 'flightaware-typical' | 'not-yet-available'
  evidence: { matchingCount: number; totalCount: number } | null
}> {
  if (!env.FLIGHTAWARE_AEROAPI_KEY) {
    return { equipment: null, registration: null, source: 'not-yet-available', evidence: null }
  }

  const ident = `${identity.airlineIcao}${identity.flightNumber}`
  const cacheKey = new Request(`https://flightaware-cache.invalid/${ident}`)
  const cache = (caches as CacheStorage & { default: Cache }).default
  let response = await cache.match(cacheKey)

  if (!response) {
    response = await fetch(`https://aeroapi.flightaware.com/aeroapi/flights/${ident}?ident_type=designator&max_pages=1`, {
      headers: {
        Accept: 'application/json',
        'x-apikey': env.FLIGHTAWARE_AEROAPI_KEY,
      },
    })

    if (!response.ok) {
      console.error(JSON.stringify({ event: 'flightaware_error', ident, status: response.status }))
      return { equipment: null, registration: null, source: 'not-yet-available', evidence: null }
    }

    response = new Response(response.body, response)
    response.headers.set('Cache-Control', 'public, max-age=21600')
    await cache.put(cacheKey, response.clone())
  }

  const data = await response.json() as { flights?: FlightAwareFlight[] }
  const routeFlights = (data.flights ?? []).filter((candidate) => {
    const origin = candidate.origin?.code_iata ?? candidate.origin?.code
    const destination = candidate.destination?.code_iata ?? candidate.destination?.code
    return (!origin || origin === identity.origin)
      && (!destination || destination === identity.destination)
  })
  const matching = routeFlights
    .map((candidate) => ({
      candidate,
      departure: new Date(candidate.scheduled_out ?? candidate.scheduled_off ?? 0).getTime(),
    }))
    .filter(({ departure }) => {
      return Number.isFinite(departure)
        && Math.abs(departure - event.start.getTime()) <= 36 * 60 * 60 * 1000
    })
    .sort((a, b) => Math.abs(a.departure - event.start.getTime()) - Math.abs(b.departure - event.start.getTime()))[0]?.candidate

  const assignedCode = matching?.aircraft_type?.toUpperCase() ?? null
  if (assignedCode) {
    return {
      equipment: { code: assignedCode, name: equipmentNameByIcao[assignedCode] ?? assignedCode },
      registration: matching?.registration ?? null,
      source: 'flightaware-assigned',
      evidence: null,
    }
  }

  const typeCounts = routeFlights.reduce<Record<string, number>>((counts, candidate) => {
    const code = candidate.aircraft_type?.toUpperCase()
    if (code) counts[code] = (counts[code] ?? 0) + 1
    return counts
  }, {})
  const typical = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
  if (!typical) {
    return { equipment: null, registration: null, source: 'not-yet-available', evidence: null }
  }

  const [typicalCode, matchingCount] = typical
  return {
    equipment: { code: typicalCode, name: equipmentNameByIcao[typicalCode] ?? typicalCode },
    registration: null,
    source: 'flightaware-typical',
    evidence: { matchingCount, totalCount: routeFlights.filter((flight) => flight.aircraft_type).length },
  }
}

async function upcomingFlights(env: Env) {
  const now = Date.now()
  const upcoming = (await calendarEvents(env))
    .filter((event) => event.end.getTime() >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((event) => ({ event, identity: flightIdentity(event) }))
    .filter((item): item is { event: ParsedCalendarEvent; identity: NonNullable<ReturnType<typeof flightIdentity>> } => item.identity !== null)

  return Promise.all(upcoming.map(async ({ event, identity }) => {
    const manualEquipment = equipmentByFlight[`${identity.airlineIata}${identity.flightNumber}`] ?? null
    const live = manualEquipment
      ? { equipment: manualEquipment, registration: null, source: 'manual-override' as const, evidence: null }
      : await flightAwareEquipment(identity, event, env)

    return {
      ...identity,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      location: event.location,
      equipment: live.equipment,
      registration: live.registration,
      equipmentSource: live.source,
      equipmentEvidence: live.evidence,
      tailUrl: `/api/airline-tail/${identity.airlineIcao}`,
    }
  }))
}

async function nextFlight(env: Env) {
  return (await upcomingFlights(env))[0] ?? null
}

async function handleUnlock(request: Request, env: Env): Promise<Response> {
  let input: { token?: string }
  try {
    const text = await readTextLimited(new Response(request.body), MAX_UNLOCK_BYTES)
    input = JSON.parse(text) as { token?: string }
  } catch {
    return jsonError('Invalid request', 400)
  }

  if (!input.token || !(await timingSafeTokenMatch(input.token, env.DISPLAY_ACCESS_TOKEN))) {
    return jsonError('Invalid display token', 401)
  }

  const cookie = `hizach_display=${encodeURIComponent(input.token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  return Response.json(
    { ok: true },
    { headers: noStoreHeaders({ 'Set-Cookie': cookie }) },
  )
}

async function handleTail(icao: string, env: Env): Promise<Response> {
  if (!/^[A-Z0-9]{3}$/.test(icao)) return jsonError('Invalid airline code', 400)

  const upstreamUrl = new URL(`https://airlines-api.logostream.dev/airlines/icao/${icao}`)
  upstreamUrl.searchParams.set('variant', 'tail')
  upstreamUrl.searchParams.set('format', 'png')
  upstreamUrl.searchParams.set('size', '400')
  upstreamUrl.searchParams.set('key', env.LOGOSTREAM_API_KEY)

  const upstream = await fetch(upstreamUrl, {
    headers: {
      Accept: 'image/png',
      'x-api-key': env.LOGOSTREAM_API_KEY,
    },
  })

  if (!upstream.ok || !upstream.body) {
    console.error(JSON.stringify({ event: 'logostream_error', icao, status: upstream.status }))
    return jsonError('Airline artwork unavailable', 502)
  }

  const response = new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'private, max-age=86400',
      'X-Artwork-Source': 'Logostream',
    },
  })
  return response
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && (url.pathname === '/api/health' || url.pathname === '/api/status')) {
      return Response.json(
        {
          ok: true,
          project: 'hizach-flights',
          purpose: 'personal-non-commercial',
          integrations: {
            displayToken: Boolean(env.DISPLAY_ACCESS_TOKEN),
            flightyCalendar: Boolean(env.FLIGHTY_CALENDAR_ICS_URL),
            flightaware: Boolean(env.FLIGHTAWARE_AEROAPI_KEY),
            logostream: Boolean(env.LOGOSTREAM_API_KEY),
          },
        },
        { headers: noStoreHeaders() },
      )
    }

    if (request.method === 'POST' && url.pathname === '/api/unlock') {
      return handleUnlock(request, env)
    }

    if (!(await isAuthorized(request, env))) return jsonError('Unauthorized', 401)

    if (request.method === 'GET' && url.pathname === '/api/next-flight') {
      try {
        return Response.json({ flight: await nextFlight(env) }, { headers: noStoreHeaders() })
      } catch (error) {
        console.error(JSON.stringify({ event: 'calendar_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Calendar unavailable', 502)
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/upcoming-flights') {
      try {
        return Response.json({ flights: await upcomingFlights(env) }, { headers: noStoreHeaders() })
      } catch (error) {
        console.error(JSON.stringify({ event: 'upcoming_flights_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Upcoming flights unavailable', 502)
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/calendar-preview') {
      try {
        const now = Date.now()
        const events = (await calendarEvents(env))
          .sort((a, b) => a.start.getTime() - b.start.getTime())
          .slice(0, 20)
          .map((event) => ({
            summary: event.summary,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            upcoming: event.end.getTime() >= now,
            identity: flightIdentity(event),
          }))
        return Response.json(
          { now: new Date(now).toISOString(), events },
          { headers: noStoreHeaders() },
        )
      } catch (error) {
        console.error(JSON.stringify({ event: 'calendar_preview_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Calendar unavailable', 502)
      }
    }

    const tailMatch = url.pathname.match(/^\/api\/airline-tail\/([A-Z0-9]{3})$/)
    if (request.method === 'GET' && tailMatch) {
      return handleTail(tailMatch[1], env)
    }

    if (request.method === 'POST' && url.pathname === '/api/lock') {
      return Response.json(
        { ok: true },
        {
          headers: noStoreHeaders({
            'Set-Cookie': 'hizach_display=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
          }),
        },
      )
    }

    return jsonError('Not found', 404)
  },
} satisfies ExportedHandler<Env>
