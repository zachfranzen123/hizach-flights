/// <reference types="@cloudflare/workers-types" />
// Aircraft artwork mappings are kept in sync with the poster asset library.

type Env = {
  ASSETS: Fetcher
  PHOTO_BUCKET: R2Bucket
  DISPLAY_ACCESS_TOKEN: string
  FLIGHTY_CALENDAR_ICS_URL: string
  FLIGHTAWARE_AEROAPI_KEY: string
  LOGOSTREAM_API_KEY: string
  RESEND_API_KEY: string
  ARTWORK_ALERT_TO: string
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

type FrameMode = 'automatic' | 'flight' | 'photo'
type PhotoTreatment = 'black-and-white' | 'six-color'

type PhotoMetadata = {
  id: string
  name: string
  enabled: boolean
  treatment: PhotoTreatment
  createdAt: string
  updatedAt: string
}

type FrameSettings = {
  mode: FrameMode
  rotation: 'shuffle' | 'ordered'
  updatedAt: string
}

const MAX_CALENDAR_BYTES = 1_000_000
const MAX_UNLOCK_BYTES = 4_096
const MAX_PHOTO_UPLOAD_BYTES = 8_000_000
const MAX_PHOTOS = 100
const PHOTO_METADATA_SUFFIX = '/metadata.json'
const FRAME_SETTINGS_KEY = 'settings/frame.json'
const ARTWORK_ALERT_FROM = 'Flight Poster <flight-alerts@hizach.com>'
const ARTWORK_ALERT_CACHE_SECONDS = 30 * 24 * 60 * 60
const FLIGHTAWARE_ASSIGNED_CACHE_SECONDS = 60 * 60
const FLIGHTAWARE_PENDING_CACHE_SECONDS = 5 * 60
const FLIGHTAWARE_CACHE_VERSION = 'v2'

const artworkByAirline: Record<string, ReadonlySet<string>> = {
  AS: new Set(['B737', 'B738', 'B739', 'B38M', 'B39M', 'E75L', 'B789']),
  IB: new Set(['A319', 'A320', 'A321', 'A332']),
  VY: new Set(['A21N']),
}

const airlineIcaoByIata: Record<string, string> = {
  AF: 'AFR',
  AS: 'ASA',
  IB: 'IBE',
  VY: 'VLG',
}

const airlineNameByIata: Record<string, string> = {
  AF: 'Air France',
  AS: 'Alaska Airlines',
  IB: 'Iberia',
  VY: 'Vueling',
}

const equipmentByFlight: Record<string, FlightEquipment> = {
  IB356: { code: 'A332', name: 'Airbus A330-200' },
}

const equipmentNameByIcao: Record<string, string> = {
  A319: 'Airbus A319',
  A320: 'Airbus A320',
  A321: 'Airbus A321',
  A21N: 'Airbus A321neo',
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

export function flightEquipmentFromCode(code: string): FlightEquipment {
  const normalizedCode = code.toUpperCase()
  return {
    code: normalizedCode,
    name: equipmentNameByIcao[normalizedCode] ?? normalizedCode,
  }
}

function noStoreHeaders(extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra)
  headers.set('Cache-Control', 'no-store')
  return headers
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: noStoreHeaders() })
}

function photoKeys(id: string) {
  return {
    display: `photos/${id}/display.jpg`,
    thumbnail: `photos/${id}/thumbnail.jpg`,
    metadata: `photos/${id}/metadata.json`,
  }
}

function isPhotoId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function readR2Json<T>(object: R2ObjectBody | null): Promise<T | null> {
  if (!object) return null
  try {
    return JSON.parse(await object.text()) as T
  } catch {
    return null
  }
}

async function listPhotos(env: Env): Promise<PhotoMetadata[]> {
  const listed = await env.PHOTO_BUCKET.list({ prefix: 'photos/', limit: MAX_PHOTOS * 3 })
  const metadataObjects = listed.objects
    .filter((object) => object.key.endsWith(PHOTO_METADATA_SUFFIX))
    .slice(0, MAX_PHOTOS)
  const photos = await Promise.all(metadataObjects.map(async (object) => {
    return readR2Json<PhotoMetadata>(await env.PHOTO_BUCKET.get(object.key))
  }))
  return photos
    .filter((photo): photo is PhotoMetadata => Boolean(photo && isPhotoId(photo.id)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function frameSettings(env: Env): Promise<FrameSettings> {
  const saved = await readR2Json<FrameSettings>(await env.PHOTO_BUCKET.get(FRAME_SETTINGS_KEY))
  if (saved && ['automatic', 'flight', 'photo'].includes(saved.mode)) return saved
  return { mode: 'automatic', rotation: 'shuffle', updatedAt: new Date(0).toISOString() }
}

async function handlePhotoUpload(request: Request, env: Env): Promise<Response> {
  const declaredLength = Number(request.headers.get('Content-Length') ?? 0)
  if (declaredLength > MAX_PHOTO_UPLOAD_BYTES) return jsonError('Photo upload is too large', 413)

  const currentCount = (await env.PHOTO_BUCKET.list({ prefix: 'photos/', limit: MAX_PHOTOS * 3 })).objects
    .filter((object) => object.key.endsWith(PHOTO_METADATA_SUFFIX)).length
  if (currentCount >= MAX_PHOTOS) return jsonError('Photo library is full', 409)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('Invalid photo upload', 400)
  }

  const display = form.get('display')
  const thumbnail = form.get('thumbnail')
  const name = String(form.get('name') ?? 'Untitled photo').trim().slice(0, 160)
  const treatment = form.get('treatment') === 'six-color' ? 'six-color' : 'black-and-white'
  if (!(display instanceof File) || !(thumbnail instanceof File)) return jsonError('Display and thumbnail images are required', 400)
  if (display.type !== 'image/jpeg' || thumbnail.type !== 'image/jpeg') return jsonError('Processed photos must be JPEG images', 415)
  if (display.size > 6_000_000 || thumbnail.size > 1_000_000) return jsonError('Processed photo is too large', 413)

  const id = crypto.randomUUID()
  const keys = photoKeys(id)
  const now = new Date().toISOString()
  const metadata: PhotoMetadata = { id, name: name || 'Untitled photo', enabled: true, treatment, createdAt: now, updatedAt: now }

  try {
    await Promise.all([
      env.PHOTO_BUCKET.put(keys.display, display.stream(), { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'private, no-store' } }),
      env.PHOTO_BUCKET.put(keys.thumbnail, thumbnail.stream(), { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'private, no-store' } }),
    ])
    await env.PHOTO_BUCKET.put(keys.metadata, JSON.stringify(metadata), { httpMetadata: { contentType: 'application/json' } })
  } catch (error) {
    await env.PHOTO_BUCKET.delete([keys.display, keys.thumbnail, keys.metadata])
    throw error
  }

  return Response.json({ photo: metadata }, { status: 201, headers: noStoreHeaders() })
}

async function handlePhotoImage(id: string, variant: string, env: Env): Promise<Response> {
  if (!isPhotoId(id) || !['display', 'thumbnail'].includes(variant)) return jsonError('Invalid photo request', 400)
  const key = variant === 'thumbnail' ? photoKeys(id).thumbnail : photoKeys(id).display
  const object = await env.PHOTO_BUCKET.get(key)
  if (!object) return jsonError('Photo not found', 404)
  const headers = noStoreHeaders({ 'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg' })
  headers.set('ETag', object.httpEtag)
  return new Response(object.body, { headers })
}

async function handlePhotoUpdate(id: string, request: Request, env: Env): Promise<Response> {
  if (!isPhotoId(id)) return jsonError('Invalid photo ID', 400)
  const keys = photoKeys(id)
  const metadata = await readR2Json<PhotoMetadata>(await env.PHOTO_BUCKET.get(keys.metadata))
  if (!metadata) return jsonError('Photo not found', 404)
  let update: { enabled?: unknown; name?: unknown }
  try {
    update = await request.json() as { enabled?: unknown; name?: unknown }
  } catch {
    return jsonError('Invalid photo update', 400)
  }
  if (typeof update.enabled === 'boolean') metadata.enabled = update.enabled
  if (typeof update.name === 'string') metadata.name = update.name.trim().slice(0, 160) || metadata.name
  metadata.updatedAt = new Date().toISOString()
  await env.PHOTO_BUCKET.put(keys.metadata, JSON.stringify(metadata), { httpMetadata: { contentType: 'application/json' } })
  return Response.json({ photo: metadata }, { headers: noStoreHeaders() })
}

async function handleFrameSettingsUpdate(request: Request, env: Env): Promise<Response> {
  let update: { mode?: unknown; rotation?: unknown }
  try {
    update = await request.json() as { mode?: unknown; rotation?: unknown }
  } catch {
    return jsonError('Invalid frame settings', 400)
  }
  const current = await frameSettings(env)
  if (typeof update.mode === 'string' && ['automatic', 'flight', 'photo'].includes(update.mode)) current.mode = update.mode as FrameMode
  if (typeof update.rotation === 'string' && ['shuffle', 'ordered'].includes(update.rotation)) current.rotation = update.rotation as FrameSettings['rotation']
  current.updatedAt = new Date().toISOString()
  await env.PHOTO_BUCKET.put(FRAME_SETTINGS_KEY, JSON.stringify(current), { httpMetadata: { contentType: 'application/json' } })
  return Response.json({ settings: current }, { headers: noStoreHeaders() })
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

export function flightAwareCacheUrl(
  identity: NonNullable<ReturnType<typeof flightIdentity>>,
  event: ParsedCalendarEvent,
): string {
  const ident = `${identity.airlineIcao}${identity.flightNumber}`
  const occurrence = encodeURIComponent(event.start.toISOString())
  return `https://flightaware-cache.invalid/${FLIGHTAWARE_CACHE_VERSION}/${ident}/${identity.origin}-${identity.destination}/${occurrence}`
}

export function flightAwareCacheSeconds(hasAssignedAircraft: boolean): number {
  return hasAssignedAircraft
    ? FLIGHTAWARE_ASSIGNED_CACHE_SECONDS
    : FLIGHTAWARE_PENDING_CACHE_SECONDS
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
  // Cache each scheduled occurrence separately. A flight number alone is not
  // unique and previously allowed an older TBD response to mask a later
  // aircraft assignment for up to six hours.
  const cacheKey = new Request(flightAwareCacheUrl(identity, event))
  const cache = (caches as CacheStorage & { default: Cache }).default
  let response = await cache.match(cacheKey)
  const cacheHit = Boolean(response)

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
    if (!cacheHit) {
      await cache.put(cacheKey, Response.json(data, {
        headers: { 'Cache-Control': `public, max-age=${flightAwareCacheSeconds(true)}` },
      }))
    }
    return {
      equipment: flightEquipmentFromCode(assignedCode),
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
    if (!cacheHit) {
      await cache.put(cacheKey, Response.json(data, {
        headers: { 'Cache-Control': `public, max-age=${flightAwareCacheSeconds(false)}` },
      }))
    }
    return { equipment: null, registration: null, source: 'not-yet-available', evidence: null }
  }

  const [typicalCode, matchingCount] = typical
  if (!cacheHit) {
    // A typical aircraft is only a fallback. Refresh it frequently so a newly
    // published assignment replaces the prediction without manual cache work.
    await cache.put(cacheKey, Response.json(data, {
      headers: { 'Cache-Control': `public, max-age=${flightAwareCacheSeconds(false)}` },
    }))
  }
  return {
    equipment: flightEquipmentFromCode(typicalCode),
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

type UpcomingFlight = Awaited<ReturnType<typeof upcomingFlights>>[number]

function missingArtwork(flights: UpcomingFlight[]): UpcomingFlight[] {
  return flights.filter((flight) => {
    const aircraftCode = flight.equipment?.code
    return Boolean(aircraftCode) && !(artworkByAirline[flight.airlineIata]?.has(aircraftCode as string) ?? false)
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function artworkAlertFingerprint(flights: UpcomingFlight[]): string {
  return flights
    .map((flight) => `${flight.airlineIata}-${flight.equipment?.code ?? 'UNKNOWN'}`)
    .sort()
    .join('|')
}

async function sendMissingArtworkAlert(env: Env): Promise<{ sent: boolean; missing: number; reason?: string }> {
  if (!env.RESEND_API_KEY || !env.ARTWORK_ALERT_TO) {
    console.error(JSON.stringify({ event: 'artwork_alert_configuration_missing' }))
    return { sent: false, missing: 0, reason: 'configuration-missing' }
  }

  const flights = missingArtwork(await upcomingFlights(env))
  if (flights.length === 0) return { sent: false, missing: 0, reason: 'nothing-missing' }

  const fingerprint = artworkAlertFingerprint(flights)
  const cache = (caches as CacheStorage & { default: Cache }).default
  const cacheKey = new Request(`https://artwork-alert-cache.invalid/${encodeURIComponent(fingerprint)}`)
  if (await cache.match(cacheKey)) {
    return { sent: false, missing: flights.length, reason: 'already-notified' }
  }

  const rows = flights.map((flight) => {
    const equipment = flight.equipment as FlightEquipment
    return `<li><strong>${escapeHtml(`${flight.airlineName} ${flight.airlineIata}${flight.flightNumber}`)}</strong> — ${escapeHtml(`${flight.origin} → ${flight.destination}`)}<br>${escapeHtml(`${equipment.name} (${equipment.code})`)} · ${escapeHtml(new Date(flight.start).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric' }))}</li>`
  }).join('')
  const prompt = `Create transparent side-profile aircraft artwork for the missing combinations: ${flights.map((flight) => `${flight.airlineName} ${flight.equipment?.name} (${flight.equipment?.code})`).join('; ')}. Match the existing flight poster artwork style and proportions, then add each asset to the flights.hizach.com aircraft mapping.`
  const text = flights.map((flight) => {
    return `${flight.airlineName} ${flight.airlineIata}${flight.flightNumber}: ${flight.origin} to ${flight.destination} — ${flight.equipment?.name} (${flight.equipment?.code})`
  }).join('\n')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `artwork-${fingerprint}`.slice(0, 256),
    },
    body: JSON.stringify({
      from: ARTWORK_ALERT_FROM,
      to: [env.ARTWORK_ALERT_TO],
      subject: `${flights.length} aircraft artwork ${flights.length === 1 ? 'combination needs' : 'combinations need'} attention`,
      text: `Your flight poster needs new aircraft artwork:\n\n${text}\n\nReady-to-copy request:\n${prompt}\n\nOpen the poster: https://flights.hizach.com`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033;max-width:640px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#60708a">HiZach Flights · personal project</p><h1 style="font-size:26px">Aircraft artwork needed</h1><p>An upcoming flight has an airline and aircraft combination that is not yet in your poster library.</p><ul style="padding-left:22px">${rows}</ul><h2 style="font-size:18px;margin-top:28px">Ready-to-copy request</h2><p style="background:#f2f5f8;padding:16px;border-radius:8px">${escapeHtml(prompt)}</p><p><a href="https://flights.hizach.com">Open your flight poster</a></p></div>`,
    }),
  })

  if (!response.ok) {
    const details = await readTextLimited(response, 16_384)
    console.error(JSON.stringify({ event: 'resend_error', status: response.status, details }))
    throw new Error(`Resend returned ${response.status}`)
  }

  await cache.put(cacheKey, new Response('sent', {
    headers: { 'Cache-Control': `public, max-age=${ARTWORK_ALERT_CACHE_SECONDS}` },
  }))
  console.log(JSON.stringify({ event: 'artwork_alert_sent', missing: flights.length, fingerprint }))
  return { sent: true, missing: flights.length }
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
            resend: Boolean(env.RESEND_API_KEY),
            artworkAlertRecipient: Boolean(env.ARTWORK_ALERT_TO),
            photoBucket: Boolean(env.PHOTO_BUCKET),
          },
        },
        { headers: noStoreHeaders() },
      )
    }

    if (request.method === 'POST' && url.pathname === '/api/unlock') {
      return handleUnlock(request, env)
    }

    if (!(await isAuthorized(request, env))) return jsonError('Unauthorized', 401)

    if (request.method === 'GET' && url.pathname === '/api/photos') {
      try {
        const [photos, settings] = await Promise.all([listPhotos(env), frameSettings(env)])
        return Response.json({ photos, settings }, { headers: noStoreHeaders() })
      } catch (error) {
        console.error(JSON.stringify({ event: 'photo_library_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Photo library unavailable', 502)
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/photos') {
      try {
        return await handlePhotoUpload(request, env)
      } catch (error) {
        console.error(JSON.stringify({ event: 'photo_upload_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Photo upload failed', 502)
      }
    }

    const photoImageMatch = url.pathname.match(/^\/api\/photos\/([^/]+)\/(display|thumbnail)$/)
    if (request.method === 'GET' && photoImageMatch) {
      return handlePhotoImage(photoImageMatch[1], photoImageMatch[2], env)
    }

    const photoMatch = url.pathname.match(/^\/api\/photos\/([^/]+)$/)
    if (request.method === 'PATCH' && photoMatch) {
      return handlePhotoUpdate(photoMatch[1], request, env)
    }
    if (request.method === 'DELETE' && photoMatch) {
      if (!isPhotoId(photoMatch[1])) return jsonError('Invalid photo ID', 400)
      const keys = photoKeys(photoMatch[1])
      await env.PHOTO_BUCKET.delete([keys.display, keys.thumbnail, keys.metadata])
      return new Response(null, { status: 204, headers: noStoreHeaders() })
    }

    if (request.method === 'GET' && url.pathname === '/api/frame-settings') {
      return Response.json({ settings: await frameSettings(env) }, { headers: noStoreHeaders() })
    }
    if (request.method === 'PATCH' && url.pathname === '/api/frame-settings') {
      return handleFrameSettingsUpdate(request, env)
    }

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

    if (request.method === 'POST' && url.pathname === '/api/test-artwork-alert') {
      try {
        return Response.json(await sendMissingArtworkAlert(env), { headers: noStoreHeaders() })
      } catch (error) {
        console.error(JSON.stringify({ event: 'artwork_alert_test_error', message: error instanceof Error ? error.message : 'Unknown error' }))
        return jsonError('Artwork alert failed', 502)
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

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendMissingArtworkAlert(env).catch((error) => {
      console.error(JSON.stringify({ event: 'artwork_alert_scheduled_error', message: error instanceof Error ? error.message : 'Unknown error' }))
    }))
  },
} satisfies ExportedHandler<Env>
