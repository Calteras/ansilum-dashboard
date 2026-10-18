/**
 * Public storefront API (ansilum-be docs/features/public-storefront/06-API.md).
 * Money is in integer minor units (hundredths of a rupiah).
 */

export interface PublicOutlet {
  id: string
  name: string
  address: string | null
  phone: string | null
}

export interface Storefront {
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  primaryColor: string | null
  outlets: PublicOutlet[]
}

export interface MenuOption {
  id: string
  name: string
  priceDeltaMinor: number
  isDefault: boolean
  available: boolean
}

export interface MenuOptionGroup {
  id: string
  name: string
  required: boolean
  minSelection: number
  maxSelection: number
  options: MenuOption[]
}

export interface MenuVariant {
  id: string
  name: string
  priceDeltaMinor: number
  available: boolean
}

export interface MenuProduct {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  priceMinor: number
  soldOut: boolean
  variants: MenuVariant[]
  modifierGroups: MenuOptionGroup[]
}

export interface MenuCategory {
  id: string
  name: string
  products: MenuProduct[]
}

export interface OutletMenu {
  outlet: PublicOutlet
  orderingAvailable: boolean
  pricing: { taxRate: number; serviceChargeRate: number } | null
  categories: MenuCategory[]
}

export interface PlaceOrderRequest {
  clientSubmissionId: string
  outletId: string
  customer: { name: string; phone?: string }
  notes?: string
  items: {
    productId: string
    variantId?: string
    modifierIds?: string[]
    quantity: number
    notes?: string
  }[]
  expectedTotalMinor?: number
}

export type OrderStatus = 'AWAITING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED'

export interface PublicOrder {
  code: string
  status: OrderStatus
  payment: 'PAY_AT_CASHIER'
  placedAt: string
  expiresAt: string
  paidAt: string | null
  cancelledAt: string | null
  storefront: {
    slug: string | null
    name: string
    logoUrl?: string | null
    primaryColor?: string | null
  }
  outlet: { id: string; name: string; address: string | null }
  customerName: string
  itemCount: number
  items: {
    name: string
    variantName: string | null
    options: string[]
    quantity: number
    unitPriceMinor: number
    subtotalMinor: number
    notes: string | null
  }[]
  subtotalMinor: number
  taxMinor: number
  serviceMinor: number
  totalMinor: number
  taxRate: number
  serviceChargeRate: number
  accessToken?: string
}

export interface OrderLineProblem {
  line: number
  code:
    | 'PRODUCT_UNAVAILABLE'
    | 'VARIANT_UNAVAILABLE'
    | 'OPTION_UNAVAILABLE'
    | 'OPTION_SELECTION'
  group?: string
  min?: number
  max?: number
}
