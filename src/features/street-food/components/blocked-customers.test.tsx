import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listBlocksApi, unblockApi } from '../street-food.api'
import { BlockedCustomers } from './blocked-customers'

vi.mock('../street-food.api')

function setup(canEdit = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return {
    user: userEvent.setup(),
    ...render(<BlockedCustomers tenantId='tenant-1' canEdit={canEdit} />, {
      wrapper,
    }),
  }
}

beforeEach(() => {
  vi.mocked(listBlocksApi).mockReset().mockResolvedValue([])
  vi.mocked(unblockApi)
    .mockReset()
    .mockResolvedValue(undefined as never)
})

describe('the customers a business does not serve', () => {
  it('shows nothing at all when there are none', async () => {
    const { container } = setup()

    await waitFor(() => expect(listBlocksApi).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('lists them by the name they ordered with', async () => {
    vi.mocked(listBlocksApi).mockResolvedValue([
      { id: 'b1', customerName: 'Rina', createdAt: '2026-11-28T09:00:00Z' },
    ])
    setup()

    expect(await screen.findByText('Rina')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Customers you do not serve' })
    ).toBeInTheDocument()
  })

  it('lets the owner serve one again', async () => {
    vi.mocked(listBlocksApi).mockResolvedValue([
      { id: 'b1', customerName: 'Rina', createdAt: '2026-11-28T09:00:00Z' },
    ])
    const { user } = setup()

    await user.click(await screen.findByRole('button', { name: 'Serve again' }))

    await waitFor(() => expect(unblockApi).toHaveBeenCalledWith('b1'))
  })

  it('does not even ask for the list when the person cannot manage it', async () => {
    setup(false)

    await new Promise((r) => setTimeout(r, 50))
    expect(listBlocksApi).not.toHaveBeenCalled()
  })
})
