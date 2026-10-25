import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { OutletActivity } from '../api/outlet-monitor.types'
import { ACTIVITY_DOT, ACTIVITY_TONE } from '../lib/activity'

export function ActivityBadge({
  activity,
  label,
  className,
}: {
  activity: OutletActivity
  label: string
  className?: string
}) {
  return (
    <Badge
      variant='outline'
      className={cn('gap-1.5 font-medium', ACTIVITY_TONE[activity], className)}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', ACTIVITY_DOT[activity])}
      />
      {label}
    </Badge>
  )
}
