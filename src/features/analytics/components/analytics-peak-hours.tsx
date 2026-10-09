import { useCopy } from '@/hooks/use-copy'
import { ChartBar } from '@/components/icons'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalyticsPeakHour } from '../api/analytics.types'

function formatHour(hour: number) { return `${String(hour).padStart(2, '0')}:00` }

interface AnalyticsPeakHoursProps {
  peakHours: AnalyticsPeakHour[]
  isLoading: boolean
}

export function AnalyticsPeakHours({
  peakHours,
  isLoading,
}: AnalyticsPeakHoursProps) {
  const copy = useCopy()
  const data = peakHours.map((h) => ({
    hour: formatHour(h.hour),
    orders: h.orderCount,
  }))

  const peakMax = Math.max(...peakHours.map((h) => h.orderCount), 1)

  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-3/10 rounded-md p-1.5'>
          <ChartBar className='text-chart-3 size-4' />
        </div>
        <span className='text-sm font-medium'>{copy('Jam ramai', 'Busy hours')}</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          {copy('pesanan per jam', 'orders per hour')}
        </span>
      </div>

      {isLoading ? (
        <div className='bg-muted h-45 w-full animate-pulse rounded-lg' />
      ) : (
        <div className='h-45 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
            >
              <XAxis
                dataKey='hour'
                tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v) => [v, copy('Pesanan', 'Orders')]}
                labelFormatter={(label) => `${copy('Pukul', 'Hour')}: ${label}`}
              />
              <Bar isAnimationActive={false} dataKey='orders' radius={[3, 3, 0, 0]} maxBarSize={20}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.orders === peakMax
                        ? 'var(--brand)' : 'var(--steel)'
                    }
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className='flex items-center gap-4 text-xs'>
        <div className='flex items-center gap-1.5'>
          <span className='bg-brand inline-block size-2 rounded-full' />
          <span className='text-muted-foreground'>{copy('Paling ramai', 'Busiest')}</span>
        </div>

        <div className='flex items-center gap-1.5'>
          <span className='bg-steel inline-block size-2 rounded-full' />
          <span className='text-muted-foreground'>{copy('Jam lainnya', 'Other hours')}</span>
        </div>
      </div>
    </div>
  )
}
