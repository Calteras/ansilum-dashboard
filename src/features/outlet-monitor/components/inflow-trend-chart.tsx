import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactMoney, formatMoney } from '@/lib/format'
import { percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { Delta } from '@/components/data-display/metric'
import type { MonitorHour, OutletMonitor } from '../api/outlet-monitor.types'

const CHART_HEIGHT = 272

interface InflowTrendChartProps {
  hours: MonitorHour[]
  totals: OutletMonitor['totals'] | undefined
  className?: string
}

/** Running total of sales collected through the day, against all of yesterday. */
export function InflowTrendChart({
  hours,
  totals,
  className,
}: InflowTrendChartProps) {
  const copy = useCopy()
  const runningTotal = (index: number, pick: (h: MonitorHour) => number) =>
    hours.slice(0, index + 1).reduce((sum, h) => sum + pick(h), 0)
  const rows = hours.map((h, index) => ({
    label: h.hour.slice(0, 2),
    hour: h.hour,
    // Hours still to come stay empty, so the line stops at now.
    today: h.available ? runningTotal(index, (x) => x.collected ?? 0) : null,
    yesterday: runningTotal(index, (x) => x.previousCollected),
  }))
  const today = runningTotal(hours.length - 1, (x) => x.collected ?? 0)
  const yesterday = runningTotal(hours.length - 1, (x) => x.previousCollected)
  const legend = (
    <ul className='text-fg-secondary flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
      <li className='flex items-center gap-2'>
        <span
          aria-hidden
          className='bg-series-primary h-0.5 w-3.5 rounded-full'
        />
        {copy('Hari ini', 'Today')}
      </li>
      <li className='flex items-center gap-2'>
        <span
          aria-hidden
          className='border-series-neutral h-0 w-3.5 border-t-2 border-dashed'
        />
        {copy('Kemarin', 'Yesterday')}
      </li>
    </ul>
  )

  return (
    <section
      aria-labelledby='inflow-trend-title'
      className={cn('flex min-w-0 flex-col gap-4 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='inflow-trend-title'
        title={copy(
          'Penjualan masuk sepanjang hari',
          'Sales collected through the day'
        )}
        description={
          totals ? (
            <span className='inline-flex flex-wrap items-center gap-x-1'>
              <Delta
                change={percentChange(
                  totals.collected,
                  totals.previousCollected
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
        actions={legend}
      />
      <figure className='m-0'>
        <figcaption className='sr-only'>
          {copy(
            `Penjualan masuk kumulatif per jam. Hari ini ${formatMoney(today)}, kemarin sepanjang hari ${formatMoney(yesterday)}.`,
            `Cumulative sales collected by hour. Today ${formatMoney(today)}, all of yesterday ${formatMoney(yesterday)}.`
          )}
        </figcaption>
        <div style={{ height: CHART_HEIGHT }} className='w-full min-w-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={rows}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
                width={64}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickCount={4}
                tickFormatter={(value: number) => formatCompactMoney(value)}
              />
              <Tooltip
                cursor={{ stroke: 'var(--divider-strong)' }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as (typeof rows)[number]
                  return (
                    <div className='bg-popover text-popover-foreground border-divider-strong min-w-52 rounded-md border px-3 py-2.5 text-xs'>
                      <p className='text-fg-muted mb-1.5'>
                        {copy(`Sampai ${row.hour}`, `Up to ${row.hour}`)}
                      </p>
                      <p className='flex items-baseline gap-1.5 leading-5'>
                        <span
                          aria-hidden
                          className='bg-series-primary h-0.5 w-2.5 self-center rounded-full'
                        />
                        <span className='text-[13px] font-semibold tabular-nums'>
                          {row.today == null ? '—' : formatMoney(row.today)}
                        </span>
                        <span className='text-fg-muted ml-auto pl-4'>
                          {copy('Hari ini', 'Today')}
                        </span>
                      </p>
                      <p className='flex items-baseline gap-1.5 leading-5'>
                        <span
                          aria-hidden
                          className='border-series-neutral w-2.5 self-center border-t-2 border-dashed'
                        />
                        <span className='font-medium tabular-nums'>
                          {formatMoney(row.yesterday)}
                        </span>
                        <span className='text-fg-muted ml-auto pl-4'>
                          {copy('Kemarin', 'Yesterday')}
                        </span>
                      </p>
                      {row.today != null && (
                        <p className='mt-1.5 pl-4'>
                          <Delta
                            change={percentChange(row.today, row.yesterday)}
                            baselineLabel={copy('kemarin', 'yesterday')}
                          />
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Line
                dataKey='yesterday'
                type='monotone'
                stroke='var(--series-neutral)'
                strokeWidth={2}
                strokeDasharray='4 4'
                dot={false}
                activeDot={{
                  r: 3,
                  fill: 'var(--series-neutral)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
              <Line
                dataKey='today'
                type='monotone'
                stroke='var(--series-primary)'
                strokeWidth={2.5}
                strokeLinecap='round'
                dot={false}
                activeDot={{
                  r: 4,
                  fill: 'var(--series-primary)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </section>
  )
}
