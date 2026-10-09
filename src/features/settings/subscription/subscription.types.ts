export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'FULL'

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
  tier: SubscriptionTier
  billingCycle: 'MONTHLY' | 'YEARLY'
  paymentType: string
}

export interface SubscribeResponse {
  data: {
    orderId: string
    orderNumber: string
    amount: number
    paymentType: string
    midtransOrderId: string
    expiresAt: string
    // Bank Transfer
    vaNumber: string | null
    billKey: string | null
    billerCode: string | null
    // QRIS / GoPay
    qrCodeUrl: string | null
    deeplinkUrl: string | null
    // Credit Card (Snap)
    snapToken: string | null
    snapRedirectUrl: string | null
    // General
    paymentUrl: string | null
  }
  meta: Record<string, unknown>
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'SETTLEMENT'
  | 'EXPIRE'
  | 'CANCEL'

export interface SubscriptionOrderResponse {
  data: {
    id: string
    orderNumber: string
    amount: string
    paymentType: string
    paymentStatus: PaymentStatus
    vaNumber: string | null
    billKey: string | null
    billerCode: string | null
    qrCodeUrl: string | null
    deeplinkUrl: string | null
    expiresAt: string
    paidAt: string | null
    midtransResponse: Record<string, unknown> | null
  }
  meta: Record<string, unknown>
}
