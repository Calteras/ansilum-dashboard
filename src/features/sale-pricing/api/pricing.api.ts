import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import {
  tenantApiPaths,
  tenantDelete,
  tenantGet,
  tenantPost,
  tenantPut,
} from '@/lib/tenant-api-client'
import { readPricingSettings } from '../lib/pricing'
import type {
  Envelope,
  PricingControls,
  PricingSettings,
  Promotion,
  PromotionPage,
  PromotionPerformance,
  PromotionRequest,
  ServiceCharge,
  ServiceChargeRequest,
  TaxConfig,
  TaxRequest,
} from './pricing.types'

const paths = tenantApiPaths

// ─── Promotions ───────────────────────────────────────────────────────────────

/** Every campaign; without a limit the API returns the whole list. */
export const listPromotionsApi = () =>
  tenantGet<Envelope<PromotionPage>>(paths.discounts.list)

export const createPromotionApi = (data: PromotionRequest) =>
  tenantPost<Envelope<Promotion>>(paths.discounts.create, data)

export const updatePromotionApi = (
  id: string,
  data: Partial<PromotionRequest>
) => tenantPut<Envelope<Promotion>>(paths.discounts.update(id), data)

/** Deactivates; usage history and open holds are kept. */
export const archivePromotionApi = (id: string) =>
  tenantDelete<Envelope<{ message: string }>>(paths.discounts.archive(id))

export const getPromotionPerformanceApi = (id: string) =>
  tenantGet<Envelope<PromotionPerformance>>(paths.discounts.performance(id))

// ─── Taxes and service charges ────────────────────────────────────────────────

export const listTaxesApi = () =>
  tenantGet<Envelope<TaxConfig[]>>(paths.taxConfigs.list)

export const createTaxApi = (data: TaxRequest) =>
  tenantPost<Envelope<TaxConfig>>(paths.taxConfigs.create, data)

export const updateTaxApi = (id: string, data: Partial<TaxRequest>) =>
  tenantPut<Envelope<TaxConfig>>(paths.taxConfigs.update(id), data)

export const archiveTaxApi = (id: string) =>
  tenantDelete<Envelope<{ message: string }>>(paths.taxConfigs.archive(id))

export const listServiceChargesApi = () =>
  tenantGet<Envelope<ServiceCharge[]>>(paths.serviceCharges.list)

export const createServiceChargeApi = (data: ServiceChargeRequest) =>
  tenantPost<Envelope<ServiceCharge>>(paths.serviceCharges.create, data)

export const updateServiceChargeApi = (
  id: string,
  data: Partial<ServiceChargeRequest>
) => tenantPut<Envelope<ServiceCharge>>(paths.serviceCharges.update(id), data)

export const archiveServiceChargeApi = (id: string) =>
  tenantDelete<Envelope<{ message: string }>>(paths.serviceCharges.archive(id))

// ─── Tenant settings ──────────────────────────────────────────────────────────

type Json = Record<string, unknown>

async function configRequest(
  tenantId: string,
  init: RequestInit = {}
): Promise<PricingSettings> {
  const response = await fetch(
    `${API_BASE_URL}/auth/tenants/${encodeURIComponent(tenantId)}/config`,
    {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    }
  )
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    const message = (body as Json).message
    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : typeof message === 'string'
          ? message
          : `Request failed with status ${response.status}`
    )
  }
  // Auth routes are not wrapped by the response interceptor, but accept both.
  return readPricingSettings((body as Json).data ?? body)
}

export const getPricingSettingsApi = (tenantId: string) =>
  configRequest(tenantId)

/**
 * Sets the older single rates registers read to the named rows' sums; the
 * server accepts only values equal to those sums.
 */
export const syncRegisterRatesApi = (
  tenantId: string,
  rates: { taxPercentage?: number; serviceChargePercentage?: number }
) =>
  configRequest(tenantId, {
    method: 'PUT',
    body: JSON.stringify({ customSettings: rates }),
  })

/** The server merges this into customSettings; other settings are kept. */
export const updatePricingControlsApi = (
  tenantId: string,
  controls: PricingControls
) =>
  configRequest(tenantId, {
    method: 'PUT',
    body: JSON.stringify({ customSettings: { pricingControls: controls } }),
  })
