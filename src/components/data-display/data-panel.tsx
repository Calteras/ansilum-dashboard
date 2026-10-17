import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Level-1 surface for analytical content. Regions inside a panel are separated
 * with `divider` hairlines, not nested panels.
 */
export function DataPanel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'border-divider bg-card min-w-0 rounded-lg border',
        className
      )}
      {...props}
    />
  )
}

interface SectionHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Heading level within the page outline; the page title is the h1. */
  as?: 'h2' | 'h3'
  id?: string
  className?: string
}

export function SectionHeader({
  title,
  description,
  actions,
  as: Heading = 'h2',
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-3',
        className
      )}
    >
      <div className='min-w-0'>
        <Heading
          id={id}
          className='text-sm leading-5 font-semibold tracking-[-0.01em]'
        >
          {title}
        </Heading>
        {description && (
          <p className='text-fg-muted text-[13px] leading-5'>{description}</p>
        )}
      </div>
      {actions && (
        <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
          {actions}
        </div>
      )}
    </div>
  )
}
