import { useCopy } from '@/hooks/use-copy'
import { formatCompactMoney } from '@/lib/format'
import {
  DollarSign,
  Percent,
  ShoppingBag,
  TrendingUp,
  Users,
  RotateCcw,
} from '@/components/icons'
import type { AnalyticsSummaryKpis } from '../api/analytics.types'

const fmtCurrency = formatCompactMoney

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  bg: string
  isLoading?: boolean
}

function KpiCard({ label, value, sub, icon: Icon, color, bg, isLoading }: KpiCardProps) {
  return (
    <div className='flex flex-col gap-2.5 p-3 sm:p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-xs font-medium sm:text-xs'>
          {label}
        </span>
        <div className={`rounded-md p-1 ${bg}`}>
          <Icon className={`size-3 ${color}`} />
        </div>
      </div>
      {isLoading ? (
        <>
          <div className='bg-muted h-5 w-24 animate-pulse rounded' />
          <div className='bg-muted h-3 w-20 animate-pulse rounded' />
        </>
      ) : (
        <>
          <p className='text-xl leading-tight font-bold tracking-tight tabular-nums'>
            {value}
          </p>
          <p className='text-muted-foreground text-xs font-medium sm:text-xs'>
            {sub}
          </p>
        </>
      )}
    </div>
  )
}

interface AnalyticsKpiStripProps {
  kpis: AnalyticsSummaryKpis | null
  isLoading: boolean
}

export function AnalyticsKpiStrip({ kpis, isLoading }: AnalyticsKpiStripProps) {
  const copy = useCopy()
  const cards: KpiCardProps[] = [
    {
      label: copy('Penjualan', 'Total Revenue'),
      value: kpis ? fmtCurrency(kpis.totalRevenue) : '—',
      sub: kpis ? `${kpis.totalTransactions} ${copy('pesanan', 'orders')}` : '—',
      icon: DollarSign,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: copy('Laba kotor', 'Gross Profit'),
      value: kpis ? fmtCurrency(kpis.grossProfit) : '—',
      sub: kpis ? `COGS ${fmtCurrency(kpis.totalCOGS)}` : '—',
      icon: TrendingUp,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: copy('Margin laba', 'Profit Margin'),
      value: kpis ? `${kpis.profitMargin.toFixed(1)}%` : '—',
      sub: copy('dari total penjualan', 'of total revenue'),
      icon: Percent,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: copy('Produk terjual', 'Items Sold'),
      value: kpis ? kpis.itemsSold.toLocaleString('id-ID') : '—',
      sub: kpis ? `${kpis.totalTransactions} ${copy('pesanan', 'orders')}` : '—',
      icon: ShoppingBag,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: copy('Pelanggan', 'Unique Customers'),
      value: kpis ? kpis.totalUniqueCustomers.toLocaleString('id-ID') : '—',
      sub: kpis ? `${kpis.repeatCustomers} ${copy('kembali', 'returned')}` : '—',
      icon: Users,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      label: copy('Pelanggan kembali', 'Repeat Rate'),
      value: kpis ? `${kpis.repeatRate.toFixed(1)}%` : '—',
      sub: kpis
        ? `${kpis.pendingOrders} ${copy('pesanan menunggu', 'pending orders')}`
        : '—',
      icon: RotateCcw,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  ]

  return (
    <div className='metric-grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'>
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} isLoading={isLoading} />
      ))}
    </div>
  )
}
