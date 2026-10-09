import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { deliveryApi } from './delivery.api'
import {
  useDeliveryAccess,
  useDeliveryOrders,
  useIntentKey,
} from './delivery.queries'
import { orderFixture } from './test-fixtures'

vi.mock('./delivery.api', () => ({ deliveryApi: { orders: vi.fn() } }))

export function setDeliveryTenant(
  id = 'tenant-a',
  role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER'
) {
  const tenant = { id, name: id, slug: id, isActive: true, createdAt: '' }
  useAuthStore.setState({
    activeTenant: tenant,
    tenants: [{ id: 'membership', tenant, role, memberSince: '' }],
  })
}

describe('delivery query isolation and recovery', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    sessionStorage.clear()
    vi.stubGlobal('crypto', webcrypto)
    setDeliveryTenant()
  })
  afterEach(() => {
    client.clear()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    useAuthStore.getState().clearAuth()
  })
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  it('never reuses another tenant’s orders or recovery cursor', async () => {
    vi.mocked(deliveryApi.orders).mockResolvedValue({
      orders: [orderFixture],
      cursor: 'tenant-a-cursor',
    })
    const hook = renderHook(() => useDeliveryOrders('outlet-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() =>
      expect(hook.result.current.data?.orders).toHaveLength(1)
    )
    vi.mocked(deliveryApi.orders).mockResolvedValue({
      orders: [],
      cursor: null,
    })
    act(() => setDeliveryTenant('tenant-b'))
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(hook.result.current.data?.orders).toEqual([])
    expect(deliveryApi.orders).toHaveBeenLastCalledWith(
      'outlet-1',
      null,
      expect.any(AbortSignal)
    )
    hook.unmount()
  })
  it('retains the cursor and terminal order changes when refetching', async () => {
    vi.mocked(deliveryApi.orders)
      .mockResolvedValueOnce({ orders: [orderFixture], cursor: 'first' })
      .mockResolvedValueOnce({
        orders: [{ ...orderFixture, version: 2, state: 'COMPLETED' }],
        cursor: 'next',
      })
    const hook = renderHook(() => useDeliveryOrders('outlet-1'), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(hook.result.current.data?.orders[0].state).toBe('ACCEPTED')
    await act(() => hook.result.current.refetch())
    expect(deliveryApi.orders).toHaveBeenLastCalledWith(
      'outlet-1',
      'first',
      expect.any(AbortSignal)
    )
    await waitFor(() =>
      expect(hook.result.current.data?.orders[0].state).toBe('COMPLETED')
    )
    hook.unmount()
  })
  it('reuses an intent key across remounts but separates tenants and changed input', async () => {
    const input = { action: 'READY', expectedVersion: 2 }
    const hook = renderHook(() => useIntentKey('order-1'))
    const key = await hook.result.current(input)
    expect(await hook.result.current(input)).toBe(key)
    expect(
      await hook.result.current({ ...input, expectedVersion: 3 })
    ).not.toBe(key)
    hook.unmount()
    const remount = renderHook(() => useIntentKey('order-1'))
    expect(await remount.result.current(input)).toBe(key)
    act(() => setDeliveryTenant('tenant-b'))
    expect(await remount.result.current(input)).not.toBe(key)
    remount.unmount()
  })
  it('keeps owner finance controls distinct from admin access', () => {
    const hook = renderHook(useDeliveryAccess)
    expect(hook.result.current.owner).toBe(true)
    act(() => setDeliveryTenant('tenant-a', 'ADMIN'))
    expect(hook.result.current.admin).toBe(true)
    expect(hook.result.current.owner).toBe(false)
    act(() => setDeliveryTenant('tenant-a', 'MEMBER'))
    expect(hook.result.current.admin).toBe(false)
    hook.unmount()
  })
})
