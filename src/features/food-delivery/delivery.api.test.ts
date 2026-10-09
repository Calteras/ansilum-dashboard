import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { deliveryApi } from './delivery.api'
import { orderFixture } from './test-fixtures'

describe('food delivery API contract', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    useAuthStore.setState({
      activeTenant: {
        id: 'tenant-a',
        name: 'Cafe',
        slug: 'cafe',
        isActive: true,
        createdAt: '',
      },
    })
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Success', data: orderFixture }), {
        status: 200,
      })
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    useAuthStore.getState().clearAuth()
  })

  it('unwraps the Nest envelope and sends tenant context with same-origin cookies', async () => {
    expect(await deliveryApi.order('order-1')).toEqual(orderFixture)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/delivery-orders/order-1',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: expect.objectContaining({ 'x-tenant-id': 'tenant-a' }),
      })
    )
  })
  it('synchronizes without state filters and encodes opaque cursors', async () => {
    await deliveryApi.orders('outlet-1', 'a+/=')
    const url = new URL(fetchMock.mock.calls[0][0], 'https://frontend.example')
    expect(url.searchParams.get('cursor')).toBe('a+/=')
    expect(url.searchParams.has('state')).toBe(false)
  })
  it('sends expected version and the exact idempotency key without automatic retries', async () => {
    fetchMock.mockRejectedValueOnce(new Error('response lost'))
    const input = {
      action: 'CANCEL' as const,
      expectedVersion: 4,
      idempotencyKey: 'stable-key',
      cancelCode: 1001,
    }
    await expect(deliveryApi.action('order-1', input)).rejects.toThrow(
      'response lost'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(input)
  })
  it('preserves decimal-string adjustment amounts', async () => {
    const input = {
      kind: 'REFUND' as const,
      amount: '12345.10',
      reference: 'refund-1',
      occurredAt: '2026-10-02T00:00:00.000Z',
      idempotencyKey: 'stable-key',
    }
    await deliveryApi.adjust('order-1', input)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/delivery-orders/order-1/financial-adjustments',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
    )
  })
  it.each([
    [
      'connections',
      () => deliveryApi.connections(),
      '/integrations/food-delivery/connections',
      'GET',
    ],
    [
      'bindings',
      () => deliveryApi.bindings('c1'),
      '/integrations/food-delivery/connections/c1/outlets',
      'GET',
    ],
    [
      'menu',
      () => deliveryApi.menu('b1', { categories: [] }, 2),
      '/integrations/food-delivery/outlets/b1/menu',
      'PUT',
    ],
    [
      'operations',
      () =>
        deliveryApi.operate('b1', {
          action: 'RECONCILE',
          date: '2026-10-02',
          idempotencyKey: 'stable-key',
        }),
      '/integrations/food-delivery/outlets/b1/operations',
      'POST',
    ],
    [
      'health',
      () => deliveryApi.health(),
      '/integrations/food-delivery/health',
      'GET',
    ],
    [
      'replay',
      () => deliveryApi.replay('e1'),
      '/integrations/food-delivery/events/e1/replay',
      'POST',
    ],
    [
      'fulfillment',
      () => deliveryApi.fulfillment('o1'),
      '/delivery-orders/o1/fulfillment',
      'GET',
    ],
    [
      'resolution',
      () => deliveryApi.resolve('c1', 'SUCCEEDED', 'Verified provider record'),
      '/delivery-commands/c1/resolve',
      'POST',
    ],
  ] as const)(
    'uses the dedicated %s endpoint',
    async (_, call, path, method) => {
      await call()
      expect(fetchMock).toHaveBeenCalledWith(
        `/api${path}`,
        expect.objectContaining({ method })
      )
    }
  )
})
