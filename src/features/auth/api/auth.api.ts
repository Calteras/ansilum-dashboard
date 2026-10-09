import { API_BASE_URL } from '@/config/api.config'
import type { LoginCredentials, SignUpData, AuthResponse } from './auth.types'

export function retryAfterDeadline(
  value: string | null,
  now = Date.now()
): number {
  if (value?.trim()) {
    const seconds = /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : NaN
    const deadline = Number.isFinite(seconds)
      ? now + seconds * 1000
      : Date.parse(value)
    if (Number.isFinite(deadline) && deadline > now) return deadline
  }
  return now + 60_000
}

// Deliberately excludes response bodies, request data, and backend diagnostics.
export class AuthRequestError extends Error {
  constructor(
    public status: number,
    public code = '',
    public retryAt = 0
  ) {
    super(
      status === 429
        ? 'Too many requests. Please wait before trying again.'
        : code === 'EMAIL_NOT_VERIFIED'
          ? 'Verify your email before signing in.'
          : code === 'EMAIL_MISMATCH'
            ? 'This browser is signed in to a different account. Sign out of that account to request verification for this email.'
            : status === 401
              ? 'Invalid email or password.'
              : status === 0 || status >= 500
                ? 'We could not confirm the request completed. Please try again.'
                : 'The request could not be completed. Please check your details and try again.'
    )
  }
}

async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new AuthRequestError(0)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    // Only retain codes the UI handles; never echo arbitrary diagnostics.
    const code = data?.code ?? data?.error?.code
    throw new AuthRequestError(
      response.status,
      ['EMAIL_NOT_VERIFIED', 'EMAIL_MISMATCH'].includes(code) ? code : '',
      response.status === 429
        ? retryAfterDeadline(response.headers.get('Retry-After'))
        : 0
    )
  }
  return data as T
}

function challengeOptions(body: object, captchaToken: string): RequestInit {
  if (!captchaToken) throw new AuthRequestError(400)
  return {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'X-Captcha-Response': captchaToken },
  }
}

export async function getSessionApi(): Promise<AuthResponse | null> {
  const result = await authFetch<AuthResponse | { data: AuthResponse } | null>(
    '/get-session?disableCookieCache=true',
    { cache: 'no-store' }
  )
  const data = result && ('data' in result ? result.data : result)
  return data?.user?.id && data?.session?.id ? data : null
}

export async function loginApi(
  credentials: LoginCredentials,
  captchaToken: string
): Promise<AuthResponse> {
  await authFetch(
    '/sign-in/email',
    challengeOptions(
      { email: credentials.email, password: credentials.password },
      captchaToken
    )
  )
  const session = await getSessionApi()
  if (!session) throw new AuthRequestError(401)
  return session
}

export interface SignUpResponse {
  token: null
  user: null
  message: string
}
export async function signUpApi(
  data: SignUpData,
  captchaToken: string
): Promise<SignUpResponse> {
  return authFetch(
    '/sign-up/email',
    challengeOptions(
      { name: data.name, email: data.email, password: data.password },
      captchaToken
    )
  )
}
export async function resendVerificationApi(
  email: string,
  captchaToken: string
): Promise<void> {
  await authFetch(
    '/send-verification-email',
    challengeOptions({ email }, captchaToken)
  )
}
export async function requestPasswordResetApi(
  email: string,
  captchaToken: string
): Promise<void> {
  await authFetch(
    '/request-password-reset',
    challengeOptions({ email }, captchaToken)
  )
}
export async function logoutApi(): Promise<void> {
  await authFetch('/sign-out', { method: 'POST' })
}
