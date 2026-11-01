import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { featureTierOf } from '@/lib/subscription-access'
import {
  TrialApiError,
  activateTrialApi,
  getTrialEligibilityApi,
  getTrialUsageApi,
  requestTrialReviewApi,
  type TrialView,
} from './api/trial.api'
import { TrialOffer } from './components/trial-offer'
import { daysLeft, restartsPhoneStep, trialErrorMessage } from './lib/trial'

vi.mock('./api/trial.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/trial.api')>()),
  getTrialEligibilityApi: vi.fn(),
  activateTrialApi: vi.fn(),
  getTrialUsageApi: vi.fn(),
  requestTrialReviewApi: vi.fn(),
}))

const en = (_id: string, english: string) => english

const offer = {
  code: 'TRIAL_2026',
  tier: 'FULL' as const,
  durationDays: 14,
  aiUnits: 30,
  maxTenants: 1,
  maxOutlets: 1,
}
const view = (overrides: Partial<TrialView> = {}): TrialView => ({
  state: 'ELIGIBLE',
  offer,
  requiredSteps: [],
  canRequestReview: false,
  trial: null,
  ...overrides,
})

function signIn() {
  const auth = useAuthStore.getState()
  auth.clearAuth()
  auth.setAuth(
    {
      id: 'user',
      name: 'User',
      email: 'user@example.test',
      emailVerified: true,
      createdAt: '',
      updatedAt: '',
    },
    { id: 'session', userId: 'user', token: '', expiresAt: '2030-01-01' }
  )
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return render(<TrialOffer />, { wrapper })
}

beforeEach(() => {
  vi.mocked(getTrialEligibilityApi).mockReset()
  vi.mocked(activateTrialApi).mockReset()
  vi.mocked(getTrialUsageApi).mockReset()
  vi.mocked(requestTrialReviewApi).mockReset()
  signIn()
})

describe('trial helpers', () => {
  it('maps server codes to messages and never echoes server text', () => {
    expect(
      trialErrorMessage(
        new TrialApiError('x', 429, 'TOO_MANY_REQUESTS', { retryAfter: 90 }),
        en
      )
    ).toBe('Too many attempts. Try again in 2 minutes.')
    expect(
      trialErrorMessage(
        new TrialApiError('x', 400, 'INVALID_CODE', { attemptsRemaining: 2 }),
        en
      )
    ).toBe('That code is wrong. 2 attempts left.')
    expect(
      trialErrorMessage(new TrialApiError('internal detail', 500, 'X'), en)
    ).toBe('Something went wrong. Please try again.')
    expect(restartsPhoneStep(new TrialApiError('x', 400, 'CODE_EXPIRED'))).toBe(
      true
    )
    expect(restartsPhoneStep(new TrialApiError('x', 400, 'INVALID_CODE'))).toBe(
      false
    )
  })

  it('counts days left and unlocks features by the higher of plan and trial', () => {
    const now = Date.parse('2026-11-01T00:00:00Z')
    expect(daysLeft('2026-11-14T12:00:00Z', now)).toBe(14)
    expect(daysLeft('2026-11-01T01:00:00Z', now)).toBe(1)
    expect(featureTierOf({ tier: 'BASIC', featureTier: 'FULL' })).toBe('FULL')
    expect(featureTierOf({ tier: 'STANDARD' })).toBe('STANDARD')
    expect(featureTierOf(undefined)).toBe('BASIC')
  })
})

describe('TrialOffer', () => {
  it('shows nothing while the offer is off or for existing customers', async () => {
    vi.mocked(getTrialEligibilityApi).mockResolvedValue(
      view({ state: 'UNAVAILABLE', offer: null })
    )
    const { container } = setup()
    await waitFor(() => expect(getTrialEligibilityApi).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('starts the trial with an idempotency key and shows the result', async () => {
    vi.mocked(getTrialEligibilityApi)
      .mockResolvedValueOnce(view())
      .mockResolvedValue(
        view({
          state: 'ACTIVE',
          trial: {
            status: 'ACTIVE',
            tier: 'FULL',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          },
        })
      )
    vi.mocked(activateTrialApi).mockResolvedValue({
      ...view({ state: 'ACTIVE' }),
      activated: true,
    })
    vi.mocked(getTrialUsageApi).mockResolvedValue({ active: false })
    setup()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Start the trial' })
    )
    const [input] = vi.mocked(activateTrialApi).mock.calls[0]
    expect(input.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/)
    expect(await screen.findByText(/Full trial active/)).toBeInTheDocument()
  })

  it('explains a refused attempt without leaking why', async () => {
    vi.mocked(getTrialEligibilityApi).mockResolvedValue(view())
    vi.mocked(activateTrialApi).mockRejectedValue(
      new TrialApiError('raw', 503, 'TEMPORARILY_UNAVAILABLE')
    )
    setup()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Start the trial' })
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verification is temporarily unavailable'
    )
  })

  it('lets a separate business ask for a review once a trial was used', async () => {
    vi.mocked(getTrialEligibilityApi).mockResolvedValue(
      view({ state: 'ALREADY_CLAIMED', canRequestReview: true })
    )
    vi.mocked(requestTrialReviewApi).mockResolvedValue(
      view({ state: 'UNDER_REVIEW' })
    )
    setup()
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'This is a different business',
      })
    )
    await userEvent.type(
      screen.getByLabelText('Details'),
      'Kedai kopi kedua di Bandung, pemilik berbeda.'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() =>
      expect(requestTrialReviewApi).toHaveBeenCalledWith(
        'Kedai kopi kedua di Bandung, pemilik berbeda.'
      )
    )
  })
})
