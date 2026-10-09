import { afterEach, expect, it, vi } from 'vitest'
import { loadTurnstile } from './turnstile'

afterEach(() => {
  vi.useRealTimers()
  delete window.turnstile
})
it('shares script loading, fails on timeout, and allows a subsequent retry', async () => {
  vi.useFakeTimers()
  const first = loadTurnstile()
  expect(loadTurnstile()).toBe(first)
  const caught = first.catch((error: Error) => error.message)
  vi.advanceTimersByTime(15_000)
  expect(await caught).toBe('Security check could not load.')
  expect(document.querySelector('script[src*="turnstile"]')).toBeNull()
  const retry = loadTurnstile()
  window.turnstile = { render: vi.fn(), remove: vi.fn() }
  document
    .querySelector('script[src*="turnstile"]')!
    .dispatchEvent(new Event('load'))
  expect(await retry).toBe(window.turnstile)
  expect(vi.getTimerCount()).toBe(0)
})
