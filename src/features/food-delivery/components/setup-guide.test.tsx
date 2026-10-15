import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { deliveryApi } from '../delivery.api'
import type { Connection } from '../delivery.types'
import { bindingFixture, connectionFixture } from '../test-fixtures'
import { Connections } from './connections'

vi.mock('../delivery.api', () => ({
  deliveryApi: {
    connections: vi.fn(),
    connect: vi.fn(),
    bindings: vi.fn(),
    mappings: vi.fn(),
  },
}))
vi.mock('@/lib/tenant-api-client', () => ({
  tenantGet: vi.fn(async (path: string) =>
    path.startsWith('/modifier-groups')
      ? { data: [], meta: { totalPages: 1 } }
      : { data: [] }
  ),
}))

const outlets = [
  { id: 'outlet-1', name: 'Kopi Kenangan Sudirman', isActive: true },
] as Outlet[]

describe('delivery setup guide', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const tenant = {
      id: 'tenant-a',
      name: 'Cafe',
      slug: 'cafe',
      isActive: true,
      createdAt: '',
    }
    useAuthStore.setState({
      activeTenant: tenant,
      tenants: [{ id: 'membership', tenant, role: 'OWNER', memberSince: '' }],
    })
  })
  afterEach(() => {
    client.clear()
    vi.resetAllMocks()
    useAuthStore.getState().clearAuth()
  })
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  const stepButton = (name: RegExp) =>
    within(screen.getByRole('navigation', { name: 'Setup steps' })).getByRole(
      'button',
      { name }
    )

  it('connects an account and moves on to linking the outlet', async () => {
    const created: Connection = {
      id: 'connection-new',
      provider: 'GOFOOD',
      environment: 'SANDBOX',
      accountId: 'partner-42',
      enabled: false,
      writesEnabled: false,
    }
    let saved: Connection[] = []
    vi.mocked(deliveryApi.connections).mockImplementation(async () => saved)
    vi.mocked(deliveryApi.connect).mockImplementation(async () => {
      saved = [created]
      return created
    })
    vi.mocked(deliveryApi.bindings).mockResolvedValue([])
    render(<Connections outletId='outlet-1' outlets={outlets} />, {
      wrapper: Wrapper,
    })
    expect(await screen.findByText('How setup works')).toBeVisible()
    await userEvent.click(
      screen.getAllByRole('button', { name: /start setup/i })[0]
    )
    expect(stepButton(/link your outlet/i)).toBeDisabled()
    await userEvent.type(
      screen.getByLabelText('Partner account ID'),
      'partner-42'
    )
    await userEvent.type(
      screen.getByLabelText('Credential reference'),
      'cafe_gofood'
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Connect GoFood account' })
    )
    expect(deliveryApi.connect).toHaveBeenCalledWith({
      provider: 'GOFOOD',
      environment: 'SANDBOX',
      accountId: 'partner-42',
      credentialKey: 'CAFE_GOFOOD',
    })
    expect(
      await screen.findByRole('heading', { name: 'Link your outlet' })
    ).toBeVisible()
    expect(screen.getByText('Step 2 of 6')).toBeVisible()
    expect(screen.getByLabelText('GoFood outlet ID')).toBeRequired()
  }, 15_000)

  it('resumes at the first step that still needs work', async () => {
    vi.mocked(deliveryApi.connections).mockResolvedValue([connectionFixture])
    vi.mocked(deliveryApi.bindings).mockResolvedValue([
      { ...bindingFixture, outletId: 'outlet-1' },
    ])
    vi.mocked(deliveryApi.mappings).mockResolvedValue([])
    render(<Connections outletId='outlet-1' outlets={outlets} />, {
      wrapper: Wrapper,
    })
    expect(
      await screen.findByRole('heading', { name: 'Match menu items' })
    ).toBeVisible()
    expect(screen.getByText('Step 4 of 6')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '4'
    )
    await waitFor(() => expect(stepButton(/go live/i)).toBeEnabled())
  })
})
