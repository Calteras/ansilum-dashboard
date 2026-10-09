import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'

interface TransactionSummary {
  totalTransactions: number
  totalSales: number
  totalDiscount: number
  totalTax: number
  netSales: number
  paymentBreakdown: Record<string, number>
}

export function TransactionStats({ summary, isLoading }: { summary: TransactionSummary | null; isLoading?: boolean }) {
  const { t } = useTranslation()
  const copy = useCopy()
  const average = summary && summary.totalTransactions > 0 ? summary.netSales / summary.totalTransactions : 0
  const stats = [
    { label: t('dashboard.transactionStats.totalSales'), value: summary ? formatMoney(summary.totalSales) : '—', note: copy('Sebelum potongan dan pajak', 'Before discounts and tax') },
    { label: copy('Pesanan', 'Orders'), value: summary ? summary.totalTransactions.toLocaleString() : '—', note: copy('Pada periode yang dipilih', 'In the selected period') },
    { label: t('dashboard.transactionStats.netSales'), value: summary ? formatMoney(summary.netSales) : '—', note: copy('Penjualan bersih pada periode ini', 'Net sales in this period') },
    { label: copy('Rata-rata belanja per pesanan', 'Average spend per order'), value: summary ? formatMoney(average) : '—', note: copy('Penjualan bersih dibagi jumlah pesanan', 'Net sales divided by orders') },
  ]
  return (
    <section aria-label={copy('Ringkasan penjualan', 'Sales summary')} aria-busy={isLoading} className='metric-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map((stat, index) => (
        <div key={stat.label} className='flex flex-col gap-3'>
          <p className='text-muted-foreground text-xs font-semibold'>{stat.label}</p>
          {isLoading ? <div className='bg-muted h-9 w-36 animate-pulse rounded-md' /> : <p className={`break-words text-[26px] leading-tight font-bold tracking-[-0.04em] tabular-nums ${index === 0 ? 'text-brand-ink' : ''}`}>{stat.value}</p>}
          <p className='text-muted-foreground mt-auto text-xs leading-relaxed'>{stat.note}</p>
        </div>
      ))}
    </section>
  )
}
