import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  loginApi,
  logoutApi,
  signUpApi,
  resendVerificationApi,
  requestPasswordResetApi,
  retryAfterDeadline,
  getSessionApi,
} from './auth.api'

const account = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password1',
}
const session = {
  user: { id: 'user', email: account.email },
  session: { id: 'session', activeTenantId: 'tenant' },
}
const fetchMock = vi.fn()
const response = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers })
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('cookie authentication transport', () => {
  it.each(['new signup', 'duplicate signup'])(
    'accepts generic %s with null user and token',
    async () => {
      const generic = {
        token: null,
        user: null,
        message: 'Check your email to verify your Ansilum POS account.',
      }
      fetchMock.mockResolvedValue(response(generic))
      expect(await signUpApi(account, 'fresh')).toEqual(generic)
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        '/api/auth/sign-up/email',
        expect.objectContaining({
          credentials: 'include',
          body: JSON.stringify(account),
          headers: expect.objectContaining({ 'X-Captcha-Response': 'fresh' }),
        })
      )
    }
  )
  it('confirms the session after login, retaining backend session and tenant values', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ token: 'ignored' }))
      .mockResolvedValueOnce(response(session))
    expect(await loginApi(account, 'fresh')).toEqual(session)
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/auth/get-session?disableCookieCache=true'
    )
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      credentials: 'include',
      cache: 'no-store',
    })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: account.email,
      password: account.password,
    })
  })
  it('rejects login without a confirmed session', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ user: session.user }))
      .mockResolvedValueOnce(response(null))
    await expect(loginApi(account, 'fresh')).rejects.toMatchObject({
      status: 401,
    })
  })
  it('preserves unverified code without fetching session or resending', async () => {
    fetchMock.mockResolvedValue(response({ code: 'EMAIL_NOT_VERIFIED' }, 403))
    await expect(loginApi(account, 'fresh')).rejects.toMatchObject({
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it.each([
    { code: 'EMAIL_MISMATCH', message: 'private diagnostics' },
    { error: { code: 'EMAIL_MISMATCH', message: 'private diagnostics' } },
  ])('retains the safe mismatch code from a backend error', async (body) => {
    fetchMock.mockResolvedValue(response(body, 400))
    await expect(
      resendVerificationApi(account.email, 'fresh')
    ).rejects.toMatchObject({
      status: 400,
      code: 'EMAIL_MISMATCH',
      message: expect.stringContaining('signed in to a different account'),
    })
  })
  it('does not expose unrecognized backend diagnostics', async () => {
    fetchMock.mockResolvedValue(
      response({ code: 'PRIVATE_DIAGNOSTIC', message: account.email }, 400)
    )
    await expect(
      resendVerificationApi(account.email, 'fresh')
    ).rejects.toMatchObject({
      code: '',
      message:
        'The request could not be completed. Please check your details and try again.',
    })
  })
  it('uses safe invalid-credential feedback', async () => {
    fetchMock.mockResolvedValue(response({ message: account.email }, 401))
    await expect(loginApi(account, 'fresh')).rejects.toThrow(
      'Invalid email or password.'
    )
  })
  it.each([resendVerificationApi, requestPasswordResetApi])(
    'sends fresh CAPTCHA headers without callback URLs',
    async (request) => {
      fetchMock.mockResolvedValue(response({}))
      await request(account.email, 'fresh')
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        credentials: 'include',
        body: JSON.stringify({ email: account.email }),
        headers: { 'X-Captcha-Response': 'fresh' },
      })
    }
  )
  it('rejects a missing CAPTCHA without making a request', async () => {
    await expect(signUpApi(account, '')).rejects.toMatchObject({ status: 400 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('handles non-JSON 503 and uncertain network failures safely', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockRejectedValueOnce(new Error('private transport data'))
    await expect(signUpApi(account, 'one')).rejects.toMatchObject({
      status: 503,
    })
    await expect(signUpApi(account, 'two')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('could not confirm'),
    })
  })
  it('reads Retry-After even from a non-JSON rate-limit response', async () => {
    fetchMock.mockResolvedValue(
      new Response('limited', {
        status: 429,
        headers: { 'Retry-After': '3600' },
      })
    )
    const now = Date.now()
    await expect(
      resendVerificationApi(account.email, 'fresh')
    ).rejects.toMatchObject({ status: 429, retryAt: expect.any(Number) })
    expect(Date.now() - now).toBeLessThan(2000)
  })
  it('supports wrapped sessions and empty sign-out responses', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ data: session }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    expect(await getSessionApi()).toEqual(session)
    await expect(logoutApi()).resolves.toBeUndefined()
  })
})

describe('Retry-After deadlines', () => {
  const now = Date.UTC(2026, 8, 26)
  it.each([
    ['60', 60],
    ['3600', 3600],
    ['1.5', 1.5],
    [null, 60],
    ['', 60],
    ['garbage', 60],
    ['-1', 60],
    ['0', 60],
  ])('parses %s', (value, seconds) => {
    expect(retryAfterDeadline(value, now)).toBe(now + seconds * 1000)
  })
  it('supports HTTP dates and expired dates', () => {
    expect(
      retryAfterDeadline(new Date(now + 7200_000).toUTCString(), now)
    ).toBe(now + 7200_000)
    expect(retryAfterDeadline(new Date(now - 1000).toUTCString(), now)).toBe(
      now + 60_000
    )
  })
})
