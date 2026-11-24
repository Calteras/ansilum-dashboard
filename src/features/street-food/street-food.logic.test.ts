import { describe, expect, it } from 'vitest'
import {
  connectionState,
  copyDayToAll,
  defaultPosAddress,
  hoursProblem,
  normalizePlatformUrl,
  outletIssues,
  platformUrlProblem,
  refreshInterval,
  registrationCurl,
  registrationDetails,
  summarizeHours,
  toIntervals,
  toWeek,
} from './street-food.logic'
import type {
  Delivery,
  StreetFoodOutlet,
  StreetFoodOverview,
} from './street-food.types'

const outlet = (over: Partial<StreetFoodOutlet> = {}): StreetFoodOutlet => ({
  outletId: 'o1',
  name: 'Kios Melati',
  address: 'Jl. Melati 3',
  latitude: -6.25,
  longitude: 106.85,
  enabled: true,
  onlineStatus: 'OPEN',
  prepTimeMinutes: 15,
  timezone: 'Asia/Jakarta',
  locationMode: 'FIXED',
  locationSharing: 'LIVE',
  hours: [],
  pricingValid: true,
  isOpenNow: true,
  acceptingOrders: true,
  dayOpen: false,
  lastCheckedAt: null,
  ...over,
})

const delivery = (over: Partial<Delivery> = {}): Delivery => ({
  pending: 0,
  failed: 0,
  lastDeliveredAt: null,
  lastError: null,
  ...over,
})

const linked = (
  over: Partial<StreetFoodOverview> = {}
): StreetFoodOverview => ({
  link: {
    linkId: 'l1',
    keyId: 'sfk_1',
    platformUrl: 'http://localhost:8080',
    status: 'ACTIVE',
    createdAt: '2026-11-21T00:00:00Z',
    revokedAt: null,
  },
  delivery: delivery(),
  outlets: [outlet()],
  ...over,
})

describe('connectionState', () => {
  it('starts from not connected, also after a revoked link', () => {
    expect(connectionState({ link: null, delivery: null, outlets: [] })).toBe(
      'not_connected'
    )
    expect(
      connectionState(
        linked({ link: { ...linked().link!, status: 'REVOKED' } })
      )
    ).toBe('not_connected')
  })

  it('asks for an outlet before anything can be delivered', () => {
    expect(
      connectionState(linked({ outlets: [outlet({ enabled: false })] }))
    ).toBe('needs_outlet')
  })

  it('tells a business waiting to be registered from one the platform cannot reach', () => {
    const state = (d: Partial<Delivery>) =>
      connectionState(linked({ delivery: delivery(d) }))
    expect(state({})).toBe('sending')
    expect(state({ pending: 1, lastError: 'HTTP_401' })).toBe(
      'waiting_registration'
    )
    expect(state({ pending: 1, lastError: 'NETWORK' })).toBe('unreachable')
    expect(state({ pending: 1, lastError: 'TIMEOUT' })).toBe('unreachable')
    expect(state({ pending: 1, lastError: 'HTTP_500' })).toBe('platform_error')
  })

  it('is connected once the platform accepted something, and delayed when it falls behind', () => {
    const delivered = '2026-11-21T01:00:00Z'
    expect(
      connectionState(
        linked({ delivery: delivery({ lastDeliveredAt: delivered }) })
      )
    ).toBe('connected')
    expect(
      connectionState(
        linked({
          delivery: delivery({
            lastDeliveredAt: delivered,
            pending: 3,
            lastError: 'NETWORK',
          }),
        })
      )
    ).toBe('delayed')
    // Old failures do not matter once nothing is waiting.
    expect(
      connectionState(
        linked({
          delivery: delivery({
            lastDeliveredAt: delivered,
            failed: 2,
            lastError: 'HTTP_401',
          }),
        })
      )
    ).toBe('connected')
  })

  it('keeps watching only the states that resolve by themselves', () => {
    expect(refreshInterval('waiting_registration')).toBe(5_000)
    expect(refreshInterval('sending')).toBe(5_000)
    expect(refreshInterval('delayed')).toBe(15_000)
    expect(refreshInterval('connected')).toBe(false)
    expect(refreshInterval('not_connected')).toBe(false)
    expect(refreshInterval('needs_outlet')).toBe(false)
  })
})

describe('platform address', () => {
  it('accepts https anywhere and http only on this machine', () => {
    for (const ok of [
      'https://api.streetfood.id',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      ' https://api.streetfood.id/ ',
    ])
      expect(platformUrlProblem(ok)).toBeNull()
    expect(platformUrlProblem('')).toBe('empty')
    expect(platformUrlProblem('   ')).toBe('empty')
    expect(platformUrlProblem('api.streetfood.id')).toBe('invalid')
    expect(platformUrlProblem('ftp://api.streetfood.id')).toBe('invalid')
    expect(platformUrlProblem('https://user:pw@api.streetfood.id')).toBe(
      'invalid'
    )
    expect(platformUrlProblem('http://api.streetfood.id')).toBe('insecure')
    expect(platformUrlProblem('http://192.168.1.5:8080')).toBe('insecure')
  })

  it('sends the origin only, as the POS stores it', () => {
    expect(normalizePlatformUrl(' https://api.streetfood.id/v1/ ')).toBe(
      'https://api.streetfood.id'
    )
    expect(normalizePlatformUrl('http://localhost:8080/')).toBe(
      'http://localhost:8080'
    )
  })

  it('offers the origin of the API address as the POS address', () => {
    expect(
      defaultPosAddress('http://localhost:8068/app/terrapos', 'http://x')
    ).toBe('http://localhost:8068')
    expect(defaultPosAddress(undefined, 'http://fallback')).toBe(
      'http://fallback'
    )
    expect(defaultPosAddress('not a url', 'http://fallback')).toBe(
      'http://fallback'
    )
  })
})

describe('registration details for the platform operator', () => {
  const details = registrationDetails({
    name: "Mama's Warung",
    tenantId: 'tenant-1',
    keyId: 'sfk_abc',
    secret: 'sfs_def',
    posBaseUrl: 'http://localhost:8068/',
  })

  it('maps the business to the platform registration fields', () => {
    expect(details).toEqual({
      name: "Mama's Warung",
      posTenantId: 'tenant-1',
      keyId: 'sfk_abc',
      secret: 'sfs_def',
      posBaseUrl: 'http://localhost:8068',
    })
  })

  it('builds a command that survives a quote in the name and never holds the operator token', () => {
    const curl = registrationCurl(details, 'http://localhost:8080/')
    expect(curl).toContain(
      "curl -X POST 'http://localhost:8080/v1/admin/merchants'"
    )
    expect(curl).toContain('$ADMIN_API_TOKEN')
    expect(curl).toContain(`Mama'\\''s Warung`)
    expect(curl).toContain('"keyId":"sfk_abc"')
    expect(curl).toContain('"secret":"sfs_def"')
  })
})

describe('outletIssues', () => {
  it('has none for a ready fixed outlet', () => {
    expect(outletIssues(outlet())).toEqual([])
  })

  it('names what would hide an outlet or stop orders', () => {
    expect(outletIssues(outlet({ pricingValid: false }))).toEqual([
      { code: 'PRICING_INVALID', tone: 'danger' },
    ])
    expect(outletIssues(outlet({ latitude: null }))).toEqual([
      { code: 'NO_LOCATION', tone: 'warning' },
    ])
    expect(outletIssues(outlet({ onlineStatus: 'AUTO', hours: [] }))).toEqual([
      { code: 'NO_HOURS', tone: 'warning' },
    ])
    expect(
      outletIssues(outlet({ locationMode: 'MOBILE', dayOpen: false }))
    ).toEqual([{ code: 'DAY_NOT_OPEN', tone: 'info' }])
  })

  it('does not ask a mobile vendor for an address, nor an always-open outlet for hours', () => {
    expect(
      outletIssues(
        outlet({
          locationMode: 'MOBILE',
          latitude: null,
          longitude: null,
          dayOpen: true,
        })
      )
    ).toEqual([])
    expect(outletIssues(outlet({ onlineStatus: 'OPEN', hours: [] }))).toEqual(
      []
    )
  })
})

describe('opening hours', () => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdays = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    opensAt: '08:00',
    closesAt: '17:00',
  }))

  it('summarises a week the way it is read', () => {
    expect(summarizeHours([], names)).toBe('')
    expect(summarizeHours(weekdays, names)).toBe('Mon–Fri 08:00–17:00')
    expect(
      summarizeHours(
        [
          ...weekdays,
          { dayOfWeek: 6, opensAt: '09:00', closesAt: '14:00' },
          { dayOfWeek: 0, opensAt: '09:00', closesAt: '14:00' },
        ],
        names
      )
    ).toBe('Mon–Fri 08:00–17:00 · Sat–Sun 09:00–14:00')
    // Days that are not neighbours are not merged.
    expect(
      summarizeHours(
        [
          { dayOfWeek: 1, opensAt: '08:00', closesAt: '17:00' },
          { dayOfWeek: 3, opensAt: '08:00', closesAt: '17:00' },
        ],
        names
      )
    ).toBe('Mon 08:00–17:00 · Wed 08:00–17:00')
    // Two spans on one day.
    expect(
      summarizeHours(
        [
          { dayOfWeek: 1, opensAt: '08:00', closesAt: '11:00' },
          { dayOfWeek: 1, opensAt: '13:00', closesAt: '17:00' },
        ],
        names
      )
    ).toBe('Mon 08:00–11:00, 13:00–17:00')
  })

  it('round-trips between the API list and the week editor, Monday first', () => {
    const week = toWeek(weekdays)
    expect(week[1].open).toBe(true)
    expect(week[0].open).toBe(false)
    expect(toIntervals(week)).toEqual(weekdays)
  })

  it('finds the mistakes the server would refuse', () => {
    const base = toWeek(weekdays)
    expect(hoursProblem(base)).toBeNull()

    const day = (spans: { opensAt: string; closesAt: string }[]) => ({
      ...base,
      2: { open: true, spans },
    })
    expect(
      hoursProblem(day([{ opensAt: '08:00', closesAt: '08:00' }]))
    ).toEqual({ day: 2, problem: 'SAME' })
    expect(hoursProblem(day([{ opensAt: '8:00', closesAt: '17:00' }]))).toEqual(
      { day: 2, problem: 'TIME' }
    )
    expect(
      hoursProblem(
        day([
          { opensAt: '08:00', closesAt: '11:00' },
          { opensAt: '08:00', closesAt: '12:00' },
        ])
      )
    ).toEqual({ day: 2, problem: 'DUPLICATE' })
    expect(hoursProblem(day([]))).toEqual({ day: 2, problem: 'EMPTY_DAY' })
    // Closing after midnight is allowed.
    expect(
      hoursProblem(day([{ opensAt: '18:00', closesAt: '02:00' }]))
    ).toBeNull()
  })

  it('copies one day to the whole week without sharing state', () => {
    const week = toWeek(weekdays)
    const all = copyDayToAll(week, 1)
    expect(toIntervals(all)).toHaveLength(7)
    all[2].spans[0].opensAt = '10:00'
    expect(all[3].spans[0].opensAt).toBe('08:00')
    expect(week[1].spans[0].opensAt).toBe('08:00')
  })
})
