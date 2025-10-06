import test from 'node:test'
import assert from 'node:assert/strict'
import { clearAnalyticsHistory, getAnalyticsHistory } from '../src/lib/analytics'
import type { AnalyticsEvent, AnalyticsEventName } from '../src/lib/analytics'
import {
  recordCheckoutStart,
  recordMove,
  recordPlacement,
  recordRandomize,
  recordRemoval,
} from '../src/lib/builderMetrics'

const sampleItems = [
  { id: 'bear', qty: 2 },
  { id: 'sparkle', qty: 1 },
] as const

function expectEventName<E extends AnalyticsEventName>(event: AnalyticsEvent, name: E): asserts event is AnalyticsEvent<E> {
  if (event.name !== name) {
    throw new Error(`Expected ${name}, received ${event.name}`)
  }
}

test('recordPlacement emits a trinket_add event', () => {
  clearAnalyticsHistory()
  recordPlacement({ index: 2, trinketId: 'bear', method: 'tap' })
  const events = getAnalyticsHistory()
  assert.equal(events.length, 1)
  const event = events[0]
  expectEventName(event, 'trinket_add')
  assert.equal(event.payload.index, 2)
  assert.equal(event.payload.trinketId, 'bear')
  assert.equal(event.payload.method, 'tap')
})

test('recordRemoval emits a trinket_remove event', () => {
  clearAnalyticsHistory()
  recordRemoval({ index: 5, trinketId: 'heart', method: 'controls' })
  const [event] = getAnalyticsHistory()
  expectEventName(event, 'trinket_remove')
  assert.equal(event.payload.index, 5)
  assert.equal(event.payload.trinketId, 'heart')
  assert.equal(event.payload.method, 'controls')
})

test('recordMove captures source and destination indices', () => {
  clearAnalyticsHistory()
  recordMove({ from: 1, to: 7, trinketId: 'rainbow', replacedId: 'cloud' })
  const [event] = getAnalyticsHistory()
  expectEventName(event, 'trinket_move')
  assert.equal(event.payload.from, 1)
  assert.equal(event.payload.to, 7)
  assert.equal(event.payload.trinketId, 'rainbow')
  assert.equal(event.payload.replacedId, 'cloud')
})

test('recordRandomize notes pack context and count', () => {
  clearAnalyticsHistory()
  recordRandomize({ count: 6, inPack: true })
  const [event] = getAnalyticsHistory()
  expectEventName(event, 'randomize')
  assert.equal(event.payload.count, 6)
  assert.equal(event.payload.inPack, true)
})

test('recordCheckoutStart includes totals and items', () => {
  clearAnalyticsHistory()
  recordCheckoutStart({
    total: 42.5,
    placedCount: 5,
    items: sampleItems,
    packId: 'sunny-pack',
    budget: 100,
  })
  const [event] = getAnalyticsHistory()
  expectEventName(event, 'checkout_start')
  assert.equal(event.payload.total, 42.5)
  assert.equal(event.payload.placedCount, 5)
  assert.equal(event.payload.packId, 'sunny-pack')
  assert.equal(event.payload.budget, 100)
  assert.deepEqual(event.payload.items, sampleItems)
})
