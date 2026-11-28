import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  blockCustomerApi,
  findOrdersByCodeApi,
  listOrdersApi,
  noShowApi,
  rateOrderApi,
} from '../street-food.api'
import type { StreetFoodOutlet, StreetOrder } from '../street-food.types'
import { OrdersPanel } from './orders-panel'

vi.mock('../street-food.api')

const outlet: StreetFoodOutlet = {
  outletId: 'melati',
  name: 'Kios Melati',
  address: null,
  latitude: null,
  longitude: null,
  enabled: true,
  onlineStatus: 'OPEN',
  prepTimeMinutes: 15,
  timezone: 'Asia/Jakarta',
  locationMode: 'MOBILE',
  locationSharing: 'LIVE',
  hours: [],
  pricingValid: true,
  isOpenNow: true,
  acceptingOrders: true,
  dayOpen: true,
  lastCheckedAt: null,
  prepayFrom: 'NONE',
  refuseFrom: 'NONE',
}

const order = (over: Partial<StreetOrder> = {}): StreetOrder => ({
  id: 'o1',
  platformOrderId: 'mo_1',
  status: 'READY',
  fulfillment: { type: 'PICKUP', label: null },
  customerName: 'Rina',
  totalMinor: 1554000,
  itemCount: 2,
  paymentMode: 'PAY_AT_PICKUP',
  acceptBy: '2026-11-28T09:05:00Z',
  createdAt: '2026-11-28T09:00:00Z',
  pickupCode: '4821',
  readyAt: '2026-11-28T09:20:00Z',
  noShowAvailableAt: '2026-11-28T09:40:00Z',
  reasonCode: null,
  customerTrust: null,
  rating: null,
  canRate: false,
  ratingCounted: false,
  ...over,
})

const minutesFromNow = (m: number) =>
  new Date(Date.now() + m * 60_000).toISOString()

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return {
    user: userEvent.setup(),
    ...render(<OrdersPanel tenantId='tenant-1' outlets={[outlet]} />, {
      wrapper,
    }),
  }
}

beforeEach(() => {
  vi.mocked(listOrdersApi).mockReset().mockResolvedValue([])
  vi.mocked(findOrdersByCodeApi).mockReset().mockResolvedValue([])
  vi.mocked(noShowApi)
    .mockReset()
    .mockResolvedValue(undefined as never)
  vi.mocked(rateOrderApi)
    .mockReset()
    .mockResolvedValue(undefined as never)
  vi.mocked(blockCustomerApi)
    .mockReset()
    .mockResolvedValue(undefined as never)
})

describe('the orders list', () => {
  it('shows each order with the code the customer will show', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([order()])
    setup()

    expect(await screen.findByText('Rina')).toBeInTheDocument()
    expect(screen.getByText('#4821')).toBeInTheDocument()
  })

  it('says an order the vendor ended as a no-show was not picked up', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({
        status: 'CANCELLED',
        reasonCode: 'NO_SHOW',
        noShowAvailableAt: null,
      }),
    ])
    setup()

    expect(await screen.findByText('Not picked up')).toBeInTheDocument()
  })
})

describe('the no-show action', () => {
  it('is locked while the customer may still be on the way, and says how long', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ noShowAvailableAt: minutesFromNow(12) }),
    ])
    setup()

    const button = await screen.findByRole('button', {
      name: /Wait \d+:\d\d more/,
    })
    expect(button).toBeDisabled()
    expect(screen.queryByText('Customer did not come')).not.toBeInTheDocument()
  })

  it('asks before it tells the customer, then marks the order', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ noShowAvailableAt: minutesFromNow(-1) }),
    ])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Customer did not come' })
    )
    expect(noShowApi).not.toHaveBeenCalled()
    expect(
      screen.getByText(/will be told the order was not picked up/)
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mark not picked up' }))

    await waitFor(() => expect(noShowApi).toHaveBeenCalledWith('melati', 'o1'))
  })

  it('keeps the order when the vendor changes their mind', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ noShowAvailableAt: minutesFromNow(-1) }),
    ])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Customer did not come' })
    )
    await user.click(screen.getByRole('button', { name: 'Not yet' }))

    expect(noShowApi).not.toHaveBeenCalled()
  })

  it('is not offered on an order that is not ready', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ status: 'PREPARING', noShowAvailableAt: null }),
    ])
    setup()

    await screen.findByText('Rina')
    expect(
      screen.queryByText(/Customer did not come|Wait \d/)
    ).not.toBeInTheDocument()
  })
})

describe('finding an order by its code', () => {
  it('looks nothing up until the fourth digit', async () => {
    const { user } = setup()
    const box = screen.getByRole('textbox', { name: "Customer's pickup code" })

    await user.type(box, '482')
    expect(findOrdersByCodeApi).not.toHaveBeenCalled()

    await user.type(box, '1')
    await waitFor(() =>
      expect(findOrdersByCodeApi).toHaveBeenCalledWith('melati', '4821')
    )
  })

  it('shows the order that code belongs to', async () => {
    vi.mocked(findOrdersByCodeApi).mockResolvedValue([
      order({ customerName: 'Found Rina' }),
    ])
    const { user } = setup()

    await user.type(
      screen.getByRole('textbox', { name: "Customer's pickup code" }),
      '4821'
    )

    expect(await screen.findByText('Found Rina')).toBeInTheDocument()
  })

  it('says when no order has that code', async () => {
    const { user } = setup()

    await user.type(
      screen.getByRole('textbox', { name: "Customer's pickup code" }),
      '9999'
    )

    expect(
      await screen.findByText(/No order with this code/)
    ).toBeInTheDocument()
  })

  it('keeps only digits, four at most', async () => {
    const { user } = setup()
    const box = screen.getByRole('textbox', { name: "Customer's pickup code" })

    await user.type(box, '48a2-1999')

    expect(box).toHaveValue('4821')
  })
})

describe('what the platform says about the customer', () => {
  const trust = (
    label: 'NEW' | 'RELIABLE' | 'CAUTION' | 'PREPAY_REQUIRED'
  ) => ({
    label,
    completedOrders: 3,
    noShowsLast90Days: 2,
  })

  it('shows a label and the facts behind it', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ customerTrust: trust('CAUTION') }),
    ])
    setup()

    expect(await screen.findByText('Caution')).toBeInTheDocument()
    expect(
      screen.getByText('3 completed · 2 not picked up in 90 days')
    ).toBeInTheDocument()
  })

  it('has a word for each label, and no number that looks like a score', async () => {
    for (const [label, text] of [
      ['NEW', 'New customer'],
      ['RELIABLE', 'Reliable'],
      ['PREPAY_REQUIRED', 'Prepay required'],
    ] as const) {
      vi.mocked(listOrdersApi).mockResolvedValue([
        order({
          customerTrust: { label, completedOrders: 0, noShowsLast90Days: 0 },
        }),
      ])
      const { unmount } = setup()

      expect(await screen.findByText(text)).toBeInTheDocument()
      expect(screen.queryByText(/score|skor/i)).not.toBeInTheDocument()
      unmount()
    }
  })

  it('shows nothing when the platform said nothing', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([order({ customerTrust: null })])
    setup()

    await screen.findByText('Rina')
    expect(
      screen.queryByText(/New customer|Reliable|Caution|Prepay required/)
    ).not.toBeInTheDocument()
  })
})

describe('rating a customer with one tap', () => {
  const sold = (over: Partial<StreetOrder> = {}) =>
    order({
      status: 'COMPLETED',
      noShowAvailableAt: null,
      canRate: true,
      ...over,
    })

  it('is two thumbs and nothing to fill in', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([sold()])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Good customer' })
    )

    await waitFor(() =>
      expect(rateOrderApi).toHaveBeenCalledWith('melati', 'o1', 'UP')
    )
  })

  it('shows the tap at once and does not take a second one', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([sold()])
    const { user } = setup()

    const up = await screen.findByRole('button', { name: 'Good customer' })
    await user.click(up)

    expect(up).toHaveAttribute('aria-pressed', 'true')
    expect(up).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Problem customer' })
    ).toBeDisabled()
    expect(rateOrderApi).toHaveBeenCalledTimes(1)
  })

  it('sends a thumbs down the same way', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([sold()])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Problem customer' })
    )

    await waitFor(() =>
      expect(rateOrderApi).toHaveBeenCalledWith('melati', 'o1', 'DOWN')
    )
  })

  it('shows a no-show as already a thumbs down: one tap, not two', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({
        status: 'CANCELLED',
        reasonCode: 'NO_SHOW',
        noShowAvailableAt: null,
        rating: 'DOWN',
        ratingCounted: true,
      }),
    ])
    const { user } = setup()

    const down = await screen.findByRole('button', { name: 'Problem customer' })
    expect(down).toHaveAttribute('aria-pressed', 'true')
    expect(down).toBeDisabled()
    expect(screen.getByText('Already counted')).toBeInTheDocument()

    await user.click(down)
    expect(rateOrderApi).not.toHaveBeenCalled()
  })

  it('is not offered where it does not apply', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([
      order({ status: 'PREPARING', noShowAvailableAt: null, canRate: false }),
    ])
    setup()

    await screen.findByText('Rina')
    expect(
      screen.queryByRole('button', { name: 'Good customer' })
    ).not.toBeInTheDocument()
  })
})

describe('not serving a customer again', () => {
  it('asks first, and says what will happen', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([order()])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Do not serve again' })
    )

    expect(blockCustomerApi).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        /refused at all your outlets, with no reason shown to them/
      )
    ).toBeInTheDocument()
  })

  it("blocks the order's customer once confirmed", async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([order()])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Do not serve again' })
    )
    await user.click(screen.getByRole('button', { name: 'Stop serving' }))

    await waitFor(() =>
      expect(blockCustomerApi).toHaveBeenCalledWith('melati', 'o1')
    )
  })

  it('does nothing when the vendor cancels', async () => {
    vi.mocked(listOrdersApi).mockResolvedValue([order()])
    const { user } = setup()

    await user.click(
      await screen.findByRole('button', { name: 'Do not serve again' })
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(blockCustomerApi).not.toHaveBeenCalled()
  })
})
