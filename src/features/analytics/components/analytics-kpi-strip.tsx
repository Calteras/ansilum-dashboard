import { formatCompactMoney, formatMoney } from '@/lib/format'
import { formatCount, formatPercent } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import type { AnalyticsSummaryKpis } from '../api/analytics.types'

interface AnalyticsKpiStripProps {
  kpis: AnalyticsSummaryKpis | null
  isLoading: boolean
  /** Hide revenue where the page already leads with sales totals; pending orders take its slot. */
  showRevenue?: boolean
  className?: string
}

export function AnalyticsKpiStrip({
  kpis,
  isLoading,
  showRevenue = true,
  className,
}: AnalyticsKpiStripProps) {
  const copy = useCopy()
  const empty = '—'

  const metrics = [
    showRevenue && {
      label: copy('Pendapatan', 'Revenue'),
      value: kpis ? formatMoney(kpis.totalRevenue) : empty,
      footer: kpis
        ? `${formatCount(kpis.totalTransactions)} ${copy('pesanan', 'orders')}`
        : null,
    },
    {
      label: copy('Laba kotor', 'Gross profit'),
      definition: copy(
        'Pendapatan dikurangi HPP.',
        'Revenue minus cost of goods sold.'
      ),
      value: kpis ? formatMoney(kpis.grossProfit) : empty,
      footer: kpis
        ? `${copy('HPP', 'COGS')} ${formatCompactMoney(kpis.totalCOGS)}`
        : null,
    },
    {
      label: copy('Margin laba', 'Profit margin'),
      definition: copy(
        'Laba kotor dibagi pendapatan.',
        'Gross profit divided by revenue.'
      ),
      value: kpis ? formatPercent(kpis.profitMargin / 100) : empty,
    },
    {
      label: copy('Produk terjual', 'Items sold'),
      value: kpis ? formatCount(kpis.itemsSold) : empty,
      footer: kpis
        ? `${copy('dari', 'across')} ${formatCount(kpis.totalTransactions)} ${copy('pesanan', 'orders')}`
        : null,
    },
    {
      label: copy('Pelanggan', 'Customers'),
      definition: copy(
        'Pelanggan unik yang tercatat.',
        'Unique customers on record.'
      ),
      value: kpis ? formatCount(kpis.totalUniqueCustomers) : empty,
      footer: kpis
        ? `${formatCount(kpis.repeatCustomers)} ${copy('kembali', 'returning')}`
        : null,
    },
    {
      label: copy('Tingkat kembali', 'Repeat rate'),
      definition: copy(
        'Porsi pelanggan yang datang lebih dari sekali.',
        'Share of customers who ordered more than once.'
      ),
      value: kpis ? formatPercent(kpis.repeatRate / 100) : empty,
      footer:
        showRevenue && kpis
          ? `${formatCount(kpis.pendingOrders)} ${copy('pesanan menunggu', 'pending orders')}`
          : null,
    },
    !showRevenue && {
      label: copy('Pesanan menunggu', 'Pending orders'),
      definition: copy('Pesanan yang belum selesai.', 'Orders not yet closed.'),
      value: kpis ? formatCount(kpis.pendingOrders) : empty,
    },
  ].filter(Boolean) as {
    label: string
    value: string
    definition?: string
    footer?: string | null
  }[]

  return (
    <MetricGroup
      aria-label={copy('Laba dan pelanggan', 'Profit and customers')}
      aria-busy={isLoading}
      className={cn('grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6', className)}
    >
      {metrics.map((metric) => (
        <Metric
          key={metric.label}
          label={metric.label}
          definition={metric.definition}
          value={metric.value}
          footer={metric.footer}
          isLoading={isLoading}
        />
      ))}
    </MetricGroup>
  )
}
