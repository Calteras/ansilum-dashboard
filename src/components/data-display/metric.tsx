import type { ComponentProps, ReactNode } from 'react'
import {
  deltaTone,
  formatChangeMagnitude,
  type MetricPolarity,
} from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowDown, ArrowUp, Minus } from '@/components/icons'

/**
 * A row of related metrics read as one unit. Each cell draws its right and
 * bottom hairline and overhangs by 1px, so the outer edge is clipped and the
 * dividers stay correct however the grid reflows, even with a short last row.
 * Set columns via className.
 */
export function MetricGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role='group'
      className={cn(
        'grid overflow-hidden *:-me-px *:-mb-px *:min-w-0 *:border-e *:border-b *:border-divider',
        className
      )}
      {...props}
    />
  )
}

interface MetricProps {
  label: string
  value: ReactNode
  /** What the number means, shown on hover or focus of the label. */
  definition?: string
  /** Comparison or supporting line under the value. */
  footer?: ReactNode
  isLoading?: boolean
  /** Dims the value while a refetch for a new scope is in flight. */
  isStale?: boolean
  className?: string
}

export function Metric({
  label,
  value,
  definition,
  footer,
  isLoading,
  isStale,
  className,
}: MetricProps) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-3 py-3 sm:px-5 sm:py-4', className)}
    >
      {definition ? (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className='text-fg-secondary decoration-divider-strong focus-visible:outline-ring w-fit cursor-help text-[13px] leading-5 font-medium underline decoration-dotted underline-offset-4 focus-visible:outline-2'
            >
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent side='top' align='start' className='max-w-60'>
            {definition}
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className='text-fg-secondary text-[13px] leading-5 font-medium'>
          {label}
        </span>
      )}
      {isLoading ? (
        <>
          <span className='bg-surface-hover my-1 h-7 w-32 animate-pulse rounded' />
          <span className='bg-surface-hover h-4 w-24 animate-pulse rounded' />
        </>
      ) : (
        <>
          <span
            className={cn(
              'text-xl leading-8 font-semibold tracking-[-0.02em] break-words transition-opacity sm:text-2xl',
              isStale && 'opacity-50'
            )}
          >
            {value}
          </span>
          {footer && (
            <div
              className={cn(
                'text-fg-muted min-h-5 text-xs leading-5 transition-opacity',
                isStale && 'opacity-50'
              )}
            >
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface DeltaProps {
  /** Ratio, e.g. 0.124 for +12.4%. Null when the baseline is zero or missing. */
  change: number | null
  polarity?: MetricPolarity
  /** The comparison value, already formatted, e.g. "Rp73,800". */
  baseline?: string
  /** Used in the accessible sentence, e.g. "previous period". */
  baselineLabel: string
  className?: string
}

const TONE_CLASS = {
  positive: 'text-status-success',
  negative: 'text-status-danger',
  neutral: 'text-fg-secondary',
} as const

/** Direction is given by arrow and words as well as color. */
export function Delta({
  change,
  polarity = 'increase-is-good',
  baseline,
  baselineLabel,
  className,
}: DeltaProps) {
  const copy = useCopy()
  const tone = deltaTone(change, polarity)
  const Icon =
    change == null
      ? null
      : change === 0
        ? Minus
        : change > 0
          ? ArrowUp
          : ArrowDown
  const magnitude = change == null ? null : formatChangeMagnitude(change)
  const direction =
    change == null
      ? copy('Tidak ada pembanding', 'No baseline')
      : change === 0
        ? copy('Tidak berubah', 'Unchanged')
        : change > 0
          ? copy(`Naik ${magnitude}`, `Up ${magnitude}`)
          : copy(`Turun ${magnitude}`, `Down ${magnitude}`)

  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 tabular-nums',
        className
      )}
    >
      <span className='sr-only'>
        {direction}, {copy('dibanding', 'compared with')} {baselineLabel}
        {baseline ? ` (${baseline})` : ''}
      </span>
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center gap-0.5 font-medium',
          TONE_CLASS[tone]
        )}
      >
        {Icon && <Icon className='size-3' strokeWidth={2.5} />}
        {magnitude ?? '—'}
      </span>
      {baseline && <span aria-hidden>vs {baseline}</span>}
    </span>
  )
}
