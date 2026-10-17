import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/features/auth/api/auth.types'
import { ProfileForm } from './profile-form'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const user: User = {
  id: 'user-1',
  name: 'Ayu Putri',
  email: 'ayu@terrapos.test',
  emailVerified: true,
  image: 'https://cdn.test/ayu.webp',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
const session = {
  id: 'session-1',
  userId: user.id,
  token: '',
  expiresAt: '2027-01-01T00:00:00Z',
}
const fetchMock = vi.fn()
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })
const renderForm = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            mutations: { retry: false },
            queries: { retry: false },
          },
        })
      }
    >
      <ProfileForm />
    </QueryClientProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  useAuthStore.getState().clearAuth()
  useAuthStore.getState().setAuth(user, session)
})
afterEach(() => {
  vi.unstubAllGlobals()
  useAuthStore.getState().clearAuth()
})

describe('account profile', () => {
  it('shows the actual name, read-only email and verification state without demo fields', async () => {
    renderForm()
    expect(screen.getByLabelText('Full name')).toHaveValue(user.name)
    expect(screen.getByLabelText('Email')).toHaveValue(user.email)
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument()
    expect(screen.queryByText('Add URL')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Update profile' })
    ).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('persists the name through the account API and refreshes shared user data', async () => {
    const updatedUser = { ...user, name: 'Ayu Pratama' }
    fetchMock
      .mockResolvedValueOnce(response({ status: true }))
      .mockResolvedValueOnce(response({ user: updatedUser, session }))
    renderForm()
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Full name'))
    await interaction.type(
      screen.getByLabelText('Full name'),
      '  Ayu Pratama  '
    )
    await interaction.click(
      screen.getByRole('button', { name: 'Update profile' })
    )
    await waitFor(() =>
      expect(useAuthStore.getState().user).toEqual(updatedUser)
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/auth/update-user',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name: updatedUser.name }),
      })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/auth/get-session?disableCookieCache=true',
      expect.objectContaining({ cache: 'no-store', credentials: 'include' })
    )
    expect(screen.getByLabelText('Full name')).toHaveValue(updatedUser.name)
    expect(
      screen.getByRole('button', { name: 'Update profile' })
    ).toBeDisabled()
    expect(toast.success).toHaveBeenCalledWith('Profile updated')
  })

  it('retains the draft and original user data when saving fails', async () => {
    fetchMock.mockResolvedValue(
      response({ message: 'Private server error' }, 500)
    )
    renderForm()
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Full name'))
    await interaction.type(screen.getByLabelText('Full name'), 'Draft name')
    await interaction.click(
      screen.getByRole('button', { name: 'Update profile' })
    )
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(useAuthStore.getState().user).toEqual(user)
    expect(screen.getByLabelText('Full name')).toHaveValue('Draft name')
    expect(screen.getByRole('button', { name: 'Update profile' })).toBeEnabled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects whitespace-only names', async () => {
    renderForm()
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Full name'))
    await interaction.type(screen.getByLabelText('Full name'), '   ')
    expect(
      await screen.findByText('Please enter your name.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Update profile' })
    ).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('populates a session that arrives later and does not discard edits after a photo update', async () => {
    useAuthStore.getState().clearAuth()
    renderForm()
    expect(screen.getByRole('status')).toHaveTextContent('Loading profile...')
    act(() => useAuthStore.getState().setAuth(user, session))
    expect(await screen.findByLabelText('Full name')).toHaveValue(user.name)
    const interaction = userEvent.setup()
    await interaction.clear(screen.getByLabelText('Full name'))
    await interaction.type(screen.getByLabelText('Full name'), 'Unsaved name')
    act(() =>
      useAuthStore
        .getState()
        .setUser({ ...user, image: 'https://cdn.test/new.webp' })
    )
    expect(screen.getByLabelText('Full name')).toHaveValue('Unsaved name')
  })
})
