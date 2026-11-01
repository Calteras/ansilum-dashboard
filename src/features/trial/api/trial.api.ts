import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import { deviceId } from '@/lib/device-id'

/**
 * Free trial and account verification (ansilum-be docs/TRUST_AND_TRIALS.md).
 * The server decides everything; these calls only ask and report.
 */
export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'FULL'

type TrialState =
  | 'UNAVAILABLE'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'BUSINESS_REQUIRED'
  | 'EXISTING_CUSTOMER'
  | 'ELIGIBLE'
  | 'VERIFICATION_REQUIRED'
  | 'REVIEW_REQUIRED'
  | 'UNDER_REVIEW'
  | 'ALREADY_CLAIMED'
  | 'NOT_ELIGIBLE'
  | 'ACTIVE'
  | 'ENDED'

export interface TrialOffer {
  code: string
  tier: SubscriptionTier
  durationDays: number
  aiUnits: number
  maxTenants: number
  maxOutlets: number
}

interface TrialSummary {
  status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED' | 'REVOKED'
  tier: SubscriptionTier
  startedAt: string
  expiresAt: string
}

export interface TrialView {
  state: TrialState
  offer: TrialOffer | null
  requiredSteps: 'PHONE'[]
  canRequestReview: boolean
  trial: TrialSummary | null
}

interface TrialUsage {
  active: boolean
  expiresAt?: string
  tenants?: { used: number; limit: number }
  outlets?: { used: number; limit: number }
  aiUnits?: { granted: number; remaining: number; exhausted: boolean }
}

export interface PhoneChallenge {
  challengeId: string
  phone: string
  expiresAt: string
  resendAfterSeconds: number
}

/** A failed call, with the server's stable code for the UI to act on. */
export class TrialApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly detail: Record<string, unknown> = {}
  ) {
    super(message)
  }
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  const device = deviceId()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(device && { 'X-Terrapos-Device-Id': device }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    const message = Array.isArray(json.message)
      ? json.message.join(' ')
      : typeof json.message === 'string'
        ? json.message
        : `Request failed with status ${response.status}`
    throw new TrialApiError(message, response.status, json.code, json)
  }
  // Responses come in the standard envelope.
  return (json.data ?? json) as T
}

export const getTrialEligibilityApi = () =>
  request<TrialView>('/trial/eligibility')

export const activateTrialApi = (input: {
  idempotencyKey: string
  challengeToken?: string
}) =>
  request<TrialView & { activated: boolean; replayed?: boolean }>(
    '/trial/activate',
    'POST',
    input
  )

export const getTrialUsageApi = () => request<TrialUsage>('/trial/usage')

export const requestTrialReviewApi = (message?: string) =>
  request<TrialView>('/trial/review-request', 'POST', { message })

export const requestPhoneCodeApi = (input: {
  phone: string
  challengeToken?: string
}) => request<PhoneChallenge>('/verification/phone/request', 'POST', input)

export const confirmPhoneCodeApi = (input: {
  challengeId: string
  code: string
}) =>
  request<{ verified: true; phone: string }>(
    '/verification/phone/confirm',
    'POST',
    input
  )
