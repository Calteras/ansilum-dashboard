import { formatMoney } from '@/lib/format'
import { formatCount, percentChange } from '@/lib/metrics'
import { useCopy } from '@/hooks/use-copy'
import { Delta, Metric, MetricGroup } from '@/components/data-display/metric'
import type { TransactionSummary } from '../../api/dashboard.types'

interface SalesMetricsProps {
  summary: TransactionSummary | null
  /** Summary for the comparison range; undefined while loading or when comparison is off. */
  previous: TransactionSummary | null | undefined
  /** e.g. "previous period"; null when comparison is off. */
  comparisonLabel: string | null
  isLoading: boolean
  isStale: boolean
  className?: string
}

const averageOrder = (summary: TransactionSummary) =>
  summary.totalTransactions > 0
    ? summary.netSales / summary.totalTransactions
    : 0

export function SalesMetrics({
  summary,
  previous,
  comparisonLabel,
  isLoading,
  isStale,
  className,
}: SalesMetricsProps) {
  const copy = useCopy()

  const metrics = [
    {
      key: 'totalSales',
      label: copy('Total penjualan', 'Total sales'),
      definition: copy(
        'Total akhir pesanan selesai, setelah diskon, termasuk pajak dan biaya layanan.',
        'Grand total of closed orders, after discounts, including tax and service charge.'
      ),
      read: (s: TransactionSummary) => s.totalSales,
      format: formatMoney,
    },
    {
      key: 'orders',
      label: copy('Pesanan', 'Orders'),
      definition: copy(
        'Jumlah pesanan selesai pada periode ini.',
        'Closed orders in the selected period.'
      ),
      read: (s: TransactionSummary) => s.totalTransactions,
      format: (value: number) => formatCount(value),
    },
    {
      key: 'netSales',
      label: copy('Penjualan bersih', 'Net sales'),
      definition: copy(
        'Total penjualan dikurangi diskon.',
        'Total sales minus discounts.'
      ),
      read: (s: TransactionSummary) => s.netSales,
      format: formatMoney,
    },
    {
      key: 'averageOrder',
      label: copy('Rata-rata per pesanan', 'Average order value'),
      definition: copy(
        'Penjualan bersih dibagi jumlah pesanan.',
        'Net sales divided by orders.'
      ),
      read: averageOrder,
      format: formatMoney,
    },
  ]

  return (
    <MetricGroup
      aria-label={copy('Ringkasan penjualan', 'Sales summary')}
      aria-busy={isLoading}
      className={className}
    >
      {metrics.map((metric) => {
        const current = summary ? metric.read(summary) : null
        const baseline = previous ? metric.read(previous) : null

        let footer = null
        if (comparisonLabel) {
          footer =
            previous === undefined ? (
              <span className='bg-surface-hover inline-block h-3 w-24 animate-pulse rounded align-middle' />
            ) : (
              <Delta
                change={percentChange(current, baseline)}
                baseline={
                  baseline == null ? undefined : metric.format(baseline)
                }
                baselineLabel={comparisonLabel}
              />
            )
        }

        return (
          <Metric
            key={metric.key}
            label={metric.label}
            definition={metric.definition}
            value={current == null ? '—' : metric.format(current)}
            footer={footer}
            isLoading={isLoading}
            isStale={isStale}
          />
        )
      })}
    </MetricGroup>
  )
}
