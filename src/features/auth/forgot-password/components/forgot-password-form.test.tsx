import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ForgotPasswordForm } from './forgot-password-form'

vi.mock('../../components/turnstile-challenge', () => ({
  TurnstileChallenge: ({ onToken }: { onToken: (value: string) => void }) => (
    <button type='button' onClick={() => onToken('fresh-reset-token')}>
      Complete CAPTCHA
    </button>
  ),
}))
afterEach(() => vi.unstubAllGlobals())
it('requests password reset with CAPTCHA and generic feedback', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
  render(<ForgotPasswordForm />)
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  })
  fireEvent.click(screen.getByText('Complete CAPTCHA'))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByText(/If this account can reset its password/)
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/request-password-reset',
    expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({
        'X-Captcha-Response': 'fresh-reset-token',
      }),
      body: JSON.stringify({ email: 'test@example.com' }),
    })
  )
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
})
