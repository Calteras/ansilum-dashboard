import { useEffect, useState } from 'react'

/** The current time, refreshed every [intervalMs] (for countdowns). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

/**
 * A key that changes whenever [value] grows, to restart a CSS animation
 * (e.g. the cart count bumping when something is added). Starts at 0 so the
 * first render does not animate.
 */
export function useBumpKey(value: number) {
  const [previous, setPrevious] = useState(value)
  const [key, setKey] = useState(0)
  if (value !== previous) {
    setPrevious(value)
    if (value > previous) setKey(key + 1)
  }
  return key
}

/** True once the page has scrolled past the top (for a condensing header). */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

/** Animation delay for the nth item of a one-time entrance sequence. */
export const stagger = (index: number, stepMs = 45, startMs = 0) => ({
  animationDelay: `${startMs + Math.min(index, 12) * stepMs}ms`,
})
