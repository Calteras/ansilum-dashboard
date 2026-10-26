import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContextToolbarProps {
  /** Scope controls (outlet, date range, comparison, filters), left-aligned. */
  children: ReactNode
  /** Contextual actions for that scope (export, refresh), right-aligned. */
  actions?: ReactNode
  /** Pin under the app header from `md` up, so the scope stays in view. */
  sticky?: boolean
  'aria-label': string
  className?: string
}

/**
 * The query scope for everything below it. A plain row of 32px controls:
 * no surrounding card. When sticky, a hairline appears only once it is pinned.
 */
export function ContextToolbar({
  children,
  actions,
  sticky = false,
  className,
  ...props
}: ContextToolbarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!sticky || !node) return
    const headerHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--app-header-height'
        )
      ) || 56
    const update = () =>
      setStuck(node.getBoundingClientRect().top <= headerHeight + 0.5)
    update()
    // Capture catches scrolling in any container, not only the window.
    document.addEventListener('scroll', update, {
      passive: true,
      capture: true,
    })
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    }
  }, [sticky])

  return (
    <div
      ref={ref}
      role='toolbar'
      aria-label={props['aria-label']}
      data-stuck={stuck}
      className={cn(
        'flex flex-wrap items-center gap-2',
        sticky &&
          'bg-page md:data-[stuck=true]:border-divider -mx-4 border-b border-transparent px-4 py-2 transition-colors sm:-mx-6 sm:px-6 md:sticky md:top-(--app-header-height) md:z-20',
        className
      )}
    >
      {children}
      {actions && (
        <div className='ml-auto flex items-center gap-2'>{actions}</div>
      )}
    </div>
  )
}
