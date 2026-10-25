/** Response envelope of the API (`CustomResponseInterceptor`). */
export interface Envelope<T> {
  data: T
}

export interface ListMeta {
  total: number
  limit: number
  offset: number
}

export interface Paged<T> {
  data: T[]
  meta: ListMeta
}

export interface PageParams {
  limit?: number
  offset?: number
}

/** Derived from `isActive` + `bannedAt`; banned members are always inactive. */
export type CustomerStatus = 'active' | 'inactive' | 'banned'

export type CustomerSortField =
  | 'createdAt'
  | 'name'
  | 'totalSpent'
  | 'currentPoints'
  | 'totalPoints'
  | 'visitCount'
  | 'lastVisitAt'

export interface UserRef {
  id: string
  name: string
}

export interface Customer {
  id: string
  tenantId: string
  phone: string
  name: string
  email: string | null
  address: string | null
  notes: string | null
  tags: string[] | null
  /** Decimal, serialised as a string. */
  totalSpent: string | number
  totalPoints: number
  currentPoints: number
  visitCount: number
  lastVisitAt: string | null
  isActive: boolean
  bannedAt: string | null
  banReason: string | null
  bannedByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerDetail extends Customer {
  _count: { transactions: number; redemptions: number }
  bannedBy: UserRef | null
}

export interface CustomerListParams extends PageParams {
  search?: string
  status?: CustomerStatus[]
  sortBy?: CustomerSortField
  sortOrder?: 'asc' | 'desc'
}

export interface CustomerRequest {
  phone: string
  name: string
  /** `null` clears the field on update. */
  email?: string | null
  address?: string | null
  notes?: string | null
  tags?: string[]
}

export type PointsLedgerType =
  | 'EARN'
  | 'REDEEM'
  | 'EXPIRE'
  | 'ADJUST_IN'
  | 'ADJUST_OUT'

export interface PointsLedgerEntry {
  id: string
  customerId: string
  type: PointsLedgerType
  points: number
  balanceAfter: number
  referenceId: string | null
  description: string
  actorUserId: string | null
  actor: UserRef | null
  createdAt: string
}

export interface TransactionRef {
  id: string
  transactionNo: string
  transactionDate: string
  outlet: { id: string; name: string }
}

export interface CustomerRedemption {
  id: string
  pointsSpent: number
  isVoided: boolean
  createdAt: string
  reward: { id: string; name: string; type: RewardType }
  transaction: TransactionRef | null
}

export interface RewardRedemption {
  id: string
  pointsSpent: number
  isVoided: boolean
  createdAt: string
  customer: { id: string; name: string; phone: string }
  transaction: TransactionRef | null
}

export interface CustomerTransaction {
  id: string
  transactionNo: string
  transactionDate: string
  grandTotal: string | number
  outlet: { id: string; name: string; code: string }
  items: { id: string; productName: string; quantity: number }[]
}

export type RewardType = 'DISCOUNT_FIXED' | 'DISCOUNT_PERCENT' | 'FREE_ITEM'

export interface Reward {
  id: string
  tenantId: string
  name: string
  description: string | null
  type: RewardType
  discountAmount: string | number | null
  discountPercent: string | number | null
  productId: string | null
  variantId: string | null
  pointsCost: number
  minimumAmount: string | number | null
  expiresAt: string | null
  maxRedemptions: number | null
  totalRedemptions: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  product: { id: string; name: string; sku: string } | null
  variant: { id: string; name: string } | null
}

export interface RewardRequest {
  name?: string
  description?: string | null
  type?: RewardType
  discountAmount?: number
  discountPercent?: number
  productId?: string
  variantId?: string | null
  pointsCost?: number
  /** `null` clears the limit on update. */
  minimumAmount?: number | null
  expiresAt?: string | null
  maxRedemptions?: number | null
  isActive?: boolean
}

export interface LoyaltyConfig {
  id: string
  tenantId: string
  isEnabled: boolean
  pointsPerAmount: string | number
  minimumAmountForPoints: string | number
  pointsExpiryDays: number | null
  updatedAt: string
}

export interface LoyaltyConfigRequest {
  isEnabled?: boolean
  pointsPerAmount?: number
  minimumAmountForPoints?: number
}

export interface LoyaltyOverview {
  periodDays: number
  since: string
  members: {
    total: number
    active: number
    inactive: number
    banned: number
    newInPeriod: number
  }
  points: {
    outstanding: number
    frozen: number
    earned: number
    redeemed: number
    adjusted: number
    expired: number
  }
  redemptions: { count: number }
}
