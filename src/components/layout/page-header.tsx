import type { ReactNode } from 'react'

/**
 * Page title, one line of scope or description, and page-level actions.
 * Compact by design: the merchant should reach data within the first screen.
 */
export function PageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string
  /** A short, factual line about what the page contains. */
  description?: ReactNode
  /** Scope and freshness (outlet · range · updated). Replaces the description line. */
  meta?: ReactNode
  actions?: ReactNode
}) {
  const subline = meta ?? description

  return (
    <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
      <div className='min-w-0'>
        <h1 className='text-xl leading-7 font-semibold tracking-[-0.02em]'>
          {title}
        </h1>
        {subline && (
          <div className='text-fg-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-6'>
            {subline}
          </div>
        )}
      </div>
      {actions && (
        <div className='flex flex-wrap items-center gap-2'>{actions}</div>
      )}
    </div>
  )
}
