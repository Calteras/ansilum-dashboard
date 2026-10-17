import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCount } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState } from '@/components/data-display/data-states'
import type { AnalyticsPeakHour } from '../api/analytics.types'

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const formatHourSpan = (hour: number) =>
  `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`

interface AnalyticsPeakHoursProps {
  peakHours: AnalyticsPeakHour[]
  isLoading: boolean
  className?: string
}

/** A region of a DataPanel. One series; the busiest hour is the only accented bar. */
export function AnalyticsPeakHours({
  peakHours,
  isLoading,
  className,
}: AnalyticsPeakHoursProps) {
  const copy = useCopy()
  const active = peakHours.filter((h) => h.orderCount > 0)
  const counts = new Map(peakHours.map((h) => [h.hour, h.orderCount]))

  // Trading hours only, gaps filled with zero so the axis stays continuous.
  const first = Math.min(...active.map((h) => h.hour))
  const last = Math.max(...active.map((h) => h.hour))
  const data = active.length
    ? Array.from({ length: last - first + 1 }, (_, i) => ({
        hour: first + i,
        label: formatHour(first + i),
        orders: counts.get(first + i) ?? 0,
      }))
    : []
  const busiest = data.reduce<(typeof data)[number] | null>(
    (best, row) => (!best || row.orders > best.orders ? row : best),
    null
  )

  return (
    <section
      aria-labelledby='busy-hours-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        as='h3'
        id='busy-hours-title'
        title={copy('Jam ramai', 'Busy hours')}
        description={
          busiest
            ? copy(
                `Pesanan per jam · tersibuk ${formatHourSpan(busiest.hour)} (${formatCount(busiest.orders)} pesanan)`,
                `Orders per hour · busiest ${formatHourSpan(busiest.hour)} (${formatCount(busiest.orders)} orders)`
              )
            : copy('Pesanan per jam', 'Orders per hour')
        }
      />

      {isLoading ? (
        <div
          role='status'
          className='bg-surface-hover h-48 w-full animate-pulse rounded'
        >
          <span className='sr-only'>{copy('Memuat…', 'Loading…')}</span>
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title={copy(
            'Belum ada pesanan pada periode ini.',
            'No orders in this period.'
          )}
          className='py-8'
        />
      ) : (
        <div className='h-48 w-full min-w-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke='var(--chart-grid)' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={{ stroke: 'var(--divider-strong)' }}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                width={28}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickCount={4}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-hover)' }}
                isAnimationActive={false}
                content={({ active: isActive, payload }) => {
                  const row = payload?.[0]?.payload as
                    | (typeof data)[number]
                    | undefined
                  if (!isActive || !row) return null
                  return (
                    <div className='bg-popover text-popover-foreground border-divider-strong rounded-md border px-3 py-2 text-xs'>
                      <p className='text-fg-muted'>
                        {formatHourSpan(row.hour)}
                      </p>
                      <p className='mt-0.5 text-[13px] font-semibold tabular-nums'>
                        {formatCount(row.orders)}{' '}
                        <span className='text-fg-muted text-xs font-normal'>
                          {copy('pesanan', 'orders')}
                        </span>
                      </p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey='orders'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell
                    key={row.hour}
                    fill={
                      row.orders === busiest?.orders
                        ? 'var(--series-primary)'
                        : 'var(--series-neutral)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
