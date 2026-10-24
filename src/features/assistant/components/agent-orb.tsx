import { useEffect, useMemo, useRef, useState } from 'react'
import { ThinkingOrb, type OrbSize, type OrbState } from 'thinking-orbs'
import { morphFrame, MORPH_MS, type OrbMorph } from '../model/orb-morph'

/** Each state stays on screen at least this long, so quick tool calls don't flicker. */
export const HOLD_MS = MORPH_MS + 360

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

interface AgentOrbProps {
  state: OrbState
  size?: OrbSize
  paused?: boolean
  className?: string
}

/**
 * The agent's thinking orb (thinking-orbs). A change of `state` morphs the dots
 * from one animation into the next on the same canvas instead of cutting.
 * Decorative: the status text next to it says what is happening.
 */
export function AgentOrb({
  state,
  size = 64,
  paused,
  className,
}: AgentOrbProps) {
  const [morph, setMorph] = useState<OrbMorph>(() => ({
    from: state,
    to: state,
    startedAt: 0,
  }))
  const shownAt = useRef(0)

  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  useEffect(() => {
    if (state === morph.to) return
    const wait = Math.max(0, shownAt.current + HOLD_MS - performance.now())
    const timer = setTimeout(() => {
      const now = performance.now()
      shownAt.current = now
      setMorph((current) => ({
        from: prefersReducedMotion() ? state : current.to,
        to: state,
        startedAt: now,
      }))
    }, wait)
    return () => clearTimeout(timer)
  }, [state, morph.to])

  const frame = useMemo(() => morphFrame(morph, size), [morph, size])

  return (
    <ThinkingOrb
      state={morph.to}
      size={size}
      frame={frame}
      paused={paused}
      aria-hidden='true'
      data-orb-state={morph.to}
      className={className}
    />
  )
}
