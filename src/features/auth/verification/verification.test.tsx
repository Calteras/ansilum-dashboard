import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render as renderUI,
  screen,
  waitFor,
} from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { SignupStepForm } from '../onboarding/components/signup-step-form'
import {
  sanitizeVerificationLocation,
  initialVerificationError,
} from './callback-location'
import { CheckEmail, EmailVerified } from './pages'
import {
  savePendingVerification,
  readPendingVerification,
} from './pending-email'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))
vi.mock('../auth-layout', () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('../components/turnstile-challenge', () => ({
  TurnstileChallenge: ({
    onToken,
  }: {
    onToken: (value: string | null) => void
  }) => (
    <>
      <button type='button' onClick={() => onToken('fresh-challenge')}>
        Complete CAPTCHA
      </button>
      <button type='button' onClick={() => onToken(null)}>
        Expire CAPTCHA
      </button>
    </>
  ),
}))
const fetchMock = vi.fn()
const generic = {
  token: null,
  user: null,
  message: 'Check your email to verify your TerraPOS account.',
}
beforeEach(() => {
  vi.clearAllMocks()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  sessionStorage.clear()
  useAuthStore.getState().clearAuth()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
function render(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    ...renderUI(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
    queryClient,
  }
}
function fillSignup() {
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'Test User' },
  })
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'test@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
    target: { value: 'Password1' },
  })
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: 'Password1' },
  })
}
function complete() {
  fireEvent.click(screen.getByText('Complete CAPTCHA'))
}

describe('signup verification handoff', () => {
  it.each(['new', 'duplicate'])(
    'uses the same check-email flow for %s accounts without authenticating',
    async () => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify(generic)))
      render(<SignupStepForm />)
      fillSignup()
      complete()
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/auth/check-email' })
      )
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(readPendingVerification()).toMatchObject({
        email: 'test@example.com',
        deadline: expect.any(Number),
      })
      expect(readPendingVerification().deadline).toBeGreaterThan(
        Date.now() + 58_000
      )
      expect(screen.getByLabelText('Password', { exact: true })).toHaveValue('')
      expect(screen.getByLabelText('Confirm Password')).toHaveValue('')
      expect(
        sessionStorage.getItem('terrapos.pending-verification')
      ).not.toContain('Password1')
    }
  )
  it.each([503, 0])(
    'offers retry or resend after uncertain status %s without assuming success',
    async (status) => {
      if (status)
        fetchMock.mockResolvedValue(new Response('unavailable', { status }))
      else fetchMock.mockRejectedValue(new Error('network'))
      render(<SignupStepForm />)
      fillSignup()
      complete()
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await screen.findByRole('alert')
      expect(screen.getByRole('alert')).toHaveTextContent('could not confirm')
      expect(
        screen.getByRole('link', { name: 'Request verification email' })
      ).toHaveAttribute('href', '/auth/check-email')
      expect(navigate).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    }
  )
})

describe('check-email and explicit resend', () => {
  it('works without saved state and never resends on mount or remount', () => {
    const view = render(<CheckEmail />)
    expect(screen.getByLabelText('Email address')).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    view.unmount()
    render(<CheckEmail />)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('shows saved email and signup cooldown across refresh', () => {
    savePendingVerification('test@example.com', Date.now() + 60_000)
    render(<CheckEmail />)
    complete()
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'test@example.com'
    )
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    expect(screen.getByText(/try again in 60 seconds/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('uses generic success, starts countdown and resets CAPTCHA', async () => {
    fetchMock.mockResolvedValue(new Response('{}'))
    render(<CheckEmail />)
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    })
    complete()
    fireEvent.click(
      screen.getByRole('button', { name: 'Resend verification email' })
    )
    await screen.findByText(/If this account needs verification/)
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(readPendingVerification().deadline).toBeGreaterThan(
      Date.now() + 58_000
    )
  })
  it.each(['3600', new Date(Date.now() + 3600_000).toUTCString()])(
    'respects hourly Retry-After %s',
    async (retryAfter) => {
      fetchMock.mockResolvedValue(
        new Response('{}', {
          status: 429,
          headers: { 'Retry-After': retryAfter },
        })
      )
      savePendingVerification('test@example.com')
      render(<CheckEmail />)
      complete()
      fireEvent.click(
        screen.getByRole('button', { name: 'Resend verification email' })
      )
      await screen.findByRole('alert')
      expect(readPendingVerification().deadline).toBeGreaterThan(
        Date.now() + 3590_000
      )
      expect(
        screen.getByRole('button', { name: 'Resend verification email' })
      ).toBeDisabled()
    }
  )
  it('calculates from absolute time after a background gap and never resends on expiry', () => {
    vi.useFakeTimers()
    savePendingVerification('test@example.com', Date.now() + 60_000)
    const view = render(<CheckEmail />)
    complete()
    act(() => {
      vi.setSystemTime(Date.now() + 120_000)
      vi.advanceTimersByTime(1000)
    })
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeEnabled()
    expect(fetchMock).not.toHaveBeenCalled()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('blocks expired CAPTCHA and duplicate requests and requires a new token after network failure', async () => {
    let reject!: (error: Error) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, rejectRequest) => {
          reject = rejectRequest
        })
    )
    savePendingVerification('test@example.com')
    render(<CheckEmail />)
    complete()
    fireEvent.click(screen.getByText('Expire CAPTCHA'))
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    complete()
    const form = screen
      .getByRole('button', { name: 'Resend verification email' })
      .closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => reject(new Error('network')))
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    fetchMock.mockResolvedValue(new Response('{}'))
    complete()
    fireEvent.submit(form)
    await screen.findByText(/If this account needs verification/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('public verification callback', () => {
  it.each([
    [undefined, 'Email verified successfully. You can now sign in.'],
    [
      'token_expired',
      'Verification link expired. Request a new verification email.',
    ],
    [
      'invalid_token',
      'This verification link is invalid. Request a new verification email.',
    ],
    [
      '<script>secret</script>',
      'We could not verify your email. Request a new verification email.',
    ],
  ])(
    'renders safe callback state %s without authentication or backend requests',
    (error, message) => {
      render(<EmailVerified error={error} />)
      expect(screen.getByText(message)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/sign-in-2'
      )
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(fetchMock).not.toHaveBeenCalled()
      if (error) expect(screen.getByLabelText('Email address')).toHaveValue('')
      expect(document.body.innerHTML).not.toContain('<script>secret</script>')
    }
  )
  it('removes callback queries and fragments before instrumentation and retains only safe error state', () => {
    window.history.replaceState(
      {},
      '',
      '/auth/email-verified?error=token_expired&token=private#private'
    )
    sanitizeVerificationLocation()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(initialVerificationError()).toBe('token_expired')
    sanitizeVerificationLocation() // Reload after the query was stripped.
    expect(initialVerificationError()).toBe('token_expired')
    window.history.replaceState({}, '', '/')
  })
})

describe('verification session conflict recovery', () => {
  const signedInUser = {
    id: 'other',
    email: 'other@example.com',
    name: 'Other',
    emailVerified: true,
    createdAt: '',
    updatedAt: '',
  }
  const signedInSession = {
    id: 'session',
    userId: 'other',
    token: 'cookie-session',
    expiresAt: '2030-01-01',
  }
  async function conflict() {
    useAuthStore.getState().setAuth(signedInUser, signedInSession)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 'EMAIL_MISMATCH',
          message: 'private diagnostics',
        }),
        { status: 400 }
      )
    )
    const view = render(<CheckEmail />)
    view.queryClient.setQueryData(['private-tenant-data'], { value: 'cached' })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    })
    complete()
    fireEvent.click(
      screen.getByRole('button', { name: 'Resend verification email' })
    )
    await screen.findByText(/This browser is signed in to a different account/)
    return view
  }
  it('keeps the existing session until explicit sign-out, preserves the pending email and requires a fresh CAPTCHA', async () => {
    const { queryClient } = await conflict()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user).toEqual(signedInUser)
    expect(screen.queryByText('Complete CAPTCHA')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Resend verification email' })
    ).toBeDisabled()
    expect(screen.queryByText(/private diagnostics/)).not.toBeInTheDocument()
    expect(readPendingVerification().email).toBe('new@example.com')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign out of current account' })
    )
    await screen.findByText(/Signed out. Complete a new security check/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/auth/sign-out',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    ])
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(queryClient.getQueryData(['private-tenant-data'])).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'new@example.com'
    )
    expect(readPendingVerification().email).toBe('new@example.com')
    const submit = screen.getByRole('button', {
      name: 'Resend verification email',
    })
    expect(submit).toBeDisabled()
    fireEvent.submit(submit.closest('form')!)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    fetchMock.mockResolvedValueOnce(new Response('{}'))
    complete()
    fireEvent.click(submit)
    await screen.findByText(/If this account needs verification/)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][0]).toBe('/api/auth/send-verification-email')
  })
  it.each(['network', '503'])(
    'retains recovery and auth state when sign-out fails with %s',
    async (failure) => {
      await conflict()
      if (failure === 'network')
        fetchMock.mockRejectedValueOnce(new Error('offline'))
      else
        fetchMock.mockResolvedValueOnce(
          new Response('unavailable', { status: 503 })
        )
      fireEvent.click(
        screen.getByRole('button', { name: 'Sign out of current account' })
      )
      await screen.findByText(/could not confirm sign-out completed/)
      expect(useAuthStore.getState().user).toEqual(signedInUser)
      expect(
        screen.getByRole('button', { name: 'Sign out of current account' })
      ).toBeEnabled()
      expect(
        screen.getByRole('button', { name: 'Resend verification email' })
      ).toBeDisabled()
      expect(readPendingVerification().email).toBe('new@example.com')
      expect(fetchMock).toHaveBeenCalledTimes(2)
      fetchMock.mockResolvedValueOnce(new Response('{}'))
      fireEvent.click(
        screen.getByRole('button', { name: 'Sign out of current account' })
      )
      await screen.findByText(/Signed out. Complete a new security check/)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    }
  )
  it('prevents duplicate sign-out and resend while sign-out is pending', async () => {
    await conflict()
    let resolve!: (value: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const button = screen.getByRole('button', {
      name: 'Sign out of current account',
    })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.submit(button.closest('form')!)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Email address')).toBeDisabled()
    await act(async () => resolve(new Response('{}')))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
