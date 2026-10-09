import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from './authenticated-layout'

const { state } = vi.hoisted(() => ({ state: { isPending: false } }))
vi.mock('@/features/auth/hooks/use-session-restore', () => ({
  useSessionRestore: () => state,
}))
vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof import('@tanstack/react-router')>()),
  Navigate: ({ to }: { to: string }) => <div>Redirect to {to}</div>,
}))
beforeEach(() => {
  state.isPending = false
  useAuthStore.getState().clearAuth()
})
it('never renders protected content for a visitor without a session', () => {
  render(
    <AuthenticatedLayout>
      <div>Protected content</div>
    </AuthenticatedLayout>
  )
  expect(screen.getByText('Redirect to /sign-in-2')).toBeInTheDocument()
  expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
})
it('waits for backend confirmation before rendering protected content', () => {
  state.isPending = true
  render(
    <AuthenticatedLayout>
      <div>Protected content</div>
    </AuthenticatedLayout>
  )
  expect(screen.getByRole('status')).toHaveAttribute(
    'aria-label',
    'Loading session'
  )
  expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
})
