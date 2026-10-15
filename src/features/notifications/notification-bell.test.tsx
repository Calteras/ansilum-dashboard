import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { signInAsOwner } from '@/features/settings/subscription/test-fixtures'
import { NotificationBell } from './notification-bell'
import {
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from './notifications.api'
import type { AppNotification } from './notifications.types'

const push = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { push } }),
}))
vi.mock('./notifications.api', () => ({
  listNotificationsApi: vi.fn(),
  markNotificationReadApi: vi.fn(),
  markAllNotificationsReadApi: vi.fn(),
}))

const reminder: AppNotification = {
  id: 'n1',
  type: 'RENEWAL_REMINDER',
  data: {
    tier: 'STANDARD',
    periodEnd: '2026-11-14T03:00:00.000Z',
    mode: 'manual',
    amount: 99000,
    daysLeft: 1,
  },
  link: '/checkout?plan=STANDARD&renew=true',
  readAt: null,
  createdAt: new Date().toISOString(),
}
const receipt: AppNotification = {
  id: 'n2',
  type: 'PAYMENT_RECEIVED',
  data: {
    orderId: 'o1',
    invoiceNumber: 'INV-2026-000001',
    amount: 99000,
    tier: 'STANDARD',
    periodEnd: '2026-11-14T03:00:00.000Z',
    renewal: false,
  },
  link: 'https://evil.example/phish',
  readAt: '2026-10-14T00:00:00.000Z',
  createdAt: new Date().toISOString(),
}

function renderBell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(<NotificationBell />, {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  signInAsOwner()
  vi.mocked(listNotificationsApi).mockResolvedValue({
    data: { items: [reminder, receipt], unreadCount: 1 },
    meta: {},
  })
  vi.mocked(markNotificationReadApi).mockResolvedValue({})
  vi.mocked(markAllNotificationsReadApi).mockResolvedValue({})
})

it('shows the unread count and opens a reminder where it points', async () => {
  renderBell()
  const bell = await screen.findByRole('button', {
    name: 'Notifications, 1 unread',
  })
  fireEvent.click(bell)
  expect(await screen.findByText('Your plan ends tomorrow')).toBeVisible()
  expect(screen.getByText(/Invoice INV-2026-000001/)).toBeVisible()
  fireEvent.click(screen.getByText('Your plan ends tomorrow'))
  await waitFor(() =>
    expect(markNotificationReadApi).toHaveBeenCalledWith('n1')
  )
  expect(push).toHaveBeenCalledWith('/checkout?plan=STANDARD&renew=true')
})

it('never follows a link outside the app', async () => {
  renderBell()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Notifications, 1 unread' })
  )
  fireEvent.click(await screen.findByText('Payment received'))
  expect(push).not.toHaveBeenCalled()
  expect(markNotificationReadApi).not.toHaveBeenCalled()
})

it('marks everything read at once', async () => {
  renderBell()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Notifications, 1 unread' })
  )
  fireEvent.click(
    await screen.findByRole('button', { name: 'Mark all as read' })
  )
  await waitFor(() => expect(markAllNotificationsReadApi).toHaveBeenCalled())
})
