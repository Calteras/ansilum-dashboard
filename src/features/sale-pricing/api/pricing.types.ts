/**
 * Promotions, taxes and service charges (ansilum-be docs/PRICING.md, pricing
 * version 2). Prisma decimals arrive as strings, so money and rates are read
 * with Number().
 */
export type Decimal = number | string

export interface Envelope<T> {
  data: T
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export type PromotionType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'BUY_X_GET_Y'
  | 'BUNDLE_PRICE'

export const PROMOTION_TYPES: PromotionType[] = [
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'BUY_X_GET_Y',
  'BUNDLE_PRICE',
]

export type PaymentMethod =
  | 'CASH'
  | 'QRIS'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'E_WALLET'
  | 'BANK_TRANSFER'
  | 'OTHER'

export const PAYMENT_METHODS: PaymentMethod[] = [
  'CASH',
  'QRIS',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'E_WALLET',
  'BANK_TRANSFER',
  'OTHER',
]

/** A recurring local window: weekdays 0 (Sunday) to 6, minutes [start, end). */
interface PromotionSchedule {
  timezone: string
  weekdays: number[]
  startMinute: number
  endMinute: number
}

export interface PromotionRules {
  outletIds?: string[]
  productIds?: string[]
  categoryIds?: string[]
  automatic?: boolean
  stackable?: boolean
  priority?: number
  perCustomerLimit?: number
  budgetAmount?: number
  firstPurchaseOnly?: boolean
  customerIds?: string[]
  customerTags?: string[]
  channels?: string[]
  paymentMethods?: PaymentMethod[]
  restoreOnRefund?: boolean
  buyQuantity?: number
  getQuantity?: number
  bundleQuantity?: number
  schedule?: PromotionSchedule
}

export interface Promotion {
  id: string
  tenantId: string
  code: string
  name: string
  description: string | null
  discountType: PromotionType
  /** Percent for PERCENTAGE and BUY_X_GET_Y, otherwise rupiah. */
  value: Decimal
  minPurchase: Decimal | null
  maxDiscount: Decimal | null
  validFrom: string
  validUntil: string | null
  usageLimit: number | null
  /** Reserved and redeemed uses. */
  usedCount: number
  isActive: boolean
  rules: PromotionRules | null
  createdAt: string
  updatedAt: string
}

export interface PromotionRequest {
  code: string
  name: string
  description?: string | null
  discountType: PromotionType
  value: number
  minPurchase?: number | null
  maxDiscount?: number | null
  validFrom: string
  validUntil?: string | null
  usageLimit?: number | null
  isActive?: boolean
  rules: PromotionRules
}

/** GET /discounts wraps its page in the data envelope. */
export interface PromotionPage {
  data: Promotion[]
  total: number
}

type PromotionUseStatus = 'RESERVED' | 'REDEEMED' | 'RELEASED'

export interface PromotionUseGroup {
  status: PromotionUseStatus
  /** Uses backfilled from before pricing version 2; amount is a placeholder. */
  benefitUnknown: boolean
  _count: { _all: number }
  _sum: { amount: Decimal | null }
}

export interface PromotionPerformance {
  campaign: Promotion
  uses: PromotionUseGroup[]
  paidSales: number
  netSalesAfterRefunds: Decimal
  refundAmount: Decimal
  /** Null when some sold lines have no cost recorded. */
  grossProfitAfterRefunds: Decimal | null
  missingCostLines: number
}

// ─── Taxes and service charges ────────────────────────────────────────────────

export interface TaxRules {
  outletIds?: string[]
  productIds?: string[]
  categoryIds?: string[]
  exemptProductIds?: string[]
  validFrom?: string
  validUntil?: string
  /** Added tax is also charged on the service charge. */
  taxService?: boolean
}

export interface TaxConfig {
  id: string
  tenantId: string
  name: string
  rate: Decimal
  isInclusive: boolean
  isActive: boolean
  rules: TaxRules | null
  createdAt: string
  updatedAt: string
}

export interface TaxRequest {
  name: string
  rate: number
  isInclusive: boolean
  isActive?: boolean
  rules: TaxRules
}

export interface ServiceCharge {
  id: string
  tenantId: string
  name: string
  rate: Decimal
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceChargeRequest {
  name: string
  rate: number
  isActive?: boolean
}

// ─── Tenant settings ──────────────────────────────────────────────────────────

/** Limits on discounts and price changes a cashier makes by hand. */
export interface PricingControls {
  /** Combined line and order reduction, in percent; 100 means no limit. */
  maxManualPercent: number
  allowPriceOverride: boolean
  requireReason: boolean
}

/** The pricing part of the tenant configuration's customSettings. */
export interface PricingSettings {
  controls: PricingControls
  /** What registers on the current app charge, from the older settings keys. */
  registerTaxPercent: number | null
  registerServicePercent: number | null
  timezone: string
}
