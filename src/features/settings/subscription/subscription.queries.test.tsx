import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { getCurrentSubscriptionApi } from './subscription.api'
import { useCurrentSubscriptionQuery } from './subscription.queries'

vi.mock('./subscription.api', () => ({
  getCurrentSubscriptionApi: vi.fn(),
  listSubscriptionPlansApi: vi.fn(),
  subscribeApi: vi.fn(),
  getSubscriptionOrderApi: vi.fn(),
}))
const login = (id: string) =>
  useAuthStore
    .getState()
    .setAuth(
      {
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
        createdAt: '',
        updatedAt: '',
      },
      { id: 'session', userId: id, token: '', expiresAt: '2030-01-01' }
    )
const entitlement = (tier: 'FULL' | 'BASIC', id = 'account') => ({
  data: {
    tier,
    userId: id,
    status: null,
    limits: { tenants: 5, outlets: 5 },
    usage: { tenants: 2, outlets: 5 },
    remaining: { tenants: 3, outlets: 0 },
    features: [],
    overTenantLimit: false,
    overOutletLimit: false,
    canCreateTenant: true,
    canCreateOutlet: false,
  },
  meta: {},
})
const wrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().clearAuth()
})
it('loads the account before tenant selection and keeps FULL across tenant switches', async () => {
  login('account')
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue(entitlement('FULL'))
  const { result } = renderHook(() => useCurrentSubscriptionQuery(), {
    wrapper: wrapper(),
  })
  await waitFor(() => expect(result.current.data?.data.tier).toBe('FULL'))
  for (const id of ['tenant-a', 'tenant-b']) {
    act(() =>
      useAuthStore
        .getState()
        .setActiveTenant({
          id,
          name: id,
          slug: id,
          isActive: true,
          createdAt: '',
        })
    )
    expect(result.current.data?.data.tier).toBe('FULL')
    expect(result.current.data?.data.usage.outlets).toBe(5)
    expect(result.current.data?.data.canCreateOutlet).toBe(false)
  }
  expect(getCurrentSubscriptionApi).toHaveBeenCalledTimes(1)
})
it('does not reuse another signed-in account’s paid entitlement', async () => {
  login('account')
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValueOnce(
    entitlement('FULL')
  )
  const { result } = renderHook(() => useCurrentSubscriptionQuery(), {
    wrapper: wrapper(),
  })
  await waitFor(() => expect(result.current.data?.data.tier).toBe('FULL'))
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValueOnce(
    entitlement('BASIC', 'other')
  )
  act(() => login('other'))
  expect(result.current.data?.data.tier).not.toBe('FULL')
  await waitFor(() => expect(result.current.data?.data.tier).toBe('BASIC'))
})
