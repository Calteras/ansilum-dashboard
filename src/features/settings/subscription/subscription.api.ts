import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import { tenantPost, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  SubscriptionPlansResponse,
  CurrentSubscriptionResponse,
  SubscribeRequest,
  SubscribeResponse,
  SubscriptionOrderResponse,
} from './subscription.types'

// Billing reads belong to the signed-in account and work before tenant selection.
async function accountGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    cache: 'no-store',
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

export async function listSubscriptionPlansApi(): Promise<SubscriptionPlansResponse> {
  return accountGet<SubscriptionPlansResponse>(
    tenantApiPaths.subscriptions.plans
  )
}

export async function getCurrentSubscriptionApi(): Promise<CurrentSubscriptionResponse> {
  return accountGet<CurrentSubscriptionResponse>(
    tenantApiPaths.subscriptions.current
  )
}

export async function subscribeApi(
  data: SubscribeRequest
): Promise<SubscribeResponse> {
  return tenantPost<SubscribeResponse>(
    tenantApiPaths.subscriptions.subscribe,
    data
  )
}

export async function getSubscriptionOrderApi(
  id: string
): Promise<SubscriptionOrderResponse> {
  const response = await accountGet<SubscriptionOrderResponse>(
    tenantApiPaths.subscriptions.order(id)
  )
  const order = response.data
  const raw = order.midtransResponse ?? {}
  const actions = Array.isArray(raw.actions)
    ? (raw.actions as { name: string; url: string }[])
    : []
  const action = (name: string) =>
    actions.find((item) => item.name === name)?.url ?? null
  return {
    ...response,
    data: {
      ...order,
      billKey:
        order.billKey ??
        (typeof raw.bill_key === 'string' ? raw.bill_key : null),
      billerCode:
        order.billerCode ??
        (typeof raw.biller_code === 'string' ? raw.biller_code : null),
      qrCodeUrl: order.qrCodeUrl ?? action('generate-qr-code'),
      deeplinkUrl: order.deeplinkUrl ?? action('deeplink-redirect'),
    },
  }
}
