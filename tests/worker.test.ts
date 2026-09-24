import assert from 'node:assert/strict'
import test from 'node:test'
import {
  flightAwareCacheSeconds,
  flightAwareCacheUrl,
  flightAwareEquipment,
  flightEquipmentFromCode,
  flightIdentity,
  isFlightWindow,
  photoIndexForSlot,
} from '../src/worker.ts'
import { automaticOverlayVariant, automaticPaletteIndex, palettes } from '../src/data/posterPalettes.ts'
import { processPhotoPixels } from '../src/data/photoProcessing.ts'

const event = {
  summary: 'AS 1329 · SFO → LAX',
  description: '',
  location: '',
  start: new Date('2026-08-25T15:23:00.000Z'),
  end: new Date('2026-08-25T16:57:00.000Z'),
}

test('FlightAware cache keys identify the exact flight occurrence', () => {
  const identity = flightIdentity(event)
  assert.ok(identity)

  const first = flightAwareCacheUrl(identity, event)
  const later = flightAwareCacheUrl(identity, {
    ...event,
    start: new Date('2026-08-26T15:23:00.000Z'),
  })

  assert.match(first, /v2\/ASA1329\/SFO-LAX\//)
  assert.notEqual(first, later)
})

test('pending equipment expires quickly while B39M assignments remain economical', () => {
  assert.equal(flightAwareCacheSeconds(false), 5 * 60)
  assert.equal(flightAwareCacheSeconds(true), 60 * 60)
})

test('FlightAware B39M renders as an Alaska Boeing 737 MAX 9', () => {
  assert.deepEqual(flightEquipmentFromCode('b39m'), {
    code: 'B39M',
    name: 'Boeing 737 MAX 9',
  })
})

test('automatic frame mode opens three hours before departure and closes at arrival', () => {
  const start = '2026-08-30T16:00:00.000Z'
  const end = '2026-08-30T18:00:00.000Z'
  assert.equal(isFlightWindow(start, end, new Date('2026-08-30T12:59:59.000Z').getTime()), false)
  assert.equal(isFlightWindow(start, end, new Date('2026-08-30T13:00:00.000Z').getTime()), true)
  assert.equal(isFlightWindow(start, end, new Date('2026-08-30T17:59:59.000Z').getTime()), true)
  assert.equal(isFlightWindow(start, end, new Date('2026-08-30T18:00:00.000Z').getTime()), false)
})

test('shuffled photo rotation shows every enabled photo before repeating', () => {
  const photos = [
    { id: 'photo-a' },
    { id: 'photo-b' },
    { id: 'photo-c' },
    { id: 'photo-d' },
  ]
  const firstCycle = photos.map((_, slot) => photoIndexForSlot(photos, slot, 'shuffle', 'frame-seed'))
  const secondCycle = photos.map((_, slot) => photoIndexForSlot(photos, slot + photos.length, 'shuffle', 'frame-seed'))

  assert.equal(new Set(firstCycle).size, photos.length)
  assert.deepEqual(secondCycle, firstCycle)
  assert.notEqual(firstCycle.at(-1), secondCycle[0])
})

test('color photo processing preserves color for EE02 dithering', () => {
  const color = new Uint8ClampedArray([214, 83, 37, 255, 22, 149, 201, 255])
  processPhotoPixels(color, 'six-color', 0, 0)
  assert.deepEqual([...color], [214, 83, 37, 255, 22, 149, 201, 255])

  const monochrome = new Uint8ClampedArray([214, 83, 37, 255])
  processPhotoPixels(monochrome, 'black-and-white', 0, 0)
  assert.equal(monochrome[0], monochrome[1])
  assert.equal(monochrome[1], monochrome[2])
})

test('poster palette is automatic per flight while SFO keeps its bridge treatment', () => {
  const sfoFlight = {
    airlineIata: 'AS', flightNumber: '688', start: '2026-09-22T17:52:00.000Z', origin: 'SEA', destination: 'SFO',
  }
  assert.equal(automaticPaletteIndex(sfoFlight), 0)

  const otherFlights = [
    { ...sfoFlight, flightNumber: '316', destination: 'SEA', origin: 'SFO' },
    { ...sfoFlight, flightNumber: '877', destination: 'HNL', origin: 'SFO' },
    { ...sfoFlight, flightNumber: '341', destination: 'LAX', origin: 'SFO' },
    { ...sfoFlight, flightNumber: '20', destination: 'JFK', origin: 'SFO' },
  ]
  const indices = otherFlights.map((flight) => automaticPaletteIndex(flight))
  assert.ok(indices.every((index) => index >= 0 && index < palettes.length))
  assert.ok(new Set(indices).size > 1)
  assert.equal(automaticPaletteIndex(otherFlights[0]), indices[0])
})

test('SFO flights automatically vary among the three Golden Gate treatments', () => {
  const sfoFlights = [
    { airlineIata: 'AS', flightNumber: '688', start: '2026-09-22T17:52:00.000Z', origin: 'SEA', destination: 'SFO' },
    { airlineIata: 'AS', flightNumber: '1327', start: '2026-09-24T17:52:00.000Z', origin: 'SEA', destination: 'SFO' },
    { airlineIata: 'AS', flightNumber: '331', start: '2026-09-26T17:52:00.000Z', origin: 'JFK', destination: 'SFO' },
    { airlineIata: 'AS', flightNumber: '343', start: '2026-09-28T17:52:00.000Z', origin: 'LAX', destination: 'SFO' },
  ]
  const variants = sfoFlights.map((flight) => automaticOverlayVariant(flight))
  assert.ok(variants.every((variant) => variant >= 0 && variant < 3))
  assert.ok(new Set(variants).size > 1)
  assert.equal(automaticOverlayVariant(sfoFlights[0]), variants[0])
})

test('a cache write failure does not discard an assigned aircraft', async () => {
  const originalCaches = globalThis.caches
  const originalFetch = globalThis.fetch
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: {
      default: {
        match: async () => undefined,
        put: async () => { throw new Error('cache unavailable') },
      },
    },
  })
  globalThis.fetch = async () => Response.json({
    flights: [{
      aircraft_type: 'B39M',
      registration: 'N123AS',
      scheduled_out: event.start.toISOString(),
      origin: { code_iata: 'SFO' },
      destination: { code_iata: 'LAX' },
    }],
  })

  try {
    const identity = flightIdentity(event)
    assert.ok(identity)
    const result = await flightAwareEquipment(identity, event, {
      FLIGHTAWARE_AEROAPI_KEY: 'test-key',
    })
    assert.deepEqual(result.equipment, {
      code: 'B39M',
      name: 'Boeing 737 MAX 9',
    })
    assert.equal(result.registration, 'N123AS')
    assert.equal(result.source, 'flightaware-assigned')
  } finally {
    globalThis.fetch = originalFetch
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: originalCaches,
    })
  }
})
