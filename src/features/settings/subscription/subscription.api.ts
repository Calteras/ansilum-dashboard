import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import { tenantPost, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  SubscriptionPlansResponse,
  CurrentSubscriptionResponse,
  SubscribeRequest,
  SubscribeResponse,
  SubscriptionOrder,
  SubscriptionOrderResponse,
  PendingOrderResponse,
  BillingOverviewResponse,
  PaymentHistoryResponse,
  InvoiceResponse,
  SaveCardRequest,
  SavedCardResponse,
} from './subscription.types'

// Billing belongs to the signed-in account and works before tenant selection.
export async function accountRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    cache: 'no-store',
    ...(method !== 'GET' && { method }),
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  })
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(
      error.message || `Request failed with status ${response.status}`
    )
  }
  return response.json()
}

/** Accept older order payloads that only carried the raw Midtrans charge response. */
function normalizeOrder(
  order: SubscriptionOrder & {
    midtransResponse?: Record<string, unknown> | null
  }
): SubscriptionOrder {
  const { midtransResponse, ...rest } = order
  const raw = midtransResponse ?? {}
  const actions = Array.isArray(raw.actions)
    ? (raw.actions as { name: string; url: string }[])
    : []
  const action = (name: string) =>
    actions.find((item) => item.name === name)?.url ?? null
  return {
    ...rest,
    orderId: rest.orderId ?? rest.id,
    billKey:
      rest.billKey ?? (typeof raw.bill_key === 'string' ? raw.bill_key : null),
    billerCode:
      rest.billerCode ??
      (typeof raw.biller_code === 'string' ? raw.biller_code : null),
    qrCodeUrl: rest.qrCodeUrl ?? action('generate-qr-code'),
    deeplinkUrl: rest.deeplinkUrl ?? action('deeplink-redirect'),
  }
}

export async function listSubscriptionPlansApi(): Promise<SubscriptionPlansResponse> {
  return accountRequest<SubscriptionPlansResponse>(
    tenantApiPaths.subscriptions.plans
  )
}

export async function getCurrentSubscriptionApi(): Promise<CurrentSubscriptionResponse> {
  return accountRequest<CurrentSubscriptionResponse>(
    tenantApiPaths.subscriptions.current
  )
}

export async function subscribeApi(
  data: SubscribeRequest
): Promise<SubscribeResponse> {
  const response = await tenantPost<SubscribeResponse>(
    tenantApiPaths.subscriptions.subscribe,
    data
  )
  return { ...response, data: normalizeOrder(response.data) }
}

export async function getSubscriptionOrderApi(
  id: string
): Promise<SubscriptionOrderResponse> {
  const response = await accountRequest<SubscriptionOrderResponse>(
    tenantApiPaths.subscriptions.order(id)
  )
  return { ...response, data: normalizeOrder(response.data) }
}

export async function getPendingOrderApi(): Promise<PendingOrderResponse> {
  const response = await accountRequest<PendingOrderResponse>(
    tenantApiPaths.subscriptions.pendingOrder
  )
  return {
    ...response,
    data: response.data ? normalizeOrder(response.data) : null,
  }
}

export async function cancelSubscriptionOrderApi(
  id: string
): Promise<SubscriptionOrderResponse> {
  const response = await accountRequest<SubscriptionOrderResponse>(
    tenantApiPaths.subscriptions.cancelOrder(id),
    'POST'
  )
  return { ...response, data: normalizeOrder(response.data) }
}

/** Sends only the single-use Midtrans token; the card number stays in the browser. */
export async function chargeCardApi(
  orderId: string,
  tokenId: string,
  saveCard = false
): Promise<SubscriptionOrderResponse> {
  const response = await accountRequest<SubscriptionOrderResponse>(
    tenantApiPaths.subscriptions.chargeCard(orderId),
    'POST',
    { tokenId, saveCard }
  )
  return { ...response, data: normalizeOrder(response.data) }
}

export function getBillingOverviewApi() {
  return accountRequest<BillingOverviewResponse>(
    tenantApiPaths.subscriptions.billing
  )
}

export function listPaymentsApi(page: number, size = 10) {
  return accountRequest<PaymentHistoryResponse>(
    `${tenantApiPaths.subscriptions.payments}?page=${page}&size=${size}`
  )
}

export function getInvoiceApi(orderId: string) {
  return accountRequest<InvoiceResponse>(
    tenantApiPaths.subscriptions.invoice(orderId)
  )
}

/** Stores a card registered with Midtrans in the browser; only its saved token is sent. */
export function saveCardApi(card: SaveCardRequest) {
  return accountRequest<SavedCardResponse>(
    tenantApiPaths.subscriptions.card,
    'PUT',
    card
  )
}

export function removeCardApi() {
  return accountRequest<unknown>(tenantApiPaths.subscriptions.card, 'DELETE')
}

export function setAutoRenewApi(enabled: boolean) {
  return accountRequest<SavedCardResponse>(
    tenantApiPaths.subscriptions.autoRenew,
    'PATCH',
    { enabled }
  )
}

export function cancelSubscriptionApi(reason?: string) {
  return accountRequest<unknown>(tenantApiPaths.subscriptions.cancel, 'POST', {
    ...(reason && { reason }),
  })
}

export function resumeSubscriptionApi() {
  return accountRequest<unknown>(tenantApiPaths.subscriptions.resume, 'POST')
}
