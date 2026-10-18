import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { listProductsApi } from '@/features/products/api/products.api'
import { SettingsOnlineStore } from './index'
import {
  getStorefrontSettingsApi,
  setOutletStorefrontApi,
  updateStorefrontSettingsApi,
  type StorefrontOverview,
} from './online-store.api'

vi.mock('./online-store.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./online-store.api')>()),
  getStorefrontSettingsApi: vi.fn(),
  updateStorefrontSettingsApi: vi.fn(),
  setOutletStorefrontApi: vi.fn(),
  setProductStorefrontApi: vi.fn(),
}))
vi.mock('@/features/products/api/products.api', () => ({
  listProductsApi: vi.fn(),
}))

const overview: StorefrontOverview = {
  exists: false,
  config: {
    enabled: false,
    slug: 'kedai-senja',
    displayName: null,
    description: null,
    primaryColor: null,
    showSoldOutProducts: true,
    orderExpiryMinutes: 30,
    updatedAt: null,
  },
  business: { name: 'Kedai Senja', logoUrl: null },
  outlets: [
    {
      id: 'dago',
      name: 'Dago',
      address: 'Jl. Juanda 12',
      isActive: true,
      storefrontEnabled: false,
    },
    {
      id: 'gudang',
      name: 'Gudang',
      address: null,
      isActive: false,
      storefrontEnabled: false,
    },
  ],
  products: { visible: 3, hidden: 0 },
  pricingValid: true,
}

function signIn(role: 'OWNER' | 'MEMBER') {
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
    name: 'Kedai Senja',
    slug: 'kedai-senja',
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
  return render(<SettingsOnlineStore />, { wrapper })
}

beforeEach(() => {
  vi.mocked(getStorefrontSettingsApi).mockReset().mockResolvedValue(overview)
  vi.mocked(updateStorefrontSettingsApi)
    .mockReset()
    .mockImplementation(async (config) => ({
      ...overview,
      exists: true,
      config: { ...config, updatedAt: '' },
    }))
  vi.mocked(setOutletStorefrontApi).mockReset().mockResolvedValue(undefined)
  vi.mocked(listProductsApi).mockResolvedValue({ data: [] } as never)
  signIn('OWNER')
})

it('says the store is not live until it is switched on', async () => {
  setup()
  expect(
    await screen.findByText('Your online store is not live')
  ).toBeInTheDocument()
  expect(
    screen.getByText('Switch it on under Store, then choose outlets.')
  ).toBeInTheDocument()
})

it('refuses reserved store addresses before saving', async () => {
  const user = userEvent.setup()
  setup()
  const address = await screen.findByLabelText('Store address')
  await user.clear(address)
  await user.type(address, 'admin')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(
    await screen.findByText('This address is reserved. Choose another one.')
  ).toBeInTheDocument()
  expect(updateStorefrontSettingsApi).not.toHaveBeenCalled()
})

it('saves the storefront settings', async () => {
  const user = userEvent.setup()
  setup()
  await user.click(
    await screen.findByRole('switch', { name: /Take online orders/ })
  )
  await user.type(screen.getByLabelText('Short description'), 'Kopi dan roti')
  await user.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(updateStorefrontSettingsApi).toHaveBeenCalledWith({
      enabled: true,
      slug: 'kedai-senja',
      displayName: null,
      description: 'Kopi dan roti',
      primaryColor: null,
      showSoldOutProducts: true,
      orderExpiryMinutes: 30,
    })
  )
})

it('switches outlets on one by one and keeps inactive outlets off', async () => {
  const user = userEvent.setup()
  setup()
  await user.click(await screen.findByRole('tab', { name: 'Outlets' }))
  expect(
    screen.getByRole('switch', { name: 'Online orders for Gudang' })
  ).toBeDisabled()
  await user.click(
    screen.getByRole('switch', { name: 'Online orders for Dago' })
  )
  await waitFor(() =>
    expect(setOutletStorefrontApi).toHaveBeenCalledWith('dago', true)
  )
})

it('lets members look but not change anything', async () => {
  signIn('MEMBER')
  setup()
  expect(
    await screen.findByText(
      'Only owners and admins can change the online store.'
    )
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
})
