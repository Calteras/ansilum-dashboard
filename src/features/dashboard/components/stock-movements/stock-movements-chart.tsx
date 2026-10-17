import { format, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
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

export function StockMovementsChart({
  movements,
  className,
}: {
  movements: { movementDate: string }[]
  className?: string
}) {
  const copy = useCopy()
  const counts = new Map<string, number>()
  movements.forEach((item) => {
    const date = parseISO(item.movementDate)
    if (Number.isNaN(date.getTime())) return
    const day = format(date, 'yyyy-MM-dd')
    counts.set(day, (counts.get(day) ?? 0) + 1)
  })
  const data = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: parseISO(date),
      label: format(parseISO(date), 'dd MMM'),
      count,
    }))

  return (
    <section
      aria-labelledby='stock-activity-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='stock-activity-title'
        title={copy('Aktivitas stok', 'Stock activity')}
        description={copy('Jumlah catatan per hari', 'Entries per day')}
      />
      {data.length === 0 ? (
        <EmptyState
          title={copy('Belum ada catatan stok.', 'No stock entries yet.')}
          className='min-h-60'
        />
      ) : (
        <div className='h-60 w-full min-w-0'>
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
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickCount={4}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-hover)' }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as
                    | (typeof data)[number]
                    | undefined
                  if (!active || !row) return null
                  return (
                    <div className='bg-popover text-popover-foreground border-divider-strong rounded-md border px-3 py-2 text-xs'>
                      <p className='text-fg-muted'>
                        {format(row.date, 'EEE, dd MMM yyyy')}
                      </p>
                      <p className='mt-0.5 text-[13px] font-semibold tabular-nums'>
                        {formatCount(row.count)}{' '}
                        <span className='text-fg-muted text-xs font-normal'>
                          {copy('catatan', 'entries')}
                        </span>
                      </p>
                    </div>
                  )
                }}
              />
              <Bar
                isAnimationActive={false}
                dataKey='count'
                fill='var(--series-primary)'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
