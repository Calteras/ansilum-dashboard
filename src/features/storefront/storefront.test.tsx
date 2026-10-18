import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicOrder } from './api/storefront.types'
import { CartCheckout } from './components/cart-checkout'
import { ProductSheet } from './components/product-sheet'
import { useCartStore } from './lib/cart'
import { OrderPage } from './pages/order-page'
import { StorefrontMenu } from './pages/storefront-menu'
import { latte, menu } from './test-fixtures'
import './test-storage'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
  Link: ({ children, ...props }: { children: ReactNode }) => (
    <a {...(props as object)}>{children}</a>
  ),
}))

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function respond(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

const order: PublicOrder = {
  code: 'A7K4P2',
  status: 'AWAITING_PAYMENT',
  payment: 'PAY_AT_CASHIER',
  placedAt: '2026-10-18T04:42:00.000Z',
  expiresAt: '2026-10-18T05:12:00.000Z',
  paidAt: null,
  cancelledAt: null,
  storefront: { slug: 'kopi-senja', name: 'Kopi Senja' },
  outlet: { id: 'lumajang', name: 'Lumajang', address: null },
  customerName: 'Saiful',
  itemCount: 2,
  items: [
    {
      name: 'Caffe Latte',
      variantName: 'Large',
      options: ['Ice', 'Less sugar'],
      quantity: 2,
      unitPriceMinor: 3_500_000,
      subtotalMinor: 7_000_000,
      notes: null,
    },
  ],
  subtotalMinor: 7_000_000,
  taxMinor: 700_000,
  serviceMinor: 0,
  totalMinor: 7_700_000,
  taxRate: 10,
  serviceChargeRate: 0,
}

beforeEach(() => {
  window.localStorage.clear()
  useCartStore.getState().clear()
  navigate.mockReset()
})
afterEach(() => vi.restoreAllMocks())

describe('product options', () => {
  it('preselects defaults, enforces limits and adds the configured line', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    wrap(<ProductSheet product={latte} onClose={() => {}} onAdd={onAdd} />)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: /Regular/ })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: /Ice/ })).toBeChecked()
    expect(within(dialog).getByText('Required, choose 1')).toBeInTheDocument()
    expect(within(dialog).getByText('Optional, up to 2')).toBeInTheDocument()
    // Sold-out options say so in words, not just colour.
    expect(
      within(dialog).getByRole('checkbox', { name: /Oat milk/ })
    ).toBeDisabled()
    expect(within(dialog).getByText('Sold out')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('radio', { name: /Large/ }))
    await user.click(within(dialog).getByRole('checkbox', { name: /\+1 shot/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Increase' }))
    await user.type(within(dialog).getByLabelText(/Note/), 'Less ice')
    const add = within(dialog).getByRole('button', { name: /Add to cart/ })
    expect(add).toHaveTextContent('Rp82,000')
    await user.click(add)

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'latte',
        variantId: 'large',
        modifierIds: ['ice', 'shot'],
        quantity: 2,
        notes: 'Less ice',
        unitPriceMinor: 4_100_000,
        optionNames: ['Ice', '+1 shot'],
      })
    )
  })

  it('points at a missing required choice instead of adding', async () => {
    const user = userEvent.setup()
    const noDefault = {
      ...latte,
      modifierGroups: [
        {
          ...latte.modifierGroups[0],
          options: latte.modifierGroups[0].options.map((o) => ({
            ...o,
            isDefault: false,
          })),
        },
      ],
    }
    const onAdd = vi.fn()
    wrap(<ProductSheet product={noDefault} onClose={() => {}} onAdd={onAdd} />)
    const dialog = await screen.findByRole('dialog')
    const add = within(dialog).getByRole('button', { name: /Add to cart/ })
    await user.click(add)
    expect(onAdd).not.toHaveBeenCalled()
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Choose Temperature to continue.'
    )
    await user.click(within(dialog).getByRole('radio', { name: /Hot/ }))
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
    await user.click(add)
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ modifierIds: ['hot'] })
    )
  })
})

describe('checkout', () => {
  const scope = { slug: 'kopi-senja', outletId: 'lumajang' }
  const addLatte = () =>
    useCartStore.getState().add(scope, {
      productId: 'latte',
      variantId: 'large',
      modifierIds: ['ice'],
      quantity: 2,
      notes: '',
      name: 'Caffe Latte',
      variantName: 'Large',
      optionNames: ['Ice'],
      unitPriceMinor: 3_500_000,
    })

  it('shows an empty cart', () => {
    wrap(
      <CartCheckout
        slug='kopi-senja'
        storeName='Kopi Senja'
        cart={null}
        menu={menu}
      />
    )
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('sends choices, not prices, and opens the order page', async () => {
    const user = userEvent.setup()
    addLatte()
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        respond(201, { data: { ...order, accessToken: 't'.repeat(43) } })
      )
    wrap(
      <CartCheckout
        slug='kopi-senja'
        storeName='Kopi Senja'
        cart={useCartStore.getState().cart}
        menu={menu}
      />
    )
    expect(screen.getByText('Tax 10%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Place order/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Add your name')
    expect(fetch).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Name'), 'Saiful')
    await user.click(screen.getByRole('button', { name: /Place order/ }))
    await waitFor(() => expect(navigate).toHaveBeenCalled())

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/public/storefronts/kopi-senja/orders')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      clientSubmissionId: expect.any(String),
      outletId: 'lumajang',
      customer: { name: 'Saiful' },
      items: [
        {
          productId: 'latte',
          variantId: 'large',
          modifierIds: ['ice'],
          quantity: 2,
        },
      ],
      expectedTotalMinor: 7_700_000,
    })
    expect(JSON.stringify(body)).not.toMatch(/unitPrice|tenant/)
    expect(navigate).toHaveBeenCalledWith({
      to: '/o/$code',
      params: { code: 'A7K4P2' },
      search: { t: 't'.repeat(43) },
    })
    expect(useCartStore.getState().cart).toBeNull()
    expect(
      JSON.parse(window.localStorage.getItem('ansilum.storefront.orders')!)[0]
    ).toMatchObject({ code: 'A7K4P2', slug: 'kopi-senja' })
  })

  it('explains a price change and refreshes the cart from the menu', async () => {
    const user = userEvent.setup()
    addLatte()
    const repriced = {
      ...menu,
      categories: [
        {
          ...menu.categories[0],
          products: [{ ...latte, priceMinor: 3_200_000 }],
        },
      ],
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        respond(409, { code: 'PRICE_CHANGED', data: { totalMinor: 1 } })
      )
      .mockResolvedValueOnce(respond(200, { data: repriced }))
    wrap(
      <CartCheckout
        slug='kopi-senja'
        storeName='Kopi Senja'
        cart={useCartStore.getState().cart}
        menu={menu}
      />
    )
    await user.type(screen.getByLabelText('Name'), 'Saiful')
    await user.click(screen.getByRole('button', { name: /Place order/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Prices changed')
    expect(useCartStore.getState().cart!.lines[0].unitPriceMinor).toBe(
      3_700_000
    )
    expect(navigate).not.toHaveBeenCalled()
  })

  it('marks lines the store refused', async () => {
    const user = userEvent.setup()
    addLatte()
    const gone = {
      ...menu,
      categories: [{ ...menu.categories[0], products: [] }],
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        respond(422, {
          code: 'ORDER_INVALID',
          data: { problems: [{ line: 0, code: 'PRODUCT_UNAVAILABLE' }] },
        })
      )
      .mockResolvedValueOnce(respond(200, { data: gone }))
    const { rerender } = wrap(
      <CartCheckout
        slug='kopi-senja'
        storeName='Kopi Senja'
        cart={useCartStore.getState().cart}
        menu={menu}
      />
    )
    await user.type(screen.getByLabelText('Name'), 'Saiful')
    await user.click(screen.getByRole('button', { name: /Place order/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no longer available'
    )
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CartCheckout
          slug='kopi-senja'
          storeName='Kopi Senja'
          cart={useCartStore.getState().cart}
          menu={menu}
        />
      </QueryClientProvider>
    )
    expect(screen.getByText('No longer available')).toBeInTheDocument()
  })
})

describe('order page', () => {
  it('shows the code, QR and deadline while waiting for payment', async () => {
    const expiresAt = new Date(Date.now() + 4.5 * 60_000).toISOString()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond(200, { data: { ...order, expiresAt } })
    )
    wrap(<OrderPage code='A7K4P2' token={'t'.repeat(43)} />)
    expect(
      await screen.findByRole('heading', { name: /Order code A 7 K 4 P 2/ })
    ).toHaveTextContent('A7K4P2')
    expect(screen.getByTitle('QR code for the cashier')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Show this code to the cashier'
    )
    expect(screen.getAllByText('Rp77,000').length).toBeGreaterThan(0)
    expect(screen.getByText('5 min left', { exact: false })).toBeInTheDocument()
    expect(
      screen.getByText('Ice, Less sugar', { exact: false })
    ).toBeInTheDocument()
  })

  it('confirms payment and drops the QR code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond(200, { data: { ...order, status: 'PAID' } })
    )
    wrap(<OrderPage code='A7K4P2' token={'t'.repeat(43)} />)
    expect(await screen.findByRole('status')).toHaveTextContent('Paid')
    expect(screen.getByText('PAID')).toBeInTheDocument()
    expect(
      screen.queryByTitle('QR code for the cashier')
    ).not.toBeInTheDocument()
  })

  it.each([
    ['EXPIRED', 'Order expired'],
    ['CANCELLED', 'Order cancelled'],
  ])('explains %s orders', async (status, text) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond(200, { data: { ...order, status } })
    )
    wrap(<OrderPage code='A7K4P2' token={'t'.repeat(43)} />)
    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('says not found without the link token, without asking the server', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    wrap(<OrderPage code='A7K4P2' />)
    expect(screen.getByText('Order not found')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('menu', () => {
  const croissant = {
    ...latte,
    id: 'croissant',
    name: 'Croissant',
    description: 'Butter, baked every morning',
    priceMinor: 1_400_000,
    variants: [],
    modifierGroups: [],
  }
  const storefront = {
    slug: 'kopi-senja',
    name: 'Kopi Senja',
    description: null,
    logoUrl: null,
    primaryColor: '#7a3e1d',
    outlets: [menu.outlet],
  }
  const fullMenu = {
    ...menu,
    categories: [
      { id: 'coffee', name: 'Coffee', products: [latte] },
      { id: 'food', name: 'Food', products: [croissant] },
    ],
  }
  const serve = () =>
    vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) =>
        String(input).includes('/catalog')
          ? respond(200, { data: fullMenu })
          : respond(200, { data: storefront })
      )

  it('adds simple items in one tap and confirms it', async () => {
    const user = userEvent.setup()
    serve()
    wrap(<StorefrontMenu slug='kopi-senja' outletId='lumajang' />)
    expect(
      await screen.findByRole('heading', { name: 'Food' })
    ).toBeInTheDocument()
    // Items with choices open the options sheet instead of a quick add.
    expect(
      screen.queryByRole('button', { name: 'Add Caffe Latte' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add Croissant' }))
    expect(screen.getByRole('status')).toHaveTextContent('Added Croissant')
    expect(screen.getByLabelText('1 in cart')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /View cart/ })[0]
    ).toHaveTextContent('Rp14,000')
    expect(useCartStore.getState().cart!.lines[0]).toMatchObject({
      productId: 'croissant',
      quantity: 1,
    })
  })

  it('searches the whole menu', async () => {
    const user = userEvent.setup()
    serve()
    wrap(<StorefrontMenu slug='kopi-senja' outletId='lumajang' />)
    await screen.findByRole('heading', { name: 'Food' })
    await user.click(screen.getByRole('button', { name: 'Search the menu' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Search the menu' }),
      'butter'
    )
    expect(screen.getByText('Croissant')).toBeInTheDocument()
    expect(screen.queryByText('Caffe Latte')).not.toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: 'Search the menu' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Search the menu' }),
      'tea'
    )
    expect(screen.getByText(/Nothing on the menu matches/)).toBeInTheDocument()
  })

  it('opens options for items with choices', async () => {
    const user = userEvent.setup()
    serve()
    wrap(<StorefrontMenu slug='kopi-senja' outletId='lumajang' />)
    await user.click(await screen.findByRole('button', { name: /Caffe Latte/ }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Temperature')
    // Sheets render in a portal; they must still carry the store's colour.
    expect(dialog.style.getPropertyValue('--store-accent')).toBe('#7a3e1d')
  })
})
