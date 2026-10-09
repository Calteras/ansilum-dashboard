import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { AuthRequestError, loginApi } from '../api/auth.api'
import { listTenantsApi, setActiveTenantApi } from '../api/tenant.api'
import { readPendingVerification } from '../verification/pending-email'
import { useLogin } from './use-login'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('../api/auth.api', async (original) => ({
  ...(await original<typeof import('../api/auth.api')>()),
  loginApi: vi.fn(),
}))
vi.mock('../api/tenant.api', () => ({
  listTenantsApi: vi.fn(),
  setActiveTenantApi: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
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
const tenant = {
  id: 'tenant',
  name: 'Shop',
  slug: 'shop',
  isActive: true,
  createdAt: '',
}
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  useAuthStore.getState().clearAuth()
})
function setup() {
  const hook = renderHook(() => useLogin(), { wrapper })
  act(() => {
    hook.result.current.form.setValue('email', user.email)
    hook.result.current.form.setValue('password', 'Password1')
    hook.result.current.challenge.onToken('fresh')
  })
  return hook
}
describe('login flow', () => {
  it('routes unverified accounts to check-email without authentication or tenant calls', async () => {
    vi.mocked(loginApi).mockRejectedValue(
      new AuthRequestError(403, 'EMAIL_NOT_VERIFIED')
    )
    const { result } = setup()
    await act(async () => result.current.onSubmit())
    expect(navigate).toHaveBeenCalledWith({ to: '/auth/check-email' })
    expect(readPendingVerification().email).toBe(user.email)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(listTenantsApi).not.toHaveBeenCalled()
    expect(result.current.form.getValues('password')).toBe('')
    expect(result.current.challenge.ready).toBe(false)
  })
  it.each([undefined, 'tenant'])(
    'preserves verified login and tenant selection with active tenant %s',
    async (activeTenantId) => {
      vi.mocked(loginApi).mockResolvedValue({
        user,
        session: { ...session, activeTenantId },
      })
      vi.mocked(listTenantsApi).mockResolvedValue([
        { id: 'membership', tenant, role: 'OWNER', memberSince: '' },
      ])
      const { result } = setup()
      await act(async () => result.current.onSubmit())
      expect(useAuthStore.getState().activeTenant).toEqual(tenant)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(navigate).toHaveBeenCalledWith({ to: '/' })
      expect(setActiveTenantApi).toHaveBeenCalledTimes(activeTenantId ? 0 : 1)
    }
  )
  it('starts business onboarding only after authenticated login without tenants', async () => {
    vi.mocked(loginApi).mockResolvedValue({ user, session })
    vi.mocked(listTenantsApi).mockResolvedValue([])
    const { result } = setup()
    await act(async () => result.current.onSubmit())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(navigate).toHaveBeenCalledWith({ to: '/onboarding' })
  })
  it('blocks missing CAPTCHA and duplicate submits while pending', async () => {
    let reject!: (error: Error) => void
    vi.mocked(loginApi).mockImplementation(
      () =>
        new Promise((_resolve, rejectRequest) => {
          reject = rejectRequest
        })
    )
    const { result } = setup()
    act(() => result.current.challenge.onToken(null))
    await act(async () => result.current.onSubmit())
    expect(loginApi).not.toHaveBeenCalled()
    act(() => result.current.challenge.onToken('fresh'))
    let pending!: Promise<void>
    act(() => {
      pending = result.current.onSubmit()
    })
    await waitFor(() => expect(result.current.isLoading).toBe(true))
    await act(async () => result.current.onSubmit())
    expect(loginApi).toHaveBeenCalledTimes(1)
    await act(async () => {
      reject(new AuthRequestError(401))
      await pending
    })
    expect(navigate).not.toHaveBeenCalled()
  })
  it('uses a fresh challenge for a rate-limited retry', async () => {
    vi.mocked(loginApi).mockRejectedValue(
      new AuthRequestError(429, '', Date.now() + 3600_000)
    )
    const { result } = setup()
    await act(async () => result.current.onSubmit())
    expect(result.current.cooldown.remaining).toBeGreaterThan(3590)
    expect(result.current.challenge.ready).toBe(false)
  })
})
