import { useEffect, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { RefreshCw } from '@/components/icons'

interface DataFreshnessProps {
  /** Epoch ms of the last successful fetch (React Query `dataUpdatedAt`). */
  updatedAt: number
  isFetching?: boolean
  onRefresh?: () => void
  /** After this long the timestamp is flagged as possibly out of date. */
  staleAfterMs?: number
  className?: string
}

/** "Updated 2 min ago" with a manual refresh. Re-renders itself every 30 seconds. */
export function DataFreshness({
  updatedAt,
  isFetching,
  onRefresh,
  staleAfterMs = 15 * 60_000,
  className,
}: DataFreshnessProps) {
  const copy = useCopy()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!updatedAt) return null

  const age = Math.max(0, now - updatedAt)
  const minutes = Math.floor(age / 60_000)
  const updated = new Date(updatedAt)
  const isStale = age > staleAfterMs

  let label: string
  if (isFetching) label = copy('Memperbarui…', 'Updating…')
  else if (minutes < 1) label = copy('Diperbarui baru saja', 'Updated just now')
  else if (minutes < 60)
    label = copy(`Diperbarui ${minutes} mnt lalu`, `Updated ${minutes} min ago`)
  else if (isSameDay(updated, now))
    label = copy(
      `Diperbarui pukul ${format(updated, 'HH:mm')}`,
      `Updated at ${format(updated, 'HH:mm')}`
    )
  else
    label = copy(
      `Diperbarui ${format(updated, 'dd MMM, HH:mm')}`,
      `Updated ${format(updated, 'dd MMM, HH:mm')}`
    )

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        title={format(updated, 'dd MMM yyyy, HH:mm:ss')}
        className={cn(isStale && !isFetching && 'text-status-warning')}
      >
        {label}
        {isStale && !isFetching && (
          <span className='sr-only'>
            {copy(', data mungkin sudah usang', ', data may be out of date')}
          </span>
        )}
      </span>
      {onRefresh && (
        <Button
          variant='ghost'
          size='icon'
          className='text-fg-muted hover:text-foreground size-6 rounded'
          onClick={onRefresh}
          disabled={isFetching}
          aria-label={copy('Muat ulang data', 'Refresh data')}
          title={copy('Muat ulang data', 'Refresh data')}
        >
          <RefreshCw
            className={cn('size-3.5', isFetching && 'animate-spin')}
            aria-hidden
          />
        </Button>
      )}
    </span>
  )
}
