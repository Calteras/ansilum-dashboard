import { describe, expect, it } from 'vitest'
import type { Reward } from '../api/loyalty.types'
import {
  customerStatus,
  formatPointsChange,
  parseTags,
  pointsForSpend,
  rewardState,
  rewardValue,
} from './loyalty'

const en = (_id: string, english: string) => english
const now = Date.parse('2026-10-25T07:00:00.000Z')
const day = 24 * 60 * 60 * 1000

const reward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 'r1',
  tenantId: 't1',
  name: 'Rp5.000 off',
  description: null,
  type: 'DISCOUNT_FIXED',
  discountAmount: '5000',
  discountPercent: null,
  productId: null,
  variantId: null,
  pointsCost: 50,
  minimumAmount: null,
  expiresAt: null,
  maxRedemptions: null,
  totalRedemptions: 0,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  product: null,
  variant: null,
  ...overrides,
})

describe('customerStatus', () => {
  it('reports a ban even though a banned member is also inactive', () => {
    expect(customerStatus({ isActive: false, bannedAt: '2026-10-01' })).toBe(
      'banned'
    )
    expect(customerStatus({ isActive: false, bannedAt: null })).toBe('inactive')
    expect(customerStatus({ isActive: true, bannedAt: null })).toBe('active')
  })
})

describe('pointsForSpend', () => {
  const rule = {
    isEnabled: true,
    pointsPerAmount: '1000',
    minimumAmountForPoints: '10000',
  }

  it('matches the server: floor of spend per point, nothing below the minimum', () => {
    expect(pointsForSpend(45_900, rule)).toBe(45)
    expect(pointsForSpend(9_999, rule)).toBe(0)
    expect(pointsForSpend(10_000, rule)).toBe(10)
  })

  it('earns nothing while the program is off', () => {
    expect(pointsForSpend(45_000, { ...rule, isEnabled: false })).toBe(0)
  })
})

describe('rewardState', () => {
  it('orders inactive, expired and used-up before expiring soon', () => {
    expect(
      rewardState(reward({ isActive: false, expiresAt: '2020-01-01' }), now)
    ).toBe('inactive')
    expect(
      rewardState(reward({ expiresAt: new Date(now - 1).toISOString() }), now)
    ).toBe('expired')
    expect(
      rewardState(
        reward({
          maxRedemptions: 3,
          totalRedemptions: 3,
          expiresAt: new Date(now + day).toISOString(),
        }),
        now
      )
    ).toBe('usedUp')
    expect(
      rewardState(
        reward({ expiresAt: new Date(now + 3 * day).toISOString() }),
        now
      )
    ).toBe('expiring')
    expect(
      rewardState(
        reward({ expiresAt: new Date(now + 30 * day).toISOString() }),
        now
      )
    ).toBe('active')
  })
})

describe('rewardValue', () => {
  it('describes the benefit of each type', () => {
    // The digit grouping follows the UI language.
    expect(rewardValue(reward(), en)).toMatch(/^Rp5[.,]000 off$/)
    expect(
      rewardValue(
        reward({ type: 'DISCOUNT_PERCENT', discountPercent: '10' }),
        en
      )
    ).toBe('10% off')
    expect(
      rewardValue(
        reward({
          type: 'FREE_ITEM',
          product: { id: 'p', name: 'Tea', sku: 'T' },
          variant: { id: 'v', name: 'Large' },
        }),
        en
      )
    ).toBe('Free Tea · Large')
  })
})

describe('formatting', () => {
  it('signs point changes with a true minus', () => {
    expect(formatPointsChange(45)).toBe('+45')
    expect(formatPointsChange(-200)).toBe('−200')
  })

  it('cleans typed tags', () => {
    expect(parseTags(' vip, regular,,vip ')).toEqual(['vip', 'regular'])
  })
})

describe('initials and errors', () => {
  it('uses first and last name', async () => {
    const { initials, loyaltyErrorMessage } = await import('./loyalty')
    expect(initials('Rizky Pratama')).toBe('RP')
    expect(initials('Ayu Dewi Lestari')).toBe('AL')
    expect(initials('Siti')).toBe('SI')
    const id = (indonesian: string) => indonesian
    expect(
      loyaltyErrorMessage('This phone number belongs to a banned customer', id)
    ).toBe('Nomor HP ini milik pelanggan yang diblokir.')
    expect(loyaltyErrorMessage('Something else', id)).toBe('Something else')
  })
})
