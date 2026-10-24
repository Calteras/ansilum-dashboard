import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AgentOrb, HOLD_MS } from './agent-orb'

beforeEach(() => {
  // jsdom has no 2D canvas; the orb skips painting without one.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const orbState = (container: HTMLElement) =>
  container.querySelector('canvas')?.getAttribute('data-orb-state')

describe('AgentOrb', () => {
  it('holds each state long enough to read before morphing to the next', () => {
    const { container, rerender } = render(<AgentOrb state='breathing' />)
    expect(orbState(container)).toBe('breathing')

    rerender(<AgentOrb state='working' />)
    act(() => vi.advanceTimersByTime(HOLD_MS - 150))
    expect(orbState(container)).toBe('breathing')
    act(() => vi.advanceTimersByTime(300))
    expect(orbState(container)).toBe('working')
  })

  it('skips a state the agent left before it was shown', () => {
    const { container, rerender } = render(<AgentOrb state='breathing' />)
    rerender(<AgentOrb state='working' />)
    act(() => vi.advanceTimersByTime(100))
    rerender(<AgentOrb state='composing' />)
    act(() => vi.advanceTimersByTime(HOLD_MS))
    expect(orbState(container)).toBe('composing')
  })

  it('is decorative: the status text says what is happening', () => {
    const { container } = render(<AgentOrb state='breathing' />)
    expect(container.querySelector('canvas')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })
})
