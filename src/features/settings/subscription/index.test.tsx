import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { SettingsSubscription } from './index'
import { downloadInvoicePdf } from './invoice-pdf'
import {
  cancelSubscriptionApi,
  getBillingOverviewApi,
  getInvoiceApi,
  getPendingOrderApi,
  listPaymentsApi,
  removeCardApi,
  resumeSubscriptionApi,
  setAutoRenewApi,
} from './subscription.api'
import {
  billingOverview,
  paidPayment,
  pendingOrder,
  signInAsOwner,
} from './test-fixtures'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
  }: PropsWithChildren<{ to: string; search?: Record<string, string> }>) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to}>
      {children}
    </a>
  ),
}))
vi.mock('./subscription.api', () => ({
  getPendingOrderApi: vi.fn(),
  getBillingOverviewApi: vi.fn(),
  listPaymentsApi: vi.fn(),
  getInvoiceApi: vi.fn(),
  saveCardApi: vi.fn(),
  removeCardApi: vi.fn(),
  setAutoRenewApi: vi.fn(),
  cancelSubscriptionApi: vi.fn(),
  resumeSubscriptionApi: vi.fn(),
  getCurrentSubscriptionApi: vi.fn(),
}))
vi.mock('./invoice-pdf', () => ({ downloadInvoicePdf: vi.fn() }))

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return render(<SettingsSubscription />, { wrapper })
}

const history = (rows = [paidPayment]) => ({
  data: rows,
  meta: { page: 1, size: 10, totalData: rows.length, totalPages: 1 },
})

beforeEach(() => {
  vi.clearAllMocks()
  signInAsOwner()
  vi.mocked(getPendingOrderApi).mockResolvedValue({ data: null, meta: {} })
  vi.mocked(getBillingOverviewApi).mockResolvedValue(billingOverview())
  vi.mocked(listPaymentsApi).mockResolvedValue(history())
})

it('shows the plan, its automatic renewal and the saved card', async () => {
  setup()
  // A text query first: role queries are slow on a busy machine.
  expect(
    await screen.findByText(/Your subscription will auto renew on/)
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Standard plan' })
  ).toBeInTheDocument()
  const payment = screen.getByRole('region', { name: 'Payment method' })
  expect(within(payment).getByText('Visa •••• 1114')).toBeInTheDocument()
  expect(within(payment).getByText('Expires 06/2030')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Adjust plan' })).toHaveAttribute(
    'href',
    '/checkout'
  )

  vi.mocked(setAutoRenewApi).mockResolvedValue({} as never)
  fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
  await waitFor(() => expect(setAutoRenewApi).toHaveBeenCalledWith(false))
})

it('offers renewal in the last week of a plan that won’t renew by itself', async () => {
  vi.mocked(getBillingOverviewApi).mockResolvedValue(
    billingOverview({ endsInDays: 3, mode: 'manual', card: false })
  )
  setup()
  expect(
    await screen.findByRole('link', { name: 'Renew now' })
  ).toHaveAttribute('href', '/checkout?plan=STANDARD&renew=true')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Your plan ends soon and won’t renew by itself'
  )
  expect(screen.getByText(/No card saved/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Turn on' })).toBeDisabled()
})

it('cancels at the end of the period with an optional reason', async () => {
  vi.mocked(cancelSubscriptionApi).mockResolvedValue({})
  setup()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel plan' }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Your plan won’t renew')
  fireEvent.change(within(dialog).getByLabelText(/Why are you cancelling/), {
    target: { value: 'Too expensive' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel plan' }))
  await waitFor(() =>
    expect(cancelSubscriptionApi).toHaveBeenCalledWith('Too expensive')
  )
})

it('lets a cancelled plan be resumed until it ends', async () => {
  vi.mocked(getBillingOverviewApi).mockResolvedValue(
    billingOverview({ mode: 'ending' })
  )
  vi.mocked(resumeSubscriptionApi).mockResolvedValue({})
  setup()
  expect(await screen.findByText('Cancelled')).toBeInTheDocument()
  expect(screen.getByText(/Your plan ends on/)).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Cancel plan' })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Resume subscription' }))
  await waitFor(() => expect(resumeSubscriptionApi).toHaveBeenCalled())
})

it('shows Basic with nothing to cancel when there is no subscription', async () => {
  vi.mocked(getBillingOverviewApi).mockResolvedValue(
    billingOverview({ subscription: false, card: false })
  )
  vi.mocked(listPaymentsApi).mockResolvedValue(history([]))
  setup()
  expect(
    await screen.findByRole('heading', { name: 'Basic plan' })
  ).toBeInTheDocument()
  expect(await screen.findByText('No payments yet.')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Cancel plan' })
  ).not.toBeInTheDocument()
})

it('keeps plan changes for owners', async () => {
  signInAsOwner(false)
  setup()
  expect(
    await screen.findByRole('button', { name: 'Adjust plan' })
  ).toBeDisabled()
  expect(
    screen.getByText(/Only the owner of the selected business/)
  ).toBeInTheDocument()
})

it('sends the account back to its open payment', async () => {
  vi.mocked(getPendingOrderApi).mockResolvedValue({
    data: pendingOrder,
    meta: {},
  })
  setup()
  expect(
    await screen.findByRole('link', { name: 'Continue payment' })
  ).toHaveAttribute('href', `/checkout?order=${pendingOrder.id}`)
  expect(screen.getByRole('button', { name: 'Adjust plan' })).toBeDisabled()
})

it('lists payments and downloads the invoice as a PDF', async () => {
  const open = {
    ...paidPayment,
    id: 'f1c3e2a0-0d3e-4c55-8a1e-3b8f6a0c9d02',
    invoiceNumber: null,
    paymentType: 'BANK_TRANSFER_BCA' as const,
    paymentStatus: 'PENDING' as const,
    card: null,
    paidAt: null,
    expiresAt: '2099-01-01T00:00:00.000Z',
  }
  vi.mocked(listPaymentsApi).mockResolvedValue(history([open, paidPayment]))
  const invoice = { invoiceNumber: 'INV-2026-000001' }
  vi.mocked(getInvoiceApi).mockResolvedValue({
    data: invoice,
    meta: {},
  } as never)
  setup()
  const table = await screen.findByRole('table')
  expect(within(table).getByText('Paid')).toBeInTheDocument()
  expect(within(table).getByText('Pending')).toBeInTheDocument()
  expect(within(table).getByText('BCA Virtual Account')).toBeInTheDocument()
  expect(within(table).getByRole('link', { name: 'Continue' })).toHaveAttribute(
    'href',
    `/checkout?order=${open.id}`
  )
  fireEvent.click(
    within(table).getByRole('button', {
      name: 'Download PDF of invoice INV-2026-000001',
    })
  )
  await waitFor(() =>
    expect(downloadInvoicePdf).toHaveBeenCalledWith(
      invoice,
      expect.any(Function)
    )
  )
  expect(getInvoiceApi).toHaveBeenCalledWith(paidPayment.id)
})

it('asks before removing the saved card', async () => {
  vi.mocked(removeCardApi).mockResolvedValue({})
  setup()
  fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog).toHaveTextContent('won’t renew automatically')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Remove card' }))
  await waitFor(() => expect(removeCardApi).toHaveBeenCalled())
})
