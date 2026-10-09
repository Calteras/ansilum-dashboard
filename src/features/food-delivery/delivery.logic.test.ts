import { describe, expect, it, vi } from 'vitest'
import {
  authorizationDestination,
  availableActions,
  mergeOrders,
  parseMenu,
  reportPeriod,
  syncOrders,
  validateMapping,
} from './delivery.logic'
import { orderFixture as order } from './test-fixtures'

describe('delivery synchronization', () => {
  it('replaces active orders with terminal updates and ignores stale duplicates', () => {
    const completed = { ...order, version: 3, state: 'COMPLETED' as const }
    expect(mergeOrders([order], [completed, order])).toEqual([completed])
  })
  it('drains full cursor pages and resumes from the returned cursor', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      ...order,
      id: `order-${i}`,
    }))
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ orders: rows, cursor: 'page-1' })
      .mockResolvedValueOnce({
        orders: [{ ...rows[0], version: 2, state: 'CANCELLED' }],
        cursor: 'page-2',
      })
    const result = await syncOrders(undefined, fetch)
    expect(fetch.mock.calls).toEqual([[null], ['page-1']])
    expect(result.orders).toHaveLength(100)
    expect(result.orders.find((item) => item.id === 'order-0')?.state).toBe(
      'CANCELLED'
    )
    const recover = vi.fn().mockResolvedValue({ orders: [], cursor: 'page-2' })
    expect(await syncOrders(result, recover)).toEqual(result)
    expect(recover).toHaveBeenCalledWith('page-2')
  })
  it('does not advance the caller cursor when a later page fails', async () => {
    const original = { orders: [order], cursor: 'old' }
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ orders: Array(100).fill(order), cursor: 'next' })
      .mockRejectedValueOnce(new Error('offline'))
    await expect(syncOrders(original, fetch)).rejects.toThrow('offline')
    expect(original.cursor).toBe('old')
  })
})

describe('provider capabilities', () => {
  it('limits GoFood to local preparation and supported ready actions', () => {
    expect(availableActions({ ...order, provider: 'GOFOOD' }, true)).toEqual([
      'START_PREPARATION',
    ])
    expect(
      availableActions(
        { ...order, provider: 'GOFOOD', state: 'PREPARING' },
        true
      )
    ).toEqual(['READY'])
  })
  it('only exposes manual acceptance for configured Grab outlets', () => {
    expect(
      availableActions(
        {
          ...order,
          state: 'RECEIVED',
          capabilities: { ...order.capabilities, manualAcceptance: true },
        },
        true
      )
    ).toEqual(['ACCEPT', 'REJECT'])
    expect(
      availableActions({ ...order, scheduledAt: '2026-10-03T10:00:00Z' }, true)
    ).not.toContain('CANCEL')
    expect(availableActions(order, false)).not.toContain('CANCEL')
    expect(
      availableActions(
        {
          ...order,
          capabilities: { ...order.capabilities, writesEnabled: false },
        },
        true
      )
    ).toEqual(['START_PREPARATION'])
  })
  it('blocks terminal/review orders and restricts external inventory acknowledgment', () => {
    expect(availableActions({ ...order, state: 'COMPLETED' }, true)).toEqual([])
    expect(
      availableActions({ ...order, processingState: 'EDIT_REVIEW' }, true)
    ).toEqual([])
    const review = {
      ...order,
      state: 'COMPLETED' as const,
      processingState: 'INVENTORY_REVIEW',
    }
    expect(availableActions(review, true)).toEqual([
      'ACKNOWLEDGE_EXTERNAL_INVENTORY',
    ])
    expect(availableActions(review, false)).toEqual([])
  })
})

describe('mapping and financial input', () => {
  it('enforces exactly one option target and product ownership shape', () => {
    expect(() =>
      validateMapping({
        kind: 'OPTION',
        externalId: 'milk',
        variantId: 'v',
        modifierId: 'm',
      })
    ).toThrow()
    expect(() =>
      validateMapping({
        kind: 'OPTION',
        externalId: 'milk',
        productId: 'p',
        variantId: 'v',
      })
    ).toThrow()
    expect(() =>
      validateMapping({ kind: 'ITEM', externalId: 'coffee' })
    ).toThrow()
    expect(() =>
      validateMapping({
        kind: 'ITEM',
        externalId: 'coffee',
        productId: 'p',
        variantId: 'v',
      })
    ).not.toThrow()
    expect(() =>
      validateMapping({ kind: 'OPTION', externalId: 'milk', modifierId: 'm' })
    ).not.toThrow()
  })
  it('requires a menu object and a bounded half-open reporting interval', () => {
    expect(() => parseMenu('[]')).toThrow()
    expect(() => parseMenu('null')).toThrow()
    expect(parseMenu('{"categories":[]}')).toEqual({ categories: [] })
    expect(reportPeriod('2026-10-01', '2026-10-02')).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-10-02T00:00:00.000Z',
    })
    expect(() => reportPeriod('2026-10-02', '2026-10-02')).toThrow()
    expect(() => reportPeriod('2025-01-01', '2026-10-02')).toThrow()
  })
  it('keeps GoFood OAuth browser cookies on the frontend callback origin', () => {
    const url = new URL('https://integration-goauth.gojekapi.com/oauth2/auth')
    url.searchParams.set(
      'redirect_uri',
      'https://web.example/app/terrapos/webhooks/gofood/connection-1/oauth/callback'
    )
    expect(authorizationDestination(url.href, 'https://web.example')).toBe(
      url.href
    )
    expect(() =>
      authorizationDestination(url.href, 'https://another.example')
    ).toThrow()
    url.hostname = 'untrusted.example'
    expect(() =>
      authorizationDestination(url.href, 'https://web.example')
    ).toThrow()
  })
})
