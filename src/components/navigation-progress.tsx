import { useEffect, useState, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

// Lightweight top loading bar to avoid external hook issues
export function NavigationProgress() {
  const state = useRouterState()
  const [progress, setProgress] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    rafRef.current = window.requestAnimationFrame(() => {
      if (state.status === 'pending') {
        // Kick off progress animation
        setProgress(20)
        timeoutRef.current = window.setTimeout(() => setProgress(65), 250)
      } else {
        // Finish and reset
        setProgress(100)
        timeoutRef.current = window.setTimeout(() => setProgress(0), 300)
      }
    })

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [state.status])

  return (
    <div className='fixed top-0 left-0 z-50 h-0.5 w-full bg-transparent'>
      <div
        className='bg-muted-foreground h-full transition-[width,opacity] duration-300 ease-out'
        style={{ width: `${progress}%`, opacity: progress === 0 ? 0 : 1 }}
      />
    </div>
  )
}
