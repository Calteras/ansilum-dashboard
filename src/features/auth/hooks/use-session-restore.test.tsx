import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { getSessionApi } from '../api/auth.api'
import { listTenantsApi, getActiveTenantApi } from '../api/tenant.api'
import { useSessionRestore } from './use-session-restore'

vi.mock('../api/auth.api', () => ({ getSessionApi: vi.fn() }))
vi.mock('../api/tenant.api', () => ({
  listTenantsApi: vi.fn(),
  getActiveTenantApi: vi.fn(),
}))
const user = {
  id: 'user',
  name: 'User',
  email: 'test@example.com',
  emailVerified: true,
  createdAt: '',
  updatedAt: '',
}
const session = {
  id: 'session',
  userId: 'user',
  token: 'session-token',
  expiresAt: '2030-01-01',
}
beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().clearAuth()
})
it('does not trust stale in-memory auth when the backend session is absent', async () => {
  useAuthStore.getState().setAuth(user, session)
  vi.mocked(getSessionApi).mockResolvedValue(null)
  const { result } = renderHook(() => useSessionRestore())
  await waitFor(() => expect(result.current.isPending).toBe(false))
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(listTenantsApi).not.toHaveBeenCalled()
})
it('fails closed when session confirmation fails', async () => {
  vi.mocked(getSessionApi).mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useSessionRestore())
  await waitFor(() => expect(result.current.isPending).toBe(false))
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
})
it('restores confirmed sessions and active tenant', async () => {
  const tenant = {
    id: 'tenant',
    name: 'Shop',
    slug: 'shop',
    isActive: true,
    createdAt: '',
  }
  vi.mocked(getSessionApi).mockResolvedValue({ user, session })
  vi.mocked(listTenantsApi).mockResolvedValue([
    { id: 'membership', tenant, role: 'OWNER', memberSince: '' },
  ])
  vi.mocked(getActiveTenantApi).mockResolvedValue(tenant)
  const { result } = renderHook(() => useSessionRestore())
  await waitFor(() => expect(result.current.isPending).toBe(false))
  expect(useAuthStore.getState().isAuthenticated).toBe(true)
  expect(useAuthStore.getState().activeTenant).toEqual(tenant)
})
it('ignores in-flight session results after unmount', async () => {
  let resolve!: (value: { user: typeof user; session: typeof session }) => void
  vi.mocked(getSessionApi).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  const { unmount } = renderHook(() => useSessionRestore())
  unmount()
  await act(async () => resolve({ user, session }))
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(listTenantsApi).not.toHaveBeenCalled()
})
