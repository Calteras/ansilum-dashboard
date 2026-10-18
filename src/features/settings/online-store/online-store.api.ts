import { tenantGet, tenantPut } from '@/lib/tenant-api-client'

/** Settings → Online store (ansilum-be `GET/PUT /storefront`). */
export interface StorefrontSettings {
  enabled: boolean
  slug: string
  displayName: string | null
  description: string | null
  primaryColor: string | null
  showSoldOutProducts: boolean
  orderExpiryMinutes: number
}

export interface StorefrontOverview {
  exists: boolean
  config: StorefrontSettings & { updatedAt: string | null }
  business: { name: string; logoUrl: string | null }
  outlets: {
    id: string
    name: string
    address: string | null
    isActive: boolean
    storefrontEnabled: boolean
  }[]
  products: { visible: number; hidden: number }
  /** False when the tax/service settings could not be priced like the register. */
  pricingValid: boolean
}

interface Envelope<T> {
  data: T
}

export async function getStorefrontSettingsApi() {
  return (await tenantGet<Envelope<StorefrontOverview>>('/storefront')).data
}

export async function updateStorefrontSettingsApi(
  settings: StorefrontSettings
) {
  return (
    await tenantPut<Envelope<StorefrontOverview>>('/storefront', settings)
  ).data
}

export function setOutletStorefrontApi(outletId: string, enabled: boolean) {
  return tenantPut(`/storefront/outlets/${encodeURIComponent(outletId)}`, {
    enabled,
  })
}

export function setProductStorefrontApi(productId: string, visible: boolean) {
  return tenantPut(`/storefront/products/${encodeURIComponent(productId)}`, {
    visible,
  })
}

export const storefrontUrl = (slug: string) =>
  `${window.location.origin}/store/${encodeURIComponent(slug)}`
