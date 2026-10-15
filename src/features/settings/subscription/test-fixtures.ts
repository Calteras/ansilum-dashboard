import { useAuthStore } from '@/stores/auth-store'
import type {
  BillingOverview,
  PaymentHistoryItem,
  SubscriptionOrder,
  SubscriptionPlan,
} from './subscription.types'

export const plans = (['BASIC', 'STANDARD', 'FULL'] as const).map(
  (tier, index) => ({
    id: tier,
    description: 'Plan description',
    createdAt: '',
    updatedAt: '',
    tier,
    name: tier.charAt(0) + tier.slice(1).toLowerCase(),
    monthlyPrice: String((index + 1) * 99000),
    yearlyPrice: '990000',
    maxTenants: index + 1,
    maxOutlets: index + 1,
    features: [],
    isActive: true,
    sortOrder: index,
  })
) as SubscriptionPlan[]

export const pendingOrder: SubscriptionOrder = {
  id: '6f1c2a40-4b7e-4d7a-9a51-2a8c8f0e1b11',
  orderId: '6f1c2a40-4b7e-4d7a-9a51-2a8c8f0e1b11',
  orderNumber: 'SUB-1',
  tier: 'STANDARD',
  billingCycle: 'MONTHLY',
  amount: 198000,
  paymentType: 'BANK_TRANSFER_BCA',
  paymentStatus: 'PENDING',
  vaNumber: '123456789',
  billKey: null,
  billerCode: null,
  qrCodeUrl: null,
  deeplinkUrl: null,
  expiresAt: '2099-01-01T00:00:00Z',
  paidAt: null,
}

export function entitlement(tier: SubscriptionPlan['tier']) {
  return {
    data: { tier, userId: 'user', status: tier === 'BASIC' ? null : 'ACTIVE' },
    meta: {},
  } as never
}

export function signInAsOwner(owner = true) {
  const auth = useAuthStore.getState()
  auth.clearAuth()
  auth.setAuth(
    {
      id: 'user',
      name: 'User',
      email: 'user@example.test',
      emailVerified: true,
      createdAt: '',
      updatedAt: '',
    },
    { id: 'session', userId: 'user', token: '', expiresAt: '2030-01-01' }
  )
  const tenant = {
    id: 'tenant',
    name: 'Business',
    slug: 'business',
    isActive: true,
    createdAt: '',
  }
  auth.setActiveTenant(tenant)
  auth.setTenants(
    owner ? [{ id: 'member', tenant, role: 'OWNER', memberSince: '' }] : []
  )
}

const DAY = 24 * 60 * 60 * 1000

/** A STANDARD account whose plan ends in `endsInDays`, with renewal settings to override. */
export function billingOverview({
  endsInDays = 20,
  mode = 'auto',
  card = true,
  subscription = true,
}: {
  endsInDays?: number
  mode?: 'auto' | 'manual' | 'ending'
  card?: boolean
  subscription?: boolean
} = {}): { data: BillingOverview; meta: Record<string, unknown> } {
  const end = new Date(Date.now() + endsInDays * DAY).toISOString()
  return {
    data: {
      subscription: subscription
        ? {
            id: 'sub',
            tier: 'STANDARD',
            planName: 'Standard',
            billingCycle: 'MONTHLY',
            status: 'ACTIVE',
            currentPeriodStart: new Date(Date.now() - 10 * DAY).toISOString(),
            currentPeriodEnd: end,
            cancelAtPeriodEnd: mode === 'ending',
            cancelledAt: null,
          }
        : null,
      card: card
        ? {
            brand: 'visa',
            last4: '1114',
            expiresAt: '2030-06-30T23:59:59.999Z',
            autoCharge: mode === 'auto',
          }
        : null,
      cardSetup: {
        clientKey: 'SB-Mid-client-test',
        environment: 'sandbox',
        scriptUrl:
          'https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js',
      },
      renewal: subscription
        ? { date: end, amount: 99000, mode, canRenewNow: endsInDays <= 7 }
        : null,
      renewalWindowDays: 7,
    },
    meta: {},
  }
}

export const paidPayment: PaymentHistoryItem = {
  id: '0b6c1f9e-5b0a-4a51-9d0c-6f4f1d2a7e01',
  orderNumber: 'SUB-20261014-1',
  invoiceNumber: 'INV-2026-000001',
  kind: 'CHECKOUT',
  tier: 'STANDARD',
  billingCycle: 'MONTHLY',
  amount: 99000,
  paymentType: 'CREDIT_CARD',
  paymentStatus: 'PAID',
  card: { brand: 'visa', last4: '1114' },
  periodStart: '2026-10-14T00:00:00.000Z',
  periodEnd: '2026-11-14T00:00:00.000Z',
  expiresAt: '2026-10-14T00:30:00.000Z',
  paidAt: '2026-10-14T00:05:00.000Z',
  createdAt: '2026-10-14T00:00:00.000Z',
}
