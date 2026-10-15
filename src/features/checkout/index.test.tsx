import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import {
  cancelSubscriptionOrderApi,
  chargeCardApi,
  getCurrentSubscriptionApi,
  getPendingOrderApi,
  getSubscriptionOrderApi,
  listSubscriptionPlansApi,
  subscribeApi,
} from '@/features/settings/subscription/subscription.api'
import {
  entitlement,
  pendingOrder,
  plans,
  signInAsOwner,
} from '@/features/settings/subscription/test-fixtures'
import { Checkout, type CheckoutSearch } from './index'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Navigate: ({ to }: { to: string }) => <p>redirect {to}</p>,
  Link: ({ children, to }: PropsWithChildren<{ to: string }>) => (
    <a href={to}>{children}</a>
  ),
}))
vi.mock('@/features/auth/hooks/use-session-restore', () => ({
  useSessionRestore: () => ({ isPending: false }),
}))
vi.mock('@/features/settings/subscription/subscription.api', () => ({
  getCurrentSubscriptionApi: vi.fn(),
  getSubscriptionOrderApi: vi.fn(),
  getPendingOrderApi: vi.fn(),
  listSubscriptionPlansApi: vi.fn(),
  subscribeApi: vi.fn(),
  cancelSubscriptionOrderApi: vi.fn(),
  chargeCardApi: vi.fn(),
}))

function setup(search: CheckoutSearch = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const view = render(<Checkout search={search} />, { wrapper })
  return {
    ...view,
    rerenderWith: (next: CheckoutSearch) =>
      view.rerender(<Checkout search={next} />),
  }
}

const orderResponse = (overrides: Partial<typeof pendingOrder> = {}) => ({
  data: { ...pendingOrder, ...overrides },
  meta: {},
})

beforeEach(() => {
  vi.clearAllMocks()
  signInAsOwner()
  vi.mocked(listSubscriptionPlansApi).mockResolvedValue({
    data: plans,
    meta: { page: 1, size: 3, totalData: 3, totalPages: 1 },
  })
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue(entitlement('BASIC'))
  vi.mocked(getPendingOrderApi).mockResolvedValue({ data: null, meta: {} })
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(orderResponse())
})

it('creates exactly one payment for the reviewed plan and opens it', async () => {
  vi.mocked(subscribeApi).mockResolvedValue(orderResponse())
  setup({ plan: 'STANDARD' })
  fireEvent.click(
    await screen.findByRole('button', { name: /^Virtual account/ })
  )
  fireEvent.click(screen.getByRole('radio', { name: /BCA Virtual Account/ }))
  const submit = screen.getByRole('button', {
    name: 'Continue with BCA Virtual Account',
  })
  fireEvent.click(submit)
  fireEvent.click(submit)
  await waitFor(() => expect(subscribeApi).toHaveBeenCalledTimes(1))
  expect(subscribeApi).toHaveBeenCalledWith({
    tier: 'STANDARD',
    billingCycle: 'MONTHLY',
    paymentType: 'BANK_TRANSFER_BCA',
  })
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({
      to: '/checkout',
      search: { order: pendingOrder.id },
      replace: true,
    })
  )
})

it('skips plan choice when only one upgrade is possible', async () => {
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue(
    entitlement('STANDARD')
  )
  setup()
  expect(
    await screen.findByRole('heading', { name: 'How would you like to pay?' })
  ).toBeVisible()
  expect(
    screen.queryByRole('radio', { name: /Standard/ })
  ).not.toBeInTheDocument()
})

it('groups methods into categories that open one at a time', async () => {
  setup({ plan: 'FULL' })
  expect(
    await screen.findByRole('button', { name: /^Virtual account/ })
  ).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Virtual account/ }))
  expect(screen.getAllByRole('radio').map((radio) => radio.id)).toEqual([
    'BANK_TRANSFER_BCA',
    'BANK_TRANSFER_BNI',
    'BANK_TRANSFER_MANDIRI',
  ])
  fireEvent.click(screen.getByRole('radio', { name: /BNI Virtual Account/ }))
  fireEvent.click(screen.getByRole('button', { name: /^E-wallet/ }))
  expect(
    screen.getByRole('button', { name: /^Virtual account/ })
  ).toHaveAttribute('aria-expanded', 'false')
  expect(
    screen.getByRole('button', { name: 'Continue with GoPay' })
  ).toBeEnabled()
})

it('asks for a plan when several upgrades are possible', async () => {
  setup()
  expect(
    await screen.findByRole('heading', { name: 'Choose your plan' })
  ).toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: /Full/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
  expect(
    await screen.findByRole('heading', { name: 'How would you like to pay?' })
  ).toBeVisible()
})

it('keeps the method step open with the provider error when a payment cannot be prepared', async () => {
  vi.mocked(subscribeApi).mockRejectedValue(
    new Error('The payment provider could not prepare this payment.')
  )
  setup({ plan: 'FULL' })
  fireEvent.click(await screen.findByRole('button', { name: /^QRIS/ }))
  // A category with a single method selects it on open.
  expect(screen.getByRole('radio', { name: /^QRIS/ })).toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Continue with QRIS' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'could not prepare'
  )
  expect(
    screen.getByRole('button', { name: 'Continue with QRIS' })
  ).toBeEnabled()
})

it('resumes the account’s open payment from the server on any device', async () => {
  vi.mocked(getPendingOrderApi).mockResolvedValue(orderResponse())
  setup({ plan: 'FULL' })
  expect(await screen.findByText('123456789')).toBeVisible()
  expect(screen.getByText('Waiting for your payment')).toBeVisible()
  expect(subscribeApi).not.toHaveBeenCalled()
})

it('shows the paid receipt once the webhook settles the order', async () => {
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentStatus: 'PAID', paidAt: '2026-10-15T03:00:00Z' })
  )
  setup({ order: pendingOrder.id })
  expect(
    await screen.findByRole('heading', { name: 'Your Standard plan is active' })
  ).toBeVisible()
  expect(screen.getByRole('img', { name: 'Paid' })).toBeVisible()
  await waitFor(() =>
    expect(getCurrentSubscriptionApi).toHaveBeenCalledTimes(2)
  )
})

it('offers a fresh method after an expired payment', async () => {
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentStatus: 'EXPIRED' })
  )
  const view = setup({ order: pendingOrder.id })
  expect(
    await screen.findByRole('heading', { name: 'This payment has expired' })
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole('button', { name: 'Choose a payment method' })
  )
  expect(navigate).toHaveBeenCalledWith({
    to: '/checkout',
    search: { plan: 'STANDARD' },
    replace: true,
  })
  view.rerenderWith({ plan: 'STANDARD' })
  expect(
    await screen.findByRole('heading', { name: 'How would you like to pay?' })
  ).toBeVisible()
})

it('closes the open payment before letting the customer switch methods', async () => {
  vi.mocked(cancelSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentStatus: 'EXPIRED' })
  )
  setup({ order: pendingOrder.id })
  fireEvent.click(
    await screen.findByRole('button', { name: 'Change payment method' })
  )
  expect(cancelSubscriptionOrderApi).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Close and choose again' })
  )
  await waitFor(() =>
    expect(cancelSubscriptionOrderApi).toHaveBeenCalledWith(pendingOrder.id)
  )
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({
      to: '/checkout',
      search: { plan: 'STANDARD' },
      replace: true,
    })
  )
})

it('keeps the payment when closing finds it was already paid', async () => {
  vi.mocked(cancelSubscriptionOrderApi).mockRejectedValue(
    new Error(
      'This payment has already been completed. Your plan is being activated.'
    )
  )
  setup({ order: pendingOrder.id })
  fireEvent.click(
    await screen.findByRole('button', { name: 'Change payment method' })
  )
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentStatus: 'PAID', paidAt: '2026-10-15T03:00:00Z' })
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Close and choose again' })
  )
  expect(
    await screen.findByRole('heading', { name: 'Your Standard plan is active' })
  ).toBeVisible()
  expect(navigate).not.toHaveBeenCalled()
})

it('tells members only an owner can upgrade', async () => {
  signInAsOwner(false)
  setup({ plan: 'FULL' })
  expect(
    await screen.findByRole('heading', {
      name: 'Only a business owner can upgrade',
    })
  ).toBeVisible()
})

const card = {
  clientKey: 'SB-Mid-client-test',
  environment: 'sandbox' as const,
  scriptUrl:
    'https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js',
  authenticationUrl: null,
  charged: false,
}
const bankPage = 'https://api.sandbox.midtrans.com/v2/token/rba/redirect/1'

function fakeMidtrans() {
  const api = {
    getCardToken: vi.fn(
      (
        _card: unknown,
        options: {
          onSuccess: (r: { status_code: string; token_id: string }) => void
        }
      ) => options.onSuccess({ status_code: '200', token_id: 'token-123456' })
    ),
    authenticate: vi.fn(),
    registerCard: vi.fn(),
  }
  window.MidtransNew3ds = api
  return api
}

function fillCard(number = '4811 1111 1111 1114') {
  fireEvent.change(screen.getByLabelText('Card number'), {
    target: { value: number },
  })
  fireEvent.change(screen.getByLabelText('Expiry date'), {
    target: { value: '1230' },
  })
  fireEvent.change(screen.getByLabelText('Security code'), {
    target: { value: '123' },
  })
}

it('offers cards as their own category and opens a card payment', async () => {
  vi.mocked(subscribeApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', card })
  )
  setup({ plan: 'FULL' })
  fireEvent.click(
    await screen.findByRole('button', { name: /^Credit or debit card/ })
  )
  expect(
    screen.getByRole('radio', { name: /Credit or debit card/ })
  ).toBeChecked()
  fireEvent.click(
    screen.getByRole('button', { name: 'Continue to card payment' })
  )
  await waitFor(() =>
    expect(subscribeApi).toHaveBeenCalledWith({
      tier: 'FULL',
      billingCycle: 'MONTHLY',
      paymentType: 'CREDIT_CARD',
    })
  )
})

it('takes the card in Ansilum’s own form and sends only a token to the server', async () => {
  const midtrans = fakeMidtrans()
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', card })
  )
  vi.mocked(chargeCardApi).mockResolvedValue(
    orderResponse({
      paymentType: 'CREDIT_CARD',
      card: { ...card, charged: true },
    })
  )
  setup({ order: pendingOrder.id })
  expect(
    await screen.findByRole('heading', { name: 'Pay by card' })
  ).toBeVisible()
  fillCard()
  expect(screen.getByLabelText('Card number')).toHaveValue(
    '4811 1111 1111 1114'
  )
  expect(screen.getByLabelText('Expiry date')).toHaveValue('12 / 30')
  fireEvent.click(screen.getByRole('button', { name: /^Pay Rp/ }))
  await waitFor(() =>
    expect(chargeCardApi).toHaveBeenCalledWith(
      pendingOrder.id,
      'token-123456',
      true
    )
  )
  expect(midtrans.getCardToken).toHaveBeenCalledWith(
    {
      card_number: '4811111111111114',
      card_exp_month: '12',
      card_exp_year: '2030',
      card_cvv: '123',
    },
    expect.anything()
  )
  // Nothing that reaches Ansilum's API carries the card number.
  expect(JSON.stringify(vi.mocked(chargeCardApi).mock.calls)).not.toContain(
    '4811'
  )
  delete window.MidtransNew3ds
})

it('checks the card before contacting anyone', async () => {
  const midtrans = fakeMidtrans()
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', card })
  )
  setup({ order: pendingOrder.id })
  await screen.findByRole('heading', { name: 'Pay by card' })
  fillCard('4811 1111 1111 1115')
  fireEvent.click(screen.getByRole('button', { name: /^Pay Rp/ }))
  expect(screen.getByText('This card number isn’t valid.')).toBeVisible()
  expect(midtrans.getCardToken).not.toHaveBeenCalled()
  expect(chargeCardApi).not.toHaveBeenCalled()
  delete window.MidtransNew3ds
})

it('runs the bank’s 3-D Secure page in our dialog, then re-checks the order', async () => {
  const midtrans = fakeMidtrans()
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', card })
  )
  vi.mocked(chargeCardApi).mockResolvedValue(
    orderResponse({
      paymentType: 'CREDIT_CARD',
      card: { ...card, charged: true, authenticationUrl: bankPage },
    })
  )
  setup({ order: pendingOrder.id })
  await screen.findByRole('heading', { name: 'Pay by card' })
  fillCard()
  fireEvent.click(screen.getByRole('button', { name: /^Pay Rp/ }))
  await waitFor(() => expect(midtrans.authenticate).toHaveBeenCalled())
  const [url, options] = midtrans.authenticate.mock.calls[0] as [
    string,
    { performAuthentication: (u: string) => void; onSuccess: () => void },
  ]
  expect(url).toBe(bankPage)
  act(() => options.performAuthentication(bankPage))
  expect(await screen.findByTitle('3-D Secure verification')).toHaveAttribute(
    'src',
    bankPage
  )
  const calls = vi.mocked(getSubscriptionOrderApi).mock.calls.length
  act(() => options.onSuccess())
  await waitFor(() =>
    expect(
      screen.queryByTitle('3-D Secure verification')
    ).not.toBeInTheDocument()
  )
  await waitFor(() =>
    expect(
      vi.mocked(getSubscriptionOrderApi).mock.calls.length
    ).toBeGreaterThan(calls)
  )
  delete window.MidtransNew3ds
})

it('offers another card in one step after a decline', async () => {
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', paymentStatus: 'FAILED' })
  )
  vi.mocked(subscribeApi).mockResolvedValue(
    orderResponse({
      id: '0b5a1f9e-1c2d-4e3f-8a9b-0c1d2e3f4a5b',
      paymentType: 'CREDIT_CARD',
      card,
    })
  )
  setup({ order: pendingOrder.id })
  expect(await screen.findByText(/Your card wasn’t charged/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Try another card' }))
  await waitFor(() =>
    expect(subscribeApi).toHaveBeenCalledWith({
      tier: 'STANDARD',
      billingCycle: 'MONTHLY',
      paymentType: 'CREDIT_CARD',
    })
  )
})

it('never loads a card script from anywhere but Midtrans', async () => {
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({
      paymentType: 'CREDIT_CARD',
      card: { ...card, scriptUrl: 'https://evil.example/3ds.js' },
    })
  )
  setup({ order: pendingOrder.id })
  await screen.findByRole('heading', { name: 'Pay by card' })
  fillCard()
  fireEvent.click(screen.getByRole('button', { name: /^Pay Rp/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'We couldn’t verify this card'
  )
  expect(document.querySelector('script[src*="evil"]')).toBeNull()
  expect(chargeCardApi).not.toHaveBeenCalled()
})

it('charges without saving the card when the customer unticks it', async () => {
  fakeMidtrans()
  vi.mocked(getSubscriptionOrderApi).mockResolvedValue(
    orderResponse({ paymentType: 'CREDIT_CARD', card })
  )
  vi.mocked(chargeCardApi).mockResolvedValue(
    orderResponse({
      paymentType: 'CREDIT_CARD',
      card: { ...card, charged: true },
    })
  )
  setup({ order: pendingOrder.id })
  await screen.findByRole('heading', { name: 'Pay by card' })
  fillCard()
  const save = screen.getByRole('checkbox', {
    name: /Save this card for automatic renewal/,
  })
  expect(save).toBeChecked()
  fireEvent.click(save)
  fireEvent.click(screen.getByRole('button', { name: /^Pay Rp/ }))
  await waitFor(() =>
    expect(chargeCardApi).toHaveBeenCalledWith(
      pendingOrder.id,
      'token-123456',
      false
    )
  )
  delete window.MidtransNew3ds
})

it('renews the current plan when asked to, instead of offering upgrades', async () => {
  vi.mocked(getCurrentSubscriptionApi).mockResolvedValue(
    entitlement('STANDARD')
  )
  vi.mocked(subscribeApi).mockResolvedValue(orderResponse())
  setup({ plan: 'STANDARD', renew: true })
  fireEvent.click(
    await screen.findByRole('button', { name: /^Virtual account/ })
  )
  fireEvent.click(screen.getByRole('radio', { name: /BCA Virtual Account/ }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Continue with BCA Virtual Account' })
  )
  await waitFor(() =>
    expect(subscribeApi).toHaveBeenCalledWith({
      tier: 'STANDARD',
      billingCycle: 'MONTHLY',
      paymentType: 'BANK_TRANSFER_BCA',
    })
  )
})
