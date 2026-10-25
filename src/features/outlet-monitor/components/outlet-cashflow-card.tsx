import { format, isToday } from 'date-fns'
import { formatMoney } from '@/lib/format'
import { formatCount, formatPercent, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Delta } from '@/components/data-display/metric'
import { usePaymentMethodLabel } from '@/features/dashboard/components/sales/use-payment-method-label'
import type { MonitorOutlet } from '../api/outlet-monitor.types'
import { useActivityCopy } from '../lib/activity'
import type { OutletLocation } from '../lib/geo'
import { ActivityBadge } from './activity'

interface OutletCashflowCardProps {
  outlet: MonitorOutlet
  location: OutletLocation | null
  liveWindowMinutes: number
  /** Index of the hour that is still running, to mark it in the sparkline. */
  currentHour: number
}

/** Today's money in and out of one outlet: the map's hover card. */
export function OutletCashflowCard({
  outlet,
  location,
  liveWindowMinutes,
  currentHour,
}: OutletCashflowCardProps) {
  const copy = useCopy()
  const activityCopy = useActivityCopy(liveWindowMinutes)
  const paymentLabel = usePaymentMethodLabel()
  const activity = activityCopy(outlet.activity)
  const paid = outlet.payments.reduce((sum, p) => sum + p.amount, 0)
  // Sales whose payment lines are missing (older POS versions) still count as collected.
  const unrecorded = Math.round(outlet.collected - paid)
  const payments = [
    ...outlet.payments.map((p) => ({ ...p, label: paymentLabel(p.method) })),
    ...(unrecorded > 0
      ? [
          {
            method: 'UNRECORDED',
            amount: unrecorded,
            label: copy('Tanpa rincian', 'Not itemised'),
          },
        ]
      : []),
  ]
  const peak = Math.max(...outlet.hourly, 0)
  const time = (iso: string) =>
    format(new Date(iso), isToday(new Date(iso)) ? 'HH:mm' : 'dd MMM, HH:mm')

  return (
    <div className='flex w-72 flex-col gap-3 text-xs'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-[13px] leading-5 font-semibold'>
            {outlet.name}
          </p>
          <p className='text-fg-muted truncate leading-4'>
            {location
              ? location.precision === 'approximate'
                ? copy(
                    `${location.region} · perkiraan dari alamat`,
                    `${location.region} · estimated from address`
                  )
                : location.region
              : copy('Lokasi belum diatur', 'No location set')}
          </p>
        </div>
        <ActivityBadge activity={outlet.activity} label={activity.label} />
      </div>

      <div>
        <p className='text-fg-muted leading-4'>
          {copy('Arus kas bersih hari ini', 'Net cashflow today')}
        </p>
        <p className='text-lg leading-7 font-semibold tracking-[-0.02em] tabular-nums'>
          {formatMoney(outlet.net)}
        </p>
        <p className='text-fg-muted leading-4'>
          {copy('Penjualan', 'Sales')}{' '}
          <Delta
            change={percentChange(outlet.collected, outlet.previousCollected)}
            baseline={formatMoney(outlet.previousCollected)}
            baselineLabel={copy(
              'penjualan kemarin di jam yang sama',
              'sales by this time yesterday'
            )}
          />{' '}
          <span aria-hidden>
            {copy('kemarin di jam ini', 'by this time yesterday')}
          </span>
        </p>
      </div>

      <dl className='border-divider grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t pt-2.5 tabular-nums'>
        <FlowRow label={copy('Masuk', 'In')} value={outlet.inflow} strong />
        <FlowRow
          label={copy('Penjualan', 'Sales collected')}
          value={outlet.collected}
        />
        {outlet.cashIn > 0 && (
          <FlowRow label={copy('Kas masuk', 'Cash in')} value={outlet.cashIn} />
        )}
        <FlowRow
          label={copy('Keluar', 'Out')}
          value={-outlet.outflow}
          strong
          className='mt-1'
        />
        {outlet.refunded > 0 && (
          <FlowRow label={copy('Refund', 'Refunds')} value={-outlet.refunded} />
        )}
        {outlet.cashOut > 0 && (
          <FlowRow
            label={copy('Kas keluar', 'Cash out')}
            value={-outlet.cashOut}
          />
        )}
        {outlet.outflow === 0 && (
          <dd className='text-fg-muted col-span-2 pl-3'>
            {copy('Belum ada uang keluar', 'Nothing paid out yet')}
          </dd>
        )}
      </dl>

      {payments.length > 0 && (
        <div className='border-divider border-t pt-2.5'>
          <p className='text-fg-muted mb-1.5 leading-4'>
            {copy('Metode pembayaran', 'Payment methods')}
          </p>
          <ul className='flex flex-col gap-1.5'>
            {payments.map((p) => {
              const share =
                outlet.collected > 0 ? p.amount / outlet.collected : 0
              return (
                <li key={p.method} className='flex flex-col gap-1'>
                  <span className='flex items-baseline gap-2 leading-4'>
                    <span className='truncate'>{p.label}</span>
                    <span className='text-fg-muted ml-auto tabular-nums'>
                      {formatPercent(share)}
                    </span>
                    <span className='w-24 text-right font-medium tabular-nums'>
                      {formatMoney(p.amount)}
                    </span>
                  </span>
                  <span className='bg-surface-selected h-1 overflow-hidden rounded-full'>
                    <span
                      className='bg-series-primary block h-full rounded-full'
                      style={{ width: `${Math.min(100, share * 100)}%` }}
                    />
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className='border-divider border-t pt-2.5'>
        <p className='text-fg-muted mb-1.5 flex justify-between leading-4'>
          <span>{copy('Penjualan per jam', 'Sales by hour')}</span>
          {peak > 0 && (
            <span className='tabular-nums'>
              {copy('puncak', 'peak')} {formatMoney(peak)}
            </span>
          )}
        </p>
        <div aria-hidden className='flex h-8 items-end gap-px'>
          {outlet.hourly.map((value, hour) => (
            <span
              key={hour}
              className={cn(
                'min-h-px flex-1 rounded-t-[1px]',
                hour > currentHour
                  ? 'bg-transparent'
                  : value > 0
                    ? 'bg-series-primary'
                    : 'bg-surface-selected'
              )}
              style={{
                height: peak > 0 && value > 0 ? `${(value / peak) * 100}%` : 1,
              }}
            />
          ))}
        </div>
        <p
          aria-hidden
          className='text-fg-muted mt-1 flex justify-between text-[11px] tabular-nums'
        >
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </p>
      </div>

      <p className='text-fg-secondary border-divider border-t pt-2.5 leading-5'>
        {formatCount(outlet.transactions)} {copy('pesanan', 'orders')}
        {outlet.averageOrderValue != null && (
          <>
            {' · '}
            {copy('rata-rata', 'avg.')} {formatMoney(outlet.averageOrderValue)}
          </>
        )}
        {outlet.openOrders > 0 && (
          <>
            {' · '}
            {formatCount(outlet.openOrders)} {copy('terbuka', 'open')}
          </>
        )}
        <br />
        <span className='text-fg-muted'>
          {outlet.lastSaleAt
            ? copy(
                `Penjualan terakhir ${time(outlet.lastSaleAt)}`,
                `Last sale ${time(outlet.lastSaleAt)}`
              )
            : copy('Belum ada penjualan hari ini', 'No sales yet today')}
          {outlet.openShift && (
            <>
              {' · '}
              {copy(
                `Shift sejak ${time(outlet.openShift.since)} (${outlet.openShift.employeeName})`,
                `Shift open since ${time(outlet.openShift.since)} (${outlet.openShift.employeeName})`
              )}
            </>
          )}
        </span>
      </p>
    </div>
  )
}

function FlowRow({
  label,
  value,
  strong,
  className,
}: {
  label: string
  value: number
  strong?: boolean
  className?: string
}) {
  return (
    <>
      <dt
        className={cn(
          strong ? 'text-foreground font-medium' : 'text-fg-muted pl-3',
          className
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'text-right',
          strong ? 'font-medium' : 'text-fg-secondary',
          className
        )}
      >
        {formatMoney(value)}
      </dd>
    </>
  )
}
