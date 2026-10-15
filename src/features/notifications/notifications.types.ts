import type {
  SubscriptionTier,
  RenewalMode,
} from '@/features/settings/subscription/subscription.types'

interface NotificationDataMap {
  RENEWAL_REMINDER: {
    tier: SubscriptionTier
    periodEnd: string
    mode: RenewalMode
    amount: number
    daysLeft: number
    cardBrand?: string
    cardLast4?: string
  }
  PAYMENT_RECEIVED: {
    orderId: string
    invoiceNumber: string
    amount: number
    tier: SubscriptionTier
    periodEnd: string | null
    renewal: boolean
  }
  RENEWAL_FAILED: {
    orderId: string
    amount: number
    tier: SubscriptionTier
    periodEnd: string
    cardLast4?: string
    final: boolean
  }
  RENEWAL_ACTION_REQUIRED: {
    orderId: string
    amount: number
    tier: SubscriptionTier
    periodEnd: string
  }
  SUBSCRIPTION_ENDED: { tier: SubscriptionTier; endedAt: string }
}

type NotificationType = keyof NotificationDataMap

/** Text is rendered on the client from type + data, in the reader's language. */
export type AppNotification = {
  [T in NotificationType]: {
    id: string
    type: T
    data: NotificationDataMap[T]
    link: string | null
    readAt: string | null
    createdAt: string
  }
}[NotificationType]

export interface NotificationsResponse {
  data: { items: AppNotification[]; unreadCount: number }
  meta: Record<string, unknown>
}
