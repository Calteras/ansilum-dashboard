import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { loadTurnstile, type TurnstileOptions } from '@/lib/turnstile'
import { TurnstileChallenge } from './turnstile-challenge'

vi.mock('@/lib/turnstile', () => ({ loadTurnstile: vi.fn() }))
const remove = vi.fn()
let options: TurnstileOptions
const renderWidget = vi.fn((_container, configuration: TurnstileOptions) => {
  options = configuration
  return 'widget'
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'public-test-key')
  vi.mocked(loadTurnstile).mockResolvedValue({ render: renderWidget, remove })
})
afterEach(() => vi.unstubAllEnvs())
it('fails closed with a missing public key', async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
  const onToken = vi.fn()
  render(<TurnstileChallenge onToken={onToken} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('unavailable')
  expect(onToken).toHaveBeenCalledWith(null)
  expect(loadTurnstile).not.toHaveBeenCalled()
})
it.each(['expired-callback', 'error-callback', 'timeout-callback'] as const)(
  'invalidates a token on %s, retries and cleans up',
  async (callback) => {
    const onToken = vi.fn()
    const view = render(<TurnstileChallenge onToken={onToken} />)
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
    act(() => options.callback('token-one'))
    expect(onToken).toHaveBeenLastCalledWith('token-one')
    act(() => options[callback]())
    expect(onToken).toHaveBeenLastCalledWith(null)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry security check' })
    )
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2))
    act(() => options.callback('token-two'))
    expect(onToken).toHaveBeenLastCalledWith('token-two')
    view.unmount()
    expect(remove).toHaveBeenCalledTimes(2)
    expect(onToken).toHaveBeenLastCalledWith(null)
  }
)
it('recovers from script loading failure', async () => {
  vi.mocked(loadTurnstile).mockRejectedValueOnce(new Error('offline'))
  render(<TurnstileChallenge onToken={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('could not load')
  fireEvent.click(screen.getByRole('button', { name: 'Retry security check' }))
  await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
})
