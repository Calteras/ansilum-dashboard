import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** Never cut a surrogate pair (an emoji) in half. */
function cut(text: string, length: number) {
  const code = text.charCodeAt(length - 1)
  return text.slice(0, code >= 0xd800 && code <= 0xdbff ? length + 1 : length)
}

/**
 * Streamed text revealed at an even pace: the model sends it in bursts, the reader
 * sees it flow. The pace adapts to the backlog so the reveal never falls far
 * behind, and text that is not a continuation of what is shown (the validated
 * answer replacing the draft) appears as is. Off when `animate` is false.
 */
export function useSmoothText(text: string, animate: boolean) {
  const [shown, setShown] = useState(animate ? '' : text)
  const shownRef = useRef(shown)

  useEffect(() => {
    if (!animate) return
    let frame = 0
    const tick = () => {
      const current = shownRef.current
      let next: string
      if (prefersReducedMotion() || !text.startsWith(current)) next = text
      else {
        const backlog = text.length - current.length
        if (backlog <= 0) return
        next = cut(text, current.length + Math.max(2, Math.ceil(backlog / 8)))
      }
      shownRef.current = next
      setShown(next)
      if (next !== text) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, animate])

  return animate ? shown : text
}
