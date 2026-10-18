import { API_BASE_URL } from '@/config/api.config'
import type {
  OrderLineProblem,
  OutletMenu,
  PlaceOrderRequest,
  PublicOrder,
  Storefront,
} from './storefront.types'

/**
 * A storefront request that did not succeed. `code` is the backend's stable
 * error code (STORE_UNAVAILABLE, PRICE_CHANGED, …); customer screens choose
 * their own wording from it and never show raw server messages.
 */
export class StorefrontApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly body: Record<string, unknown> = {}
  ) {
    super(code)
  }
  get problems(): OrderLineProblem[] {
    return Array.isArray(this.body.problems)
      ? (this.body.problems as OrderLineProblem[])
      : []
  }
  get retryAfter(): number | null {
    const value = Number(this.body.retryAfter)
    return Number.isFinite(value) && value > 0 ? value : null
  }
}

const enc = encodeURIComponent

async function publicRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/public${path}`, {
      ...init,
      // No cookies: these endpoints never depend on who is signed in.
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new StorefrontApiError(0, 'NETWORK')
  }
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >
  if (!response.ok) {
    const data =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : {}
    const retryAfter = response.headers.get('Retry-After')
    const merged = { ...data, ...body, ...(retryAfter ? { retryAfter } : {}) }
    const code =
      typeof body.code === 'string'
        ? body.code
        : typeof data.code === 'string'
          ? data.code
          : `HTTP_${response.status}`
    throw new StorefrontApiError(response.status, code, merged)
  }
  return body.data as T
}

export function getStorefront(slug: string) {
  return publicRequest<Storefront>(`/storefronts/${enc(slug)}`)
}

export function getOutletMenu(slug: string, outletId: string) {
  return publicRequest<OutletMenu>(
    `/storefronts/${enc(slug)}/outlets/${enc(outletId)}/catalog`
  )
}

export function placeOrder(
  slug: string,
  order: PlaceOrderRequest,
  challengeToken?: string | null
) {
  return publicRequest<PublicOrder>(`/storefronts/${enc(slug)}/orders`, {
    method: 'POST',
    body: JSON.stringify(order),
    headers: challengeToken ? { 'X-Captcha-Response': challengeToken } : {},
  })
}

export function getOrder(code: string, token: string) {
  return publicRequest<PublicOrder>(`/orders/${enc(code)}?t=${enc(token)}`, {
    cache: 'no-store',
  })
}
