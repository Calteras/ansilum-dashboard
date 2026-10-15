export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'FULL'
export type PaidTier = Exclude<SubscriptionTier, 'BASIC'>
export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type PaymentType =
  | 'QRIS'
  | 'GOPAY'
  | 'BANK_TRANSFER_BCA'
  | 'BANK_TRANSFER_BNI'
  | 'BANK_TRANSFER_BRI'
  | 'BANK_TRANSFER_MANDIRI'
  | 'BANK_TRANSFER_PERMATA'
  | 'CREDIT_CARD'

/** Settings for tokenizing a card in the browser; card numbers never reach Ansilum. */
export interface CardSession {
  clientKey: string
  environment: 'sandbox' | 'production'
  scriptUrl: string
  /** The bank's 3-D Secure page, once the card was charged and needs confirming. */
  authenticationUrl: string | null
  /** A card was already submitted for this order; it can't be charged again. */
  charged: boolean
}

export interface SubscriptionPlan {
  id: string
  tier: SubscriptionTier
  name: string
  description: string
  monthlyPrice: string
  yearlyPrice: string
  maxTenants: number
  maxOutlets: number
  features: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SubscriptionPlansResponse {
  data: SubscriptionPlan[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

export interface CurrentSubscriptionResponse {
  data: {
    tier: SubscriptionTier
    message?: string
    userId: string
    status: 'ACTIVE' | null
    subscription?: { currentPeriodEnd: string } | null
    limits: { tenants: number; outlets: number }
    usage: { tenants: number; outlets: number }
    remaining: { tenants: number; outlets: number }
    features: string[]
    overTenantLimit: boolean
    overOutletLimit: boolean
    canCreateTenant: boolean
    canCreateOutlet: boolean
  }
  meta: Record<string, unknown>
}

export interface SubscribeRequest {
  tier: PaidTier
  billingCycle: BillingCycle
  paymentType: PaymentType
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'

/** A checkout order as the backend exposes it: payment details, never raw gateway data. */
export interface SubscriptionOrder {
  id: string
  orderId: string
  orderNumber: string
  tier: SubscriptionTier | null
  billingCycle: BillingCycle | null
  amount: number | string
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  vaNumber: string | null
  billKey: string | null
  billerCode: string | null
  qrCodeUrl: string | null
  deeplinkUrl: string | null
  card?: CardSession | null
  kind?: OrderKind
  invoiceNumber?: string | null
  expiresAt: string
  paidAt: string | null
  createdAt?: string
}

export interface SubscribeResponse {
  data: SubscriptionOrder
  meta: Record<string, unknown>
}

export interface SubscriptionOrderResponse {
  data: SubscriptionOrder
  meta: Record<string, unknown>
}

export interface PendingOrderResponse {
  data: SubscriptionOrder | null
  meta: Record<string, unknown>
}

type OrderKind = 'CHECKOUT' | 'RENEWAL'
export type CardBrand = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'card'

/** The account's saved card; the token itself never leaves the backend. */
interface SavedCard {
  brand: CardBrand
  last4: string
  expiresAt: string | null
  autoCharge: boolean
}

/** "auto" charges the saved card, "manual" needs a payment, "ending" was cancelled. */
export type RenewalMode = 'auto' | 'manual' | 'ending'

export interface BillingOverview {
  subscription: {
    id: string
    tier: SubscriptionTier
    planName: string
    billingCycle: BillingCycle
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    cancelledAt: string | null
  } | null
  card: SavedCard | null
  /** Settings for registering a card with Midtrans; null when cards aren't configured. */
  cardSetup: Pick<CardSession, 'clientKey' | 'environment' | 'scriptUrl'> | null
  renewal: {
    date: string
    amount: number | null
    mode: RenewalMode
    canRenewNow: boolean
  } | null
  renewalWindowDays: number
}

export interface BillingOverviewResponse {
  data: BillingOverview
  meta: Record<string, unknown>
}

export interface PaymentHistoryItem {
  id: string
  orderNumber: string
  invoiceNumber: string | null
  kind: OrderKind
  tier: SubscriptionTier | null
  billingCycle: BillingCycle | null
  amount: number
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  card: { brand: CardBrand; last4: string } | null
  periodStart: string | null
  periodEnd: string | null
  expiresAt: string
  paidAt: string | null
  createdAt: string
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[]
  meta: { page: number; size: number; totalData: number; totalPages: number }
}

export interface Invoice {
  invoiceNumber: string
  orderNumber: string
  status: 'PAID' | 'REFUNDED'
  issuedAt: string
  currency: 'IDR'
  seller: {
    name: string
    address: string | null
    email: string | null
    taxId: string | null
  }
  customer: { name: string; email: string; business: string | null }
  items: {
    tier: SubscriptionTier | null
    planName: string
    billingCycle: BillingCycle | null
    renewal: boolean
    periodStart: string | null
    periodEnd: string | null
    amount: number
  }[]
  subtotal: number
  total: number
  payment: {
    paymentType: PaymentType
    card: { brand: CardBrand; last4: string } | null
    paidAt: string | null
    transactionId: string | null
  }
}

export interface InvoiceResponse {
  data: Invoice
  meta: Record<string, unknown>
}

/** What MidtransNew3ds.registerCard returns, sent on so renewals can charge the card. */
export interface SaveCardRequest {
  savedTokenId: string
  maskedCard: string
  expMonth: number
  expYear: number
}

export interface SavedCardResponse {
  data: SavedCard
  meta: Record<string, unknown>
}
