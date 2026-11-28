/** StreetFood OS: the owner's side of the link to the customer platform (ansilum-be `/integrations/streetfood`). */

export type OnlineStatus = 'AUTO' | 'OPEN' | 'PAUSED' | 'CLOSED'
export type LocationMode = 'FIXED' | 'MOBILE'
export type LocationSharing = 'LIVE' | 'SPOT' | 'HIDDEN'

/** What the platform says about a customer: a label, never a score. */
export type TrustLabel = 'NEW' | 'RELIABLE' | 'CAUTION' | 'PREPAY_REQUIRED'

/** Where an outlet's own policy starts to apply: from this label upward. */
export type PolicyLevel = 'NONE' | 'CAUTION' | 'PREPAY_REQUIRED'

/** 0 = Sunday … 6 = Saturday, times "HH:MM" in the outlet's timezone. */
export interface HoursInterval {
  dayOfWeek: number
  opensAt: string
  closesAt: string
}

interface StreetFoodLink {
  linkId: string
  keyId: string
  platformUrl: string
  status: 'ACTIVE' | 'REVOKED'
  createdAt: string
  revokedAt: string | null
}

/** Whether the platform is actually receiving what the POS sends. */
export interface Delivery {
  pending: number
  failed: number
  lastDeliveredAt: string | null
  /** The last delivery problem: HTTP_401, NETWORK, TIMEOUT, … */
  lastError: string | null
}

export interface StreetFoodOutlet {
  outletId: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  /** Shown to customers on the platform. */
  enabled: boolean
  onlineStatus: OnlineStatus
  prepTimeMinutes: number
  timezone: string
  locationMode: LocationMode
  locationSharing: LocationSharing
  hours: HoursInterval[]
  /** What customers would see right now. */
  pricingValid: boolean
  isOpenNow: boolean
  acceptingOrders: boolean
  /** A mobile vendor has opened its working day. */
  dayOpen: boolean
  /** Customers labelled this or worse must pay in the app (pay-at-pickup orders). */
  prepayFrom: PolicyLevel
  /** Customers labelled this or worse are refused. */
  refuseFrom: PolicyLevel
  lastCheckedAt: string | null
}

export interface StreetFoodOverview {
  link: StreetFoodLink | null
  delivery: Delivery | null
  outlets: StreetFoodOutlet[]
}

/** Returned once, when the link is created. The secret is never readable again. */
export interface NewLink {
  linkId: string
  tenantId: string
  keyId: string
  secret: string
  platformUrl: string
}

export interface RotatedSecret {
  keyId: string
  secret: string
  /** The POS already gave the new secret to the platform; nobody has to send it anywhere. */
  registered?: boolean
}

interface FeeLine {
  code: string
  label: string
  orders: number
  amountMinor: number
}

export interface Fees {
  totalMinor: number
  lines: FeeLine[]
  note: string
}

export interface OutletSettingsInput {
  timezone?: string
  onlineStatus?: OnlineStatus
  prepTimeMinutes?: number
  locationMode?: LocationMode
  locationSharing?: LocationSharing
  prepayFrom?: PolicyLevel
  refuseFrom?: PolicyLevel
}

export type OrderView = 'waiting' | 'active' | 'done'

export type OrderStatus =
  | 'PENDING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'

/** One row of an outlet's StreetFood orders (ansilum-be `GET /streetfood-orders`). */
export interface StreetOrder {
  id: string
  platformOrderId: string
  status: OrderStatus
  fulfillment: { type: 'PICKUP' | 'DINE_IN'; label: string | null }
  customerName: string
  totalMinor: number
  itemCount: number
  paymentMode: 'PREPAID' | 'PAY_AT_PICKUP'
  acceptBy: string
  createdAt: string
  /** Four digits the customer shows to find the order. */
  pickupCode: string | null
  readyAt: string | null
  /** A ready order can be called a no-show from this moment. */
  noShowAvailableAt: string | null
  reasonCode: string | null
  /** What the platform said about the customer when the order came. */
  customerTrust: CustomerTrust | null
  /** The vendor's thumb for this customer, if any. */
  rating: 'UP' | 'DOWN' | null
  /** A thumb can be tapped now. */
  canRate: boolean
  /** The thumb is the vendor's earlier action (a no-show), not a tap. */
  ratingCounted: boolean
}

export interface CustomerTrust {
  label: TrustLabel
  completedOrders: number
  noShowsLast90Days: number
}

/** A customer this business will not serve again. */
export interface BlockedCustomer {
  id: string
  customerName: string
  createdAt: string
}
