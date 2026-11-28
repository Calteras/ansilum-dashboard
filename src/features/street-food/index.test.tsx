import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { StreetFood } from './index'
import {
  connectApi,
  disconnectApi,
  getFeesApi,
  getOverviewApi,
  listBlocksApi,
  listOrdersApi,
  rotateSecretApi,
  saveHoursApi,
  saveSettingsApi,
  setPublicationApi,
} from './street-food.api'
import type { StreetFoodOutlet, StreetFoodOverview } from './street-food.types'

vi.mock('./street-food.api')
vi.mock('@/components/layout/app-header', () => ({ AppHeader: () => null }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: PropsWithChildren<{ to: string }>) => (
    <a href={to}>{children}</a>
  ),
}))

const outlet = (over: Partial<StreetFoodOutlet> = {}): StreetFoodOutlet => ({
  outletId: 'melati',
  name: 'Kios Melati',
  address: 'Jl. Melati 3',
  latitude: -6.25,
  longitude: 106.85,
  enabled: false,
  onlineStatus: 'OPEN',
  prepTimeMinutes: 15,
  timezone: 'Asia/Jakarta',
  locationMode: 'FIXED',
  locationSharing: 'LIVE',
  hours: [],
  pricingValid: true,
  isOpenNow: true,
  acceptingOrders: true,
  dayOpen: false,
  lastCheckedAt: null,
  prepayFrom: 'NONE',
  refuseFrom: 'NONE',
  ...over,
})

const link = {
  linkId: 'l1',
  keyId: 'sfk_abc',
  platformUrl: 'http://localhost:8080',
  status: 'ACTIVE' as const,
  createdAt: '2026-11-21T01:00:00Z',
  revokedAt: null,
}

const notLinked: StreetFoodOverview = {
  link: null,
  delivery: null,
  outlets: [outlet()],
}

const waiting: StreetFoodOverview = {
  link,
  delivery: {
    pending: 2,
    failed: 0,
    lastDeliveredAt: null,
    lastError: 'HTTP_401',
  },
  outlets: [outlet({ enabled: true })],
}

const connected: StreetFoodOverview = {
  link,
  delivery: {
    pending: 0,
    failed: 0,
    lastDeliveredAt: '2026-11-21T02:00:00Z',
    lastError: null,
  },
  outlets: [outlet({ enabled: true })],
}

function signIn(role: 'OWNER' | 'ADMIN' | 'MEMBER') {
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
    id: 'tenant-1',
    name: 'Warung Sri',
    slug: 'warung-sri',
    isActive: true,
    createdAt: '',
  }
  auth.setActiveTenant(tenant)
  auth.setTenants([{ id: 'member', tenant, role, memberSince: '' }])
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { user: userEvent.setup(), ...render(<StreetFood />, { wrapper }) }
}

beforeAll(() => {
  // Radix Select needs these in jsdom.
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

beforeEach(() => {
  vi.mocked(getOverviewApi).mockReset().mockResolvedValue(notLinked)
  vi.mocked(listOrdersApi).mockReset().mockResolvedValue([])
  vi.mocked(listBlocksApi).mockReset().mockResolvedValue([])
  vi.mocked(getFeesApi)
    .mockReset()
    .mockResolvedValue({
      totalMinor: 192900,
      lines: [
        {
          code: 'ONLINE_ORDERS',
          label: 'Platform fees, online orders',
          orders: 1,
          amountMinor: 154000,
        },
        {
          code: 'PICKUP_ORDERS',
          label: 'Platform fees, pay at pickup',
          orders: 1,
          amountMinor: 38900,
        },
      ],
      note: '',
    })
  for (const api of [
    setPublicationApi,
    saveSettingsApi,
    saveHoursApi,
    disconnectApi,
  ])
    vi.mocked(api)
      .mockReset()
      .mockResolvedValue(undefined as never)
  vi.mocked(connectApi).mockReset().mockResolvedValue({
    linkId: 'l1',
    tenantId: 'tenant-1',
    keyId: 'sfk_abc',
    secret: 'sfs_topsecret',
    platformUrl: 'http://localhost:8080',
  })
  vi.mocked(rotateSecretApi).mockReset().mockResolvedValue({
    keyId: 'sfk_abc',
    secret: 'sfs_newsecret',
  })
  signIn('OWNER')
})

describe('connecting', () => {
  it('asks only for the platform address and refuses an unsafe one before calling the API', async () => {
    const { user } = setup()
    const field = await screen.findByLabelText(/StreetFood platform address/i)

    await user.type(field, 'http://api.streetfood.id')
    await user.click(screen.getByRole('button', { name: 'Connect' }))
    expect(await screen.findByText(/Use https/i)).toBeInTheDocument()
    expect(connectApi).not.toHaveBeenCalled()

    await user.clear(field)
    await user.type(field, 'banana')
    await user.click(screen.getByRole('button', { name: 'Connect' }))
    expect(await screen.findByText(/not a valid address/i)).toBeInTheDocument()
    expect(connectApi).not.toHaveBeenCalled()
  })

  it('connects with the address alone and shows the one-time secret, which must be saved before moving on', async () => {
    const { user } = setup()
    await user.type(
      await screen.findByLabelText(/StreetFood platform address/i),
      'http://localhost:8080/'
    )
    await user.click(screen.getByRole('button', { name: 'Connect' }))

    expect(connectApi).toHaveBeenCalledWith('http://localhost:8080')
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('Your business is connected')
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/shown only once/i)).toBeInTheDocument()

    // The secret is hidden until asked for.
    expect(within(dialog).getByTestId('secret')).not.toHaveTextContent(
      'sfs_topsecret'
    )
    await user.click(within(dialog).getByRole('button', { name: 'Show' }))
    expect(within(dialog).getByTestId('secret')).toHaveTextContent(
      'sfs_topsecret'
    )

    // What the operator needs, in one block.
    const details = within(dialog).getByTestId('registration')
    expect(details).toHaveTextContent('"posTenantId": "tenant-1"')
    expect(details).toHaveTextContent('"keyId": "sfk_abc"')
    expect(details).toHaveTextContent('"name": "Warung Sri"')

    // Done waits for the owner to confirm, and a stray Escape does not close it.
    const done = within(dialog).getByRole('button', { name: 'Done' })
    expect(done).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('checkbox'))
    expect(done).toBeEnabled()
    await user.click(done)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
  })

  it('offers the registration as a command that keeps the operator token out of it', async () => {
    const { user } = setup()
    await user.type(
      await screen.findByLabelText(/StreetFood platform address/i),
      'http://localhost:8080'
    )
    await user.click(screen.getByRole('button', { name: 'Connect' }))
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('radio', { name: 'Command' }))
    const command = within(dialog).getByTestId('registration')
    expect(command).toHaveTextContent(
      'http://localhost:8080/v1/admin/merchants'
    )
    expect(command).toHaveTextContent('$ADMIN_API_TOKEN')
    expect(command).toHaveTextContent('sfk_abc')
  })

  it('shows the server’s reason when connecting fails', async () => {
    vi.mocked(connectApi).mockRejectedValue(
      new Error('Platform host is not allowed')
    )
    const { user } = setup()
    await user.type(
      await screen.findByLabelText(/StreetFood platform address/i),
      'https://api.streetfood.id'
    )
    await user.click(screen.getByRole('button', { name: 'Connect' }))
    await waitFor(() => expect(connectApi).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('once linked', () => {
  it('says the business is waiting for the platform and explains what to do', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(waiting)
    setup()
    expect(
      await screen.findByText(
        'Waiting for StreetFood to register your business'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/does not recognise this key yet/i)
    ).toBeInTheDocument()
    // The fees are not asked for until the platform is connected.
    expect(getFeesApi).not.toHaveBeenCalled()
  })

  it('asks for an outlet first when none is shown', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue({
      ...waiting,
      outlets: [outlet({ enabled: false })],
    })
    setup()
    expect(
      await screen.findByText('Choose which outlets to show')
    ).toBeInTheDocument()
  })

  it('shows an outlet to customers with one switch', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue({
      ...waiting,
      outlets: [outlet({ enabled: false })],
    })
    const { user } = setup()
    await user.click(
      await screen.findByRole('switch', {
        name: 'Show Kios Melati on StreetFood',
      })
    )
    expect(setPublicationApi).toHaveBeenCalledWith('melati', true)
  })

  it('is plain about what customers see, and why not', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue({
      ...connected,
      outlets: [
        outlet({
          enabled: true,
          onlineStatus: 'AUTO',
          hours: [],
          latitude: null,
          longitude: null,
          pricingValid: false,
          isOpenNow: false,
          acceptingOrders: false,
        }),
      ],
    })
    setup()
    expect(await screen.findByText('Closed now')).toBeInTheDocument()
    expect(screen.getByText('Not taking orders')).toBeInTheDocument()
    expect(screen.getByText(/orders cannot be priced/i)).toBeInTheDocument()
    expect(screen.getByText(/no map coordinates/i)).toBeInTheDocument()
    expect(screen.getByText(/counts as always closed/i)).toBeInTheDocument()
  })

  it('changes the order status in one tap', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(connected)
    const { user } = setup()
    await user.click(await screen.findByRole('radio', { name: 'Pause' }))
    expect(saveSettingsApi).toHaveBeenCalledWith('melati', {
      onlineStatus: 'PAUSED',
    })
  })

  it('shows, and saves, what the outlet does about customers who need care', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue({
      ...connected,
      outlets: [outlet({ enabled: true, prepayFrom: 'CAUTION' })],
    })
    const { user } = setup()

    const ask = await screen.findByRole('combobox', {
      name: 'Ask to pay in the app',
    })
    expect(ask).toHaveTextContent('Caution and worse')
    expect(
      screen.getByRole('combobox', { name: 'Refuse orders from' })
    ).toHaveTextContent('Nobody')

    await user.click(
      screen.getByRole('combobox', { name: 'Refuse orders from' })
    )
    await user.click(
      await screen.findByRole('option', { name: 'Prepay required only' })
    )

    expect(saveSettingsApi).toHaveBeenCalledWith('melati', {
      refuseFrom: 'PREPAY_REQUIRED',
    })
  })

  it('edits the opening hours without typing seven days by hand', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(connected)
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Edit hours' }))
    const dialog = await screen.findByRole('dialog')

    await user.click(
      within(dialog).getByRole('button', { name: /Same every day/ })
    )
    await user.click(within(dialog).getByRole('button', { name: 'Save hours' }))

    await waitFor(() => expect(saveHoursApi).toHaveBeenCalled())
    const [outletId, intervals] = vi.mocked(saveHoursApi).mock.calls[0]
    expect(outletId).toBe('melati')
    expect(intervals).toHaveLength(7)
    expect(intervals[0]).toEqual({
      dayOfWeek: 1,
      opensAt: '08:00',
      closesAt: '17:00',
    })
    expect(intervals[intervals.length - 1]).toEqual({
      dayOfWeek: 0,
      opensAt: '08:00',
      closesAt: '17:00',
    })
  })

  it('will not save hours the server would refuse', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue({
      ...connected,
      outlets: [
        outlet({
          enabled: true,
          hours: [{ dayOfWeek: 1, opensAt: '08:00', closesAt: '17:00' }],
        }),
      ],
    })
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Edit hours' }))
    const dialog = await screen.findByRole('dialog')

    const closes = within(dialog).getByLabelText('Monday closes')
    await user.clear(closes)
    await user.type(closes, '08:00')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      /cannot be the same/i
    )
    expect(
      within(dialog).getByRole('button', { name: 'Save hours' })
    ).toBeDisabled()
  })

  it('shows what is owed once connected, and says when it is collected', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(connected)
    setup()
    expect(
      await screen.findByText('Connected to StreetFood')
    ).toBeInTheDocument()
    expect(await screen.findByText(/Rp\s?1[.,]929/)).toBeInTheDocument()
    expect(
      screen.getByText(/next automatic subscription payment/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Platform fees, pay at pickup/)).toBeInTheDocument()
  })

  it('shows a clearer way to a new secret, and warns what it does', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(connected)
    const { user } = setup()
    await user.click(
      await screen.findByRole('button', { name: 'Create a new secret' })
    )
    expect(
      await screen.findByText(/old secret stops working at once/i)
    ).toBeInTheDocument()
    expect(rotateSecretApi).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Create new secret' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Your new secret key',
    })
    await user.click(within(dialog).getByRole('button', { name: 'Show' }))
    expect(within(dialog).getByTestId('secret')).toHaveTextContent(
      'sfs_newsecret'
    )
  })

  it('asks before disconnecting', async () => {
    vi.mocked(getOverviewApi).mockResolvedValue(connected)
    const { user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Disconnect' }))
    expect(disconnectApi).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/hidden from customers/i)
    ).toBeInTheDocument()

    const buttons = screen.getAllByRole('button', { name: 'Disconnect' })
    const confirm = buttons[buttons.length - 1]
    await user.click(confirm)
    await waitFor(() => expect(disconnectApi).toHaveBeenCalled())
  })
})

describe('who can use it', () => {
  it('keeps members out without asking the API anything', async () => {
    signIn('MEMBER')
    setup()
    expect(
      await screen.findByText(/Only owners and admins/i)
    ).toBeInTheDocument()
    expect(getOverviewApi).not.toHaveBeenCalled()
  })

  it('lets admins in', async () => {
    signIn('ADMIN')
    setup()
    expect(
      await screen.findByLabelText(/StreetFood platform address/i)
    ).toBeInTheDocument()
  })

  it('explains when StreetFood is not switched on for this POS', async () => {
    vi.mocked(getOverviewApi).mockRejectedValue(new Error('Not found.'))
    setup()
    expect(
      await screen.findByText('StreetFood is not switched on for this POS')
    ).toBeInTheDocument()
  })

  it('offers a retry on other errors', async () => {
    vi.mocked(getOverviewApi).mockRejectedValue(new Error('Network down'))
    setup()
    expect(await screen.findByText('Network down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
  })
})
