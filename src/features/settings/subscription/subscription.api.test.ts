import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import {
  getCurrentSubscriptionApi,
  getSubscriptionOrderApi,
  listSubscriptionPlansApi,
} from './subscription.api'

beforeEach(() => {
  useAuthStore.getState().clearAuth()
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(async () => Response.json({ data: { tier: 'FULL' } }))
  )
})
afterEach(() => vi.unstubAllGlobals())
it('reads billing without requiring a selected tenant', async () => {
  expect((await getCurrentSubscriptionApi()).data.tier).toBe('FULL')
  await listSubscriptionPlansApi()
  await getSubscriptionOrderApi('order')
  expect(fetch).toHaveBeenCalledTimes(3)
  for (const [, options] of vi.mocked(fetch).mock.calls) {
    expect(options?.credentials).toBe('include')
    expect(options?.headers).toBeUndefined()
  }
})
it('does not scope account entitlement to the tenant selected in the UI', async () => {
  useAuthStore.getState().setActiveTenant({
    id: 'b',
    name: 'B',
    slug: 'b',
    isActive: true,
    createdAt: '',
  })
  await getCurrentSubscriptionApi()
  expect(fetch).toHaveBeenCalledWith('/api/subscriptions/current', {
    credentials: 'include',
    cache: 'no-store',
  })
})

it('extracts QRIS, GoPay and Mandiri instructions from the backend order payload', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      data: {
        id: 'order',
        midtransResponse: {
          bill_key: '123',
          biller_code: '70012',
          actions: [
            { name: 'generate-qr-code', url: 'https://payments.example/qr' },
            { name: 'deeplink-redirect', url: 'gojek://payment' },
          ],
        },
      },
    })
  )
  const result = await getSubscriptionOrderApi('order')
  expect(result.data.billKey).toBe('123')
  expect(result.data.billerCode).toBe('70012')
  expect(result.data.qrCodeUrl).toBe('https://payments.example/qr')
  expect(result.data.deeplinkUrl).toBe('gojek://payment')
})
