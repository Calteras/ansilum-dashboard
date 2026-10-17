import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import type { TransactionSummary } from '../../api/dashboard.types'

interface SalesBreakdownProps {
  summary: TransactionSummary | null
  isLoading: boolean
  isStale: boolean
  className?: string
}

/** How total sales become net sales, as a ledger, using the summary's own arithmetic. */
export function SalesBreakdown({
  summary,
  isLoading,
  isStale,
  className,
}: SalesBreakdownProps) {
  const copy = useCopy()

  const lines = summary
    ? [
        {
          label: copy('Total penjualan', 'Total sales'),
          value: formatMoney(summary.totalSales),
        },
        {
          label: copy('Diskon', 'Discounts'),
          value:
            summary.totalDiscount > 0
              ? formatMoney(-summary.totalDiscount)
              : formatMoney(0),
        },
        {
          label: copy('Penjualan bersih', 'Net sales'),
          value: formatMoney(summary.netSales),
          total: true,
        },
        {
          label: copy('Pajak (termasuk di total)', 'Tax (included in total)'),
          value: formatMoney(summary.totalTax),
          note: true,
        },
      ]
    : []

  return (
    <section
      aria-labelledby='sales-breakdown-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        as='h3'
        id='sales-breakdown-title'
        title={copy('Rincian penjualan', 'Sales breakdown')}
      />
      {isLoading ? (
        <div role='status' className='flex flex-col gap-2.5'>
          <span className='sr-only'>{copy('Memuat…', 'Loading…')}</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className='bg-surface-hover h-4 w-full animate-pulse rounded'
            />
          ))}
        </div>
      ) : (
        <dl
          className={cn(
            'flex flex-col text-[13px] tabular-nums transition-opacity',
            isStale && 'opacity-50'
          )}
        >
          {lines.map((line) => (
            <div
              key={line.label}
              className={cn(
                'flex items-baseline justify-between gap-4 py-1.5',
                line.total &&
                  'border-divider mt-1 border-t pt-2.5 font-semibold',
                line.note && 'text-fg-muted'
              )}
            >
              <dt
                className={cn(!line.total && !line.note && 'text-fg-secondary')}
              >
                {line.label}
              </dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
