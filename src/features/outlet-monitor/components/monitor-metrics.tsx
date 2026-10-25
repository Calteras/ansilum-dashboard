import type { ComponentType, ReactNode, SVGProps } from 'react'
import { formatMoney } from '@/lib/format'
import { formatCount, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Delta, Metric, MetricGroup } from '@/components/data-display/metric'
import { ArrowLeftRight, Banknote, Receipt, Store } from '@/components/icons'
import type { OutletMonitor } from '../api/outlet-monitor.types'

interface MonitorMetricsProps {
  totals: OutletMonitor['totals'] | undefined
  outletCount: number
  liveWindowMinutes: number
  isLoading: boolean
  className?: string
}

/** The four headline numbers, two by two, as one group with hairline dividers. */
export function MonitorMetrics({
  totals,
  outletCount,
  liveWindowMinutes,
  isLoading,
  className,
}: MonitorMetricsProps) {
  const copy = useCopy()
  const sameTimeYesterday = copy(
    'kemarin di jam yang sama',
    'this time yesterday'
  )
  return (
    <MetricGroup
      aria-label={copy('Ringkasan semua outlet', 'All-outlet summary')}
      className={cn('grid-cols-1 sm:grid-cols-2', className)}
    >
      <IconMetric
        icon={Banknote}
        label={copy('Penjualan masuk', 'Sales collected')}
        definition={copy(
          'Penjualan selesai hari ini termasuk pajak dan servis, dibanding kemarin sampai jam yang sama.',
          'Closed sales today including tax and service, against yesterday up to the same time.'
        )}
        value={totals ? formatMoney(totals.collected) : '—'}
        footer={
          totals && (
            <Delta
              change={percentChange(totals.collected, totals.previousCollected)}
              baseline={formatMoney(totals.previousCollected)}
              baselineLabel={sameTimeYesterday}
            />
          )
        }
        isLoading={isLoading}
      />
      <IconMetric
        icon={ArrowLeftRight}
        label={copy('Arus kas bersih', 'Net cashflow')}
        definition={copy(
          'Penjualan dan kas masuk laci, dikurangi refund dan kas keluar laci.',
          'Sales and cash put in the drawer, less refunds and cash taken out.'
        )}
        value={totals ? formatMoney(totals.net) : '—'}
        footer={
          totals && (
            <span className='tabular-nums'>
              {copy('Masuk', 'In')} {formatMoney(totals.inflow)} ·{' '}
              {copy('Keluar', 'Out')} {formatMoney(totals.outflow)}
            </span>
          )
        }
        isLoading={isLoading}
      />
      <IconMetric
        icon={Receipt}
        label={copy('Pesanan', 'Orders')}
        value={totals ? formatCount(totals.transactions) : '—'}
        footer={
          totals && (
            <>
              <Delta
                change={percentChange(
                  totals.transactions,
                  totals.previousTransactions
                )}
                baseline={formatCount(totals.previousTransactions)}
                baselineLabel={sameTimeYesterday}
              />
              {totals.openOrders > 0 && (
                <span>
                  {' · '}
                  {formatCount(totals.openOrders)} {copy('terbuka', 'open')}
                </span>
              )}
            </>
          )
        }
        isLoading={isLoading}
      />
      <IconMetric
        icon={Store}
        label={copy('Outlet aktif', 'Active outlets')}
        definition={copy(
          `Outlet dengan penjualan dalam ${liveWindowMinutes} menit terakhir.`,
          `Outlets with a sale in the last ${liveWindowMinutes} minutes.`
        )}
        value={
          totals ? (
            <>
              {formatCount(totals.activity.LIVE)}
              <span className='text-fg-muted text-base font-medium'>
                {' '}
                / {formatCount(outletCount)}
              </span>
            </>
          ) : (
            '—'
          )
        }
        footer={
          totals &&
          copy(
            `${totals.activity.IDLE} sepi · ${totals.activity.OFFLINE} tidak aktif`,
            `${totals.activity.IDLE} quiet · ${totals.activity.OFFLINE} inactive`
          )
        }
        isLoading={isLoading}
      />
    </MetricGroup>
  )
}

/** A Metric with a quiet icon in the corner, so the four read apart at a glance. */
function IconMetric({
  icon: Icon,
  ...props
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
  definition?: string
  footer?: ReactNode
  isLoading: boolean
}) {
  return (
    <div className='relative'>
      <Metric {...props} className='pr-12 sm:pr-14' />
      <span
        aria-hidden
        className='border-divider bg-surface-subtle text-fg-secondary absolute top-3 right-3 flex size-8 items-center justify-center rounded-md border sm:top-4 sm:right-5'
      >
        <Icon className='size-4' />
      </span>
    </div>
  )
}
