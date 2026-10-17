import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import type { ModifierGroup } from '../api/modifier-groups.types'
import { ModifierGroupsActionDialog } from './modifier-groups-action-dialog'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const group: ModifierGroup = {
  id: 'f6b2dfce-0aa4-4bc5-a5c0-2882515a7336',
  tenantId: 'tenant-1',
  name: 'Coffee extras',
  description: 'Optional extras',
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  modifiers: [
    {
      id: '0256d693-74ed-45a8-abd6-03768a2dc651',
      name: 'Extra shot',
      priceAdjustment: '1000',
      sortOrder: 0,
    },
  ],
}
const fetchMock = vi.fn()
const onOpenChange = vi.fn()
const renderDialog = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <ModifierGroupsActionDialog
        currentRow={group}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>
  )
beforeEach(() => {
  vi.clearAllMocks()
  fetchMock
    .mockReset()
    .mockResolvedValue(new Response(JSON.stringify(group), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  useAuthStore
    .getState()
    .setActiveTenant({
      id: 'tenant-1',
      name: 'Cafe',
      slug: 'cafe',
      isActive: true,
      createdAt: '',
    })
})
afterEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().clearAuth()
})

describe('modifier group edit form', () => {
  it('PATCHes existing option IDs with changed values', async () => {
    renderDialog()
    const interaction = userEvent.setup()
    const modifier = screen.getByPlaceholderText(
      'Modifier name (e.g. Extra Shot)'
    )
    await interaction.clear(modifier)
    await interaction.type(modifier, 'Double shot')
    await interaction.click(
      screen.getByRole('button', { name: 'Save changes' })
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/modifier-groups/${group.id}`)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PATCH',
      headers: expect.objectContaining({ 'x-tenant-id': 'tenant-1' }),
    })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).modifiers).toEqual([
      { ...group.modifiers[0], name: 'Double shot', priceAdjustment: 1000 },
    ])
  })

  it('sends explicit empty values when clearing the description and all options', async () => {
    renderDialog()
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Description'))
    await interaction.click(
      screen.getByRole('button', { name: 'Remove modifier 1' })
    )
    await interaction.click(
      screen.getByRole('button', { name: 'Save changes' })
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      description: '',
      modifiers: [],
    })
  })

  it('keeps invalid selection limits out of the update request', async () => {
    renderDialog()
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Min Selection'))
    await interaction.type(screen.getByLabelText('Min Selection'), '2')
    await interaction.click(
      screen.getByRole('button', { name: 'Save changes' })
    )
    expect(
      await screen.findByText(
        'Maximum selections must be at least the minimum.'
      )
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
