import { useCallback, useEffect, useRef, useState } from 'react'

/** Within this many pixels of the end counts as reading the latest message. */
const NEAR_END_PX = 72

/**
 * Keeps a scrolling message list pinned to its newest content while the reader is
 * at the end, and lets go as soon as they scroll up to read something earlier.
 */
export function useStickToBottom<
  TScroll extends HTMLElement,
  TContent extends HTMLElement,
>() {
  const scrollRef = useRef<TScroll>(null)
  const contentRef = useRef<TContent>(null)
  const pinned = useRef(true)
  const [atEnd, setAtEnd] = useState(true)

  const scrollToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    pinned.current = true
    setAtEnd(true)
    el.scrollTo?.({ top: el.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el || !content) return
    const onScroll = () => {
      const near =
        el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_END_PX
      pinned.current = near
      setAtEnd(near)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (pinned.current) el.scrollTop = el.scrollHeight
          })
    observer?.observe(content)
    return () => {
      el.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [])

  return { scrollRef, contentRef, atEnd, scrollToEnd }
}
