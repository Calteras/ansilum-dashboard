import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from '@/components/icons'
import type { CustomerStatus, PointsLedgerType } from '../api/loyalty.types'
import {
  customerStatusLabel,
  ledgerTypeLabel,
  rewardStateLabel,
  type RewardState,
} from '../lib/loyalty'

const CUSTOMER_TONE: Record<CustomerStatus, string> = {
  active: STATUS_TONE.success,
  inactive: STATUS_TONE.neutral,
  banned: STATUS_TONE.danger,
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const copy = useCopy()
  return (
    <Badge variant='outline' className={CUSTOMER_TONE[status]}>
      {customerStatusLabel(status, copy)}
    </Badge>
  )
}

const REWARD_TONE: Record<RewardState, string> = {
  active: STATUS_TONE.success,
  expiring: STATUS_TONE.warning,
  expired: STATUS_TONE.neutral,
  usedUp: STATUS_TONE.neutral,
  inactive: STATUS_TONE.neutral,
}

export function RewardStateBadge({ state }: { state: RewardState }) {
  const copy = useCopy()
  return (
    <Badge variant='outline' className={REWARD_TONE[state]}>
      {rewardStateLabel(state, copy)}
    </Badge>
  )
}

const LEDGER_TONE: Record<PointsLedgerType, string> = {
  EARN: STATUS_TONE.success,
  REDEEM: STATUS_TONE.info,
  EXPIRE: STATUS_TONE.neutral,
  ADJUST_IN: STATUS_TONE.warning,
  ADJUST_OUT: STATUS_TONE.warning,
}

export function LedgerTypeBadge({ type }: { type: PointsLedgerType }) {
  const copy = useCopy()
  return (
    <Badge variant='outline' className={LEDGER_TONE[type]}>
      {ledgerTypeLabel(type, copy)}
    </Badge>
  )
}

const PAGE_SIZES = [10, 20, 50]

/** Footer for server-paged lists: range, page size and previous/next. */
export function ListPager({
  total,
  limit,
  offset,
  onChange,
  pageSizes = PAGE_SIZES,
  className,
}: {
  total: number
  limit: number
  offset: number
  onChange: (next: { limit: number; offset: number }) => void
  pageSizes?: number[]
  className?: string
}) {
  const copy = useCopy()
  if (total === 0) return null
  const from = offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div
      className={cn(
        'text-fg-secondary flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]',
        className
      )}
    >
      <span className='tabular-nums'>
        {copy(`${from}–${to} dari ${total}`, `${from}–${to} of ${total}`)}
      </span>
      <div className='flex items-center gap-2'>
        <Select
          value={String(limit)}
          onValueChange={(value) =>
            onChange({ limit: Number(value), offset: 0 })
          }
        >
          <SelectTrigger
            size='sm'
            className='w-[72px]'
            aria-label={copy('Baris per halaman', 'Rows per page')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent side='top'>
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='icon'
          className='size-8'
          disabled={offset === 0}
          onClick={() =>
            onChange({ limit, offset: Math.max(0, offset - limit) })
          }
          aria-label={copy('Halaman sebelumnya', 'Previous page')}
        >
          <ChevronLeft className='size-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='size-8'
          disabled={to >= total}
          onClick={() => onChange({ limit, offset: offset + limit })}
          aria-label={copy('Halaman berikutnya', 'Next page')}
        >
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  )
}
