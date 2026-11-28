/** StreetFood OS: the owner's side of the link to the customer platform (ansilum-be `/integrations/streetfood`). */

export type OnlineStatus = 'AUTO' | 'OPEN' | 'PAUSED' | 'CLOSED'
export type LocationMode = 'FIXED' | 'MOBILE'
export type LocationSharing = 'LIVE' | 'SPOT' | 'HIDDEN'

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
}
