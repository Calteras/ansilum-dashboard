import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPresetSpan, toApiDateTime } from './date-range'

describe('toApiDateTime', () => {
  const zone = process.env.TZ
  beforeAll(() => {
    // An outlet browser in Jakarta; Node re-reads TZ when it changes.
    process.env.TZ = 'Asia/Jakarta'
  })
  afterAll(() => {
    process.env.TZ = zone
  })

  it("sends the browser's local day as exact instants, not zone-less times", () => {
    const today = getPresetSpan('today', new Date('2026-10-25T08:04:00Z'))
    expect(toApiDateTime(today.from)).toBe('2026-10-24T17:00:00.000Z')
    expect(toApiDateTime(today.to)).toBe('2026-10-25T16:59:59.999Z')
  })

  it('keeps sales after local midnight on the new day', () => {
    // 00:30 in Jakarta is still the previous day in UTC.
    const today = getPresetSpan('today', new Date('2026-10-24T17:30:00Z'))
    expect(toApiDateTime(today.from)).toBe('2026-10-24T17:00:00.000Z')
  })
})
