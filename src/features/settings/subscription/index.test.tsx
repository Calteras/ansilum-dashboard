import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { SettingsSubscription } from './index'
import {
  getCurrentSubscriptionApi,
  getSubscriptionOrderApi,
  listSubscriptionPlansApi,
  subscribeApi,
} from './subscription.api'
import type { SubscriptionPlan, SubscribeResponse } from './subscription.types'

// Exercise billing state here; browser checks cover the actual portal, focus and scrolling.
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: PropsWithChildren<{ open: boolean }>) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: PropsWithChildren) => (
    <div role='dialog'>{children}</div>
  ),
  DialogHeader: ({ children }: PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
  DialogDescription: ({ children }: PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('./subscription.api', () => ({
  getCurrentSubscriptionApi: vi.fn(),
  getSubscriptionOrderApi: vi.fn(),
  listSubscriptionPlansApi: vi.fn(),
  subscribeApi: vi.fn(),
}))
const plans = ['BASIC', 'STANDARD', 'FULL'].map((tier, index) => ({
  id: tier,
  description: 'Plan description',
  createdAt: '',
  updatedAt: '',
  tier,
  name: tier.charAt(0) + tier.slice(1).toLowerCase(),
  monthlyPrice: '99000',
  yearlyPrice: '990000',
  maxTenants: index + 1,
  maxOutlets: index + 1,
  features: [],
  isActive: true,
  sortOrder: index,
})) as SubscriptionPlan[]
const order = {
  orderId: 'order-1',
  orderNumber: 'SUB-1',
  amount: 990000,
  paymentType: 'BANK_TRANSFER_BCA',
  vaNumber: '123456789',
  expiresAt: '2030-01-01',
} as SubscribeResponse['data']
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return render(<SettingsSubscription />, { wrapper })
}
beforeEach(() => {
  vi.clearAllMocks()
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  useAuthStore.getState().clearAuth()
  useAuthStore.getState().setAuth(
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
  useAuthStore.getState().setActiveTenant(tenant)
  useAuthStore
    .getState()
    .setTenants([{ id: 'member', tenant, role: 'OWNER', memberSince: '' }])
  vi.mocked(listSubscriptionPlansApi).mockResolvedValue({
    data: plans,
    meta: { page: 1, size: 3, totalData: 3, totalPages: 1 },
  })
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue({
    data: { tier: 'BASIC', userId: 'user', status: null },
    meta: {},
  } as Awaited<ReturnType<typeof getCurrentSubscriptionApi>>)
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue({
    data: {
      ...order,
      id: order.orderId,
      paymentStatus: 'PENDING',
      paidAt: null,
      midtransResponse: null,
      amount: '990000',
    },
    meta: {},
  } as Awaited<ReturnType<typeof getSubscriptionOrderApi>>)
})
it('explains an empty catalog and restores upgrade actions on retry', async () => {
  vi.mocked(listSubscriptionPlansApi).mockResolvedValueOnce({
    data: [],
    meta: { page: 1, size: 0, totalData: 0, totalPages: 1 },
  })
  setup()
  expect(
    await screen.findByText('Plans are temporarily unavailable')
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Retry plans' }))
  expect(
    await screen.findByRole('button', { name: 'Upgrade to Standard' })
  ).toBeEnabled()
})
it('keeps upgrades disabled when the current plan cannot be verified', async () => {
  vi.mocked(getCurrentSubscriptionApi).mockRejectedValue(new Error('offline'))
  setup()
  expect(
    await screen.findByRole('button', { name: 'Retry current plan' })
  ).toBeVisible()
  expect(screen.getByRole('button', { name: 'Upgrade to Full' })).toBeDisabled()
})
it('does not offer downgrades or owner-only checkout to members', async () => {
  useAuthStore.getState().setTenants([])
  setup()
  expect(
    await screen.findByRole('button', { name: 'Upgrade to Standard' })
  ).toBeDisabled()
})
it('submits the reviewed monthly total once and resumes the same payment after remount', async () => {
  vi.mocked(subscribeApi).mockResolvedValue({ data: order, meta: {} })
  const view = setup()
  expect(screen.queryByRole('switch', { name: 'Yearly billing' })).not.toBeInTheDocument()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Upgrade to Standard' })
  )
  expect(screen.queryByText('Credit / Debit Card')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'BCA Virtual Account' }))
  const submit = screen.getByRole('button', { name: /Continue/ })
  fireEvent.click(submit)
  fireEvent.click(submit)
  await waitFor(() => expect(subscribeApi).toHaveBeenCalledTimes(1))
  expect(subscribeApi).toHaveBeenCalledWith({
    tier: 'STANDARD',
    billingCycle: 'MONTHLY',
    paymentType: 'BANK_TRANSFER_BCA',
  })
  await screen.findByText('123456789')
  expect(localStorage.getItem('subscription-payment:user')).toBe('order-1')
  view.unmount()
  setup()
  fireEvent.click(await screen.findByRole('button', { name: 'View payment' }))
  expect(await screen.findByText('123456789')).toBeVisible()
  expect(subscribeApi).toHaveBeenCalledTimes(1)
})

afterEach(() => vi.unstubAllGlobals())

it('keeps checkout open with a retryable error when order creation fails', async () => {
  vi.mocked(subscribeApi).mockRejectedValueOnce(
    new Error('Payment provider unavailable. Please try again.')
  )
  setup()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Upgrade to Standard' })
  )
  fireEvent.click(screen.getByRole('radio', { name: /^QRIS/ }))
  fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Payment provider unavailable'
  )
  expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled()
  expect(localStorage.getItem('subscription-payment:user')).toBeNull()
})

it('refreshes the account after confirmed payment and prevents a downgrade', async () => {
  localStorage.setItem('subscription-payment:user', 'order-1')
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue({
    data: {
      ...order,
      id: order.orderId,
      paymentStatus: 'PAID',
      amount: '990000',
      paidAt: '2026-09-26',
      midtransResponse: null,
    },
    meta: {},
  })
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue({
    data: { tier: 'FULL', userId: 'user', status: 'ACTIVE' },
    meta: {},
  } as Awaited<ReturnType<typeof getCurrentSubscriptionApi>>)
  setup()
  await screen.findByText('Full Plan')
  expect(
    screen.queryByRole('button', { name: 'Upgrade to Standard' })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'View payment' }))
  expect(await screen.findByText('Payment Successful')).toBeVisible()
})
