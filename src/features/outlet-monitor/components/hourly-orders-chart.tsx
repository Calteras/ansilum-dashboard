import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/format'
import { formatCount, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { Delta } from '@/components/data-display/metric'
import type { MonitorHour, OutletMonitor } from '../api/outlet-monitor.types'

const CHART_HEIGHT = 200

interface HourlyOrdersChartProps {
  hours: MonitorHour[]
  totals: OutletMonitor['totals'] | undefined
  className?: string
}

/** Orders per local hour across every outlet, with the day's figures underneath. */
export function HourlyOrdersChart({
  hours,
  totals,
  className,
}: HourlyOrdersChartProps) {
  const copy = useCopy()
  const rows = hours.map((h) => ({
    label: h.hour.slice(0, 2),
    hour: h.hour,
    orders: h.transactions,
    previous: h.previousTransactions,
  }))
  const busiest = hours.reduce<MonitorHour | null>(
    (best, h) => ((h.transactions ?? 0) > (best?.transactions ?? 0) ? h : best),
    null
  )

  return (
    <section
      aria-labelledby='hourly-orders-title'
      className={cn('flex min-w-0 flex-col gap-4 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='hourly-orders-title'
        title={copy('Pesanan per jam', 'Orders by hour')}
        description={
          totals ? (
            <span className='inline-flex flex-wrap items-center gap-x-1'>
              <Delta
                change={percentChange(
                  totals.transactions,
                  totals.previousTransactions
                )}
                baselineLabel={copy(
                  'kemarin di jam yang sama',
                  'this time yesterday'
                )}
              />
              {copy('dibanding kemarin di jam ini', 'than this time yesterday')}
            </span>
          ) : undefined
        }
      />
      <figure className='m-0'>
        <figcaption className='sr-only'>
          {copy('Pesanan per jam hari ini.', 'Orders per hour today.')}{' '}
          {busiest &&
            copy(
              `Tersibuk pukul ${busiest.hour}: ${busiest.transactions} pesanan.`,
              `Busiest at ${busiest.hour}: ${busiest.transactions} orders.`
            )}
        </figcaption>
        <div style={{ height: CHART_HEIGHT }} className='w-full min-w-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={rows}
              margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
              barCategoryGap='20%'
            >
              <CartesianGrid vertical={false} stroke='var(--chart-grid)' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={{ stroke: 'var(--divider-strong)' }}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickMargin={8}
                interval={2}
              />
              <YAxis
                width={28}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickCount={4}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-hover)' }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof rows)[number]
                  return (
                    <div className='bg-popover text-popover-foreground border-divider-strong min-w-44 rounded-md border px-3 py-2.5 text-xs'>
                      <p className='text-fg-muted mb-1.5'>
                        {copy('Pukul', 'At')} {row.hour}
                      </p>
                      <p className='flex items-baseline gap-1.5 leading-5'>
                        <span
                          aria-hidden
                          className='bg-series-primary size-2 self-center rounded-[2px]'
                        />
                        <span className='text-[13px] font-semibold tabular-nums'>
                          {row.orders == null ? '—' : formatCount(row.orders)}
                        </span>
                        <span className='text-fg-muted ml-auto pl-4'>
                          {copy('Hari ini', 'Today')}
                        </span>
                      </p>
                      <p className='flex items-baseline gap-1.5 leading-5'>
                        <span
                          aria-hidden
                          className='bg-series-neutral size-2 self-center rounded-[2px]'
                        />
                        <span className='font-medium tabular-nums'>
                          {formatCount(row.previous)}
                        </span>
                        <span className='text-fg-muted ml-auto pl-4'>
                          {copy('Kemarin', 'Yesterday')}
                        </span>
                      </p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey='orders'
                fill='var(--series-primary)'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <dl className='border-divider grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 sm:grid-cols-4'>
        <FooterStat
          label={copy('Pesanan', 'Orders')}
          value={totals ? formatCount(totals.transactions) : '—'}
        />
        <FooterStat
          label={copy('Rata-rata', 'Avg. order')}
          value={
            totals?.averageOrderValue != null
              ? formatMoney(totals.averageOrderValue)
              : '—'
          }
        />
        <FooterStat
          label={copy('Jam tersibuk', 'Busiest hour')}
          value={busiest ? busiest.hour : '—'}
        />
        <FooterStat
          label={copy('Pesanan terbuka', 'Open orders')}
          value={totals ? formatCount(totals.openOrders) : '—'}
        />
      </dl>
    </section>
  )
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    // Value above label, as in the card footer; the DOM keeps term before value.
    <div className='flex min-w-0 flex-col-reverse'>
      <dt className='text-fg-muted truncate text-xs leading-5'>{label}</dt>
      <dd className='text-base leading-6 font-semibold tabular-nums'>
        {value}
      </dd>
    </div>
  )
}
