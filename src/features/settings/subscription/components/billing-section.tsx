import { cn } from '@/lib/utils'

/** A billing block: title and description on the left, its actions on the right. */
export function BillingSection({
  title,
  description,
  action,
  children,
  className,
  labelledBy,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  labelledBy: string
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn('space-y-4', className)}
    >
      <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-3'>
        <div className='min-w-0 flex-1 space-y-1'>
          <h4 id={labelledBy} className='font-semibold'>
            {title}
          </h4>
          {description && (
            <p className='text-muted-foreground text-sm'>{description}</p>
          )}
        </div>
        {action && <div className='flex shrink-0 gap-2'>{action}</div>}
      </div>
      {children}
    </section>
  )
}

/** One setting inside a section, like Claude's "Auto-reload" row. */
export function BillingRow({
  title,
  description,
  action,
  leading,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  leading?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-3',
        className
      )}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        {leading}
        <div className='min-w-0'>
          <div className='text-sm font-medium'>{title}</div>
          {description && (
            <div className='text-muted-foreground text-sm'>{description}</div>
          )}
        </div>
      </div>
      {action && <div className='flex shrink-0 gap-2'>{action}</div>}
    </div>
  )
}
