import assert from 'node:assert/strict'
import test from 'node:test'
import {
  flightAwareCacheSeconds,
  flightAwareCacheUrl,
  flightEquipmentFromCode,
  flightIdentity,
} from '../src/worker.ts'

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
