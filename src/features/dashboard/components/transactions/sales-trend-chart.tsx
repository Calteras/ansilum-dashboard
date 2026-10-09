'use client'

import { useState } from 'react'
import { format, parseISO, startOfWeek, getISOWeek } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts'

interface Transaction {
  id: string
  transactionDate: string
  grandTotal: string
  status: string
  items: { quantity: number }[]
}

interface SalesTrendChartProps {
  transactions: Transaction[]
  isLoading?: boolean
}

type TimeRange = 'daily' | 'weekly' | 'monthly'

function groupTransactions(transactions: Transaction[], timeRange: TimeRange) {
  const grouped = transactions.reduce(
    (acc, tx) => {
      const parsed = parseISO(tx.transactionDate)
      let key: string
      let label: string

      switch (timeRange) {
        case 'weekly': {
          const weekStart = startOfWeek(parsed, { weekStartsOn: 1 })
          key = format(weekStart, 'yyyy-MM-dd')
          label = `Wk ${getISOWeek(parsed)}`
          break
        }
        case 'monthly': {
          key = format(parsed, 'yyyy-MM')
          label = format(parsed, 'MMM yy')
          break
        }
        default: {
          key = format(parsed, 'yyyy-MM-dd')
          label = format(parsed, 'dd MMM')
          break
        }
      }

      if (!acc[key]) {
        acc[key] = { key, label, sales: 0, count: 0 }
      }
      acc[key].sales += Number(tx.grandTotal)
      acc[key].count += 1
      return acc
    },
    {} as Record<
      string,
      { key: string; label: string; sales: number; count: number }
    >
  )

  return Object.values(grouped)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((d) => ({
      name: d.label,
      Sales: d.sales,
      Orders: d.count,
    }))
}

export function SalesTrendChart({
  transactions,
  isLoading,
}: SalesTrendChartProps) {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<TimeRange>('daily')
  const chartData = groupTransactions(transactions, timeRange)
  const totalSales = chartData.reduce((sum, item) => sum + item.Sales, 0)
  const totalOrders = chartData.reduce((sum, item) => sum + item.Orders, 0)
  const peak = chartData.reduce(
    (best, item) => (item.Sales > best.Sales ? item : best),
    chartData[0] ?? { name: '—', Sales: 0, Orders: 0 }
  )

  const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
    { key: 'daily', label: t('dashboard.salesTrendChart.daily') },
    { key: 'weekly', label: t('dashboard.salesTrendChart.weekly') },
    { key: 'monthly', label: t('dashboard.salesTrendChart.monthly') },
  ]

  return (
    <div className='bg-card flex w-full flex-1 flex-col gap-5 overflow-hidden rounded-2xl border p-5 shadow-[0_12px_40px_-32px_var(--brand-ink)] sm:p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
            {t('dashboard.salesTrendChart.title')}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {totalOrders.toLocaleString()} orders ·{' '}
            {totalSales.toLocaleString('id-ID')} total sales
          </p>
        </div>

        {/* Inline period tabs */}
        <div className='bg-muted/40 flex overflow-hidden rounded border'>
          {TIME_RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-2.5 py-1 font-sans text-xs tabular-nums transition-colors ${
                timeRange === key
                  ? 'bg-brand-ink text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-2.5 w-2.5 rounded-sm'
            style={{ backgroundColor: 'var(--chart-1)' }}
          />
          <span className='text-muted-foreground font-sans text-xs tracking-wide uppercase tabular-nums'>
            {t('dashboard.salesTrendChart.legendSales')}
          </span>
        </div>
        <p className='text-muted-foreground text-xs'>
          {peak.name === '—'
            ? '—'
            : `Peak: ${peak.name} · ${peak.Sales.toLocaleString('id-ID')}`}
        </p>
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-[2px] w-4 rounded-full'
            style={{ backgroundColor: 'var(--chart-2)' }}
          />
          <span className='text-muted-foreground font-sans text-xs tracking-wide uppercase tabular-nums'>
            {t('dashboard.salesTrendChart.legendOrders')}
          </span>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className='flex h-64 items-center justify-center sm:h-80'>
          <p className='text-muted-foreground font-sans text-xs tabular-nums'>
            {t('dashboard.salesTrendChart.loading')}
          </p>
        </div>
      ) : chartData.length === 0 ? (
        <div className='flex h-64 items-center justify-center sm:h-80'>
          <p className='text-muted-foreground font-sans text-xs tabular-nums'>
            {t('dashboard.salesTrendChart.noData')}
          </p>
        </div>
      ) : (
        <div className='h-64 w-full sm:h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='var(--border)'
                opacity={0.6}
              />
              <XAxis
                dataKey='name'
                tick={{
                  fontSize: 12,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                stroke='var(--muted-foreground)'
              />
              <YAxis
                yAxisId='left'
                tick={{
                  fontSize: 12,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                stroke='var(--muted-foreground)'
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(0)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : v.toString()
                }
              />
              <YAxis
                yAxisId='right'
                orientation='right'
                tick={{
                  fontSize: 12,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                stroke='var(--muted-foreground)'
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                  boxShadow: 'none',
                }}
                formatter={(value, name) => {
                  if (name === 'Sales')
                    return [
                      `Rp${Number(value).toLocaleString()}`,
                      t('dashboard.salesTrendChart.tooltipRevenue'),
                    ]
                  return [value, t('dashboard.salesTrendChart.tooltipOrders')]
                }}
                labelStyle={{ marginBottom: 4, opacity: 0.6 }}
              />
              <Area
                isAnimationActive={false}
                yAxisId='left'
                type='monotone'
                dataKey='Sales'
                stroke='var(--chart-1)'
                fill='var(--chart-1)'
                fillOpacity={0.12}
                strokeWidth={2}
              />
              <Bar
                isAnimationActive={false}
                yAxisId='left'
                dataKey='Sales'
                fill='var(--chart-1)'
                radius={[3, 3, 0, 0]}
                opacity={0.9}
                maxBarSize={40}
              />
              {peak.Sales > 0 && (
                <ReferenceLine
                  y={peak.Sales}
                  yAxisId='left'
                  stroke='var(--chart-1)'
                  strokeDasharray='4 4'
                  opacity={0.35}
                />
              )}
              <Line
                isAnimationActive={false}
                yAxisId='right'
                type='monotone'
                dataKey='Orders'
                stroke='var(--chart-2)'
                strokeWidth={1.5}
                dot={{ r: 3, fill: 'var(--chart-2)', strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
