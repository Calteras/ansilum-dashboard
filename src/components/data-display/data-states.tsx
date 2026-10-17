import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from '@/components/icons'

interface StateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: StateProps) {
  return (
    <div
      role='status'
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-4 py-10 text-center',
        className
      )}
    >
      <p className='text-sm font-medium'>{title}</p>
      {description && (
        <p className='text-fg-muted max-w-sm text-[13px] leading-5'>
          {description}
        </p>
      )}
      {action && <div className='mt-3'>{action}</div>}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
  isRetrying,
  className,
}: Omit<StateProps, 'action'> & {
  onRetry?: () => void
  isRetrying?: boolean
}) {
  const copy = useCopy()
  return (
    <div
      role='alert'
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-4 py-10 text-center',
        className
      )}
    >
      <AlertCircle className='text-status-danger mb-1 size-5' aria-hidden />
      <p className='text-sm font-medium'>{title}</p>
      {description && (
        <p className='text-fg-muted max-w-sm text-[13px] leading-5'>
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          variant='outline'
          size='sm'
          className='mt-3 h-8 px-3 text-[13px]'
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw
            className={cn('size-3.5', isRetrying && 'animate-spin')}
            aria-hidden
          />
          {copy('Coba lagi', 'Retry')}
        </Button>
      )}
    </div>
  )
}
