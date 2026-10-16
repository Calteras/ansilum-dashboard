import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { listOutletsApi } from '@/features/outlets/api/outlets.api'
import { SettingsReceipt } from './index'
import { readReceiptTemplate } from './layout/receipt-template'
import {
  getReceiptSettingsApi,
  readReceiptSettings,
  updateReceiptSettingsApi,
} from './receipt-settings.api'

vi.mock('./receipt-settings.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./receipt-settings.api')>()),
  getReceiptSettingsApi: vi.fn(),
  updateReceiptSettingsApi: vi.fn(),
}))
vi.mock('@/features/outlets/api/outlets.api', () => ({
  listOutletsApi: vi.fn(),
}))

const saved = readReceiptSettings({
  receiptTemplate: { footer: { thankYou: 'Sampai jumpa lagi' } },
})

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
  return render(<SettingsReceipt />, { wrapper })
}

const paper = () => screen.getByRole('figure', { name: /receipt preview/i })

beforeEach(() => {
  vi.mocked(getReceiptSettingsApi).mockReset().mockResolvedValue(saved)
  vi.mocked(updateReceiptSettingsApi)
    .mockReset()
    .mockImplementation(async (_tenantId, settings) => settings)
  vi.mocked(listOutletsApi).mockResolvedValue({
    data: [
      {
        id: 'outlet',
        tenantId: 'tenant',
        name: 'Kedai Senja Dago',
        code: 'DGO',
        address: 'Jl. Juanda 12, Bandung',
        phone: '0812 3456 7890',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ],
    total: 1,
    page: 1,
    pageSize: 100,
  })
  signIn('OWNER')
})

it('shows the saved design on a 58 mm receipt with the outlet details', async () => {
  setup()
  const receipt = await screen.findByRole('figure', { name: /58 mm/ })
  expect(within(receipt).getByText(/Kedai Senja Dago/)).toBeInTheDocument()
  await waitFor(() =>
    expect(
      within(receipt).getByText(/Jl\. Juanda 12, Bandung/)
    ).toBeInTheDocument()
  )
  expect(within(receipt).getByText(/Sampai jumpa lagi/)).toBeInTheDocument()
  expect(within(receipt).getByText(/TOTAL\s+Rp115\.640/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})

it('previews changes before they are saved, at 80 mm too', async () => {
  const user = userEvent.setup()
  setup()
  await screen.findByRole('figure', { name: /58 mm/ })

  await user.type(
    screen.getByRole('textbox', { name: 'Name on the receipt' }),
    'Warung Senja'
  )
  await user.click(screen.getByRole('switch', { name: 'Powered by Ansilum' }))
  expect(within(paper()).getByText(/Warung Senja/)).toBeInTheDocument()
  expect(within(paper()).queryByText(/Powered by Ansilum/)).toBeNull()
  expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument()

  await user.click(screen.getByRole('tab', { name: '80 mm' }))
  expect(screen.getByRole('figure', { name: /80 mm/ })).toBeInTheDocument()
  expect(
    within(paper()).getByText(/2x Kopi susu gula aren\s+27\.000\s+54\.000/)
  ).toBeInTheDocument()
})

it('saves the receipt settings together', async () => {
  const user = userEvent.setup()
  setup()
  await screen.findByRole('figure', { name: /58 mm/ })

  await user.click(
    screen.getByRole('switch', { name: 'Cut the paper automatically' })
  )
  await user.click(screen.getByRole('radio', { name: 'English' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(updateReceiptSettingsApi).toHaveBeenCalled())
  const [tenantId, settings] = vi.mocked(updateReceiptSettingsApi).mock.calls[0]
  expect(tenantId).toBe('tenant')
  expect(settings.autoCutPaper).toBe(false)
  expect(settings.receiptTemplate.language).toBe('en')
  expect(settings.receiptTemplate.version).toBe(1)
  expect(settings.receiptTemplate.footer.thankYou).toBe('Sampai jumpa lagi')
})

it('asks for a link before saving a QR code', async () => {
  const user = userEvent.setup()
  setup()
  await screen.findByRole('figure', { name: /58 mm/ })

  await user.click(screen.getByRole('switch', { name: 'QR code' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(
    await screen.findByText(
      'Enter a link for the QR code, or turn the QR code off.'
    )
  ).toBeInTheDocument()
  expect(updateReceiptSettingsApi).not.toHaveBeenCalled()
})

it('the default design button restores the template only', async () => {
  vi.mocked(getReceiptSettingsApi).mockResolvedValue(
    readReceiptSettings({
      receiptCopies: 2,
      receiptTemplate: { header: { businessName: 'Lama' } },
    })
  )
  const user = userEvent.setup()
  setup()
  await screen.findByRole('figure', { name: /58 mm/ })

  await user.click(
    screen.getByRole('button', { name: 'Use the default design' })
  )
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(updateReceiptSettingsApi).toHaveBeenCalled())
  const [, settings] = vi.mocked(updateReceiptSettingsApi).mock.calls[0]
  expect(settings.receiptTemplate).toEqual(readReceiptTemplate(null))
  expect(settings.receiptCopies).toBe(2)
})

it('is read-only for members, who can still preview', async () => {
  signIn('MEMBER')
  setup()
  await screen.findByRole('figure', { name: /58 mm/ })

  expect(
    screen.getByText(
      'Only owners and admins can change receipts and printing rules.'
    )
  ).toBeInTheDocument()
  expect(
    screen.getByRole('switch', { name: 'Powered by Ansilum' })
  ).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled()
})

it('offers a retry when the settings cannot load', async () => {
  vi.mocked(getReceiptSettingsApi).mockRejectedValue(new Error('Network down'))
  setup()
  expect(
    await screen.findByText('Receipt settings could not load')
  ).toBeInTheDocument()
  expect(screen.getByText('Network down')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})
