'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, startOfWeek, getISOWeek } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  Bar,
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
          const weekStart = startOfWeek(parsed, {
            weekStartsOn: 1,
          })

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
        acc[key] = {
          key,
          label,
          sales: 0,
          count: 0,
        }
      }

      acc[key].sales += Number(tx.grandTotal)
      acc[key].count += 1

      return acc
    },
    {} as Record<
      string,
      {
        key: string
        label: string
        sales: number
        count: number
      }
    >
  )

  return Object.values(grouped)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item) => ({
      name: item.label,
      Sales: item.sales,
      Orders: item.count,
      AOV: item.count > 0 ? item.sales / item.count : 0,
    }))
}

export function SalesTrendChart({
  transactions,
  isLoading,
}: SalesTrendChartProps) {
  const { t } = useTranslation()

  const [timeRange, setTimeRange] = useState<TimeRange>('daily')

  const chartData = useMemo(
    () => groupTransactions(transactions, timeRange),
    [transactions, timeRange]
  )

  const totalSales = chartData.reduce((sum, item) => sum + item.Sales, 0)

  const totalOrders = chartData.reduce((sum, item) => sum + item.Orders, 0)

  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  const averageSalesPerPeriod =
    chartData.length > 0 ? totalSales / chartData.length : 0

  const peak = chartData.reduce(
    (best, item) => (item.Sales > best.Sales ? item : best),
    chartData[0] ?? {
      name: '—',
      Sales: 0,
      Orders: 0,
      AOV: 0,
    }
  )

  const latest =
    chartData.length > 0 ? chartData[chartData.length - 1] : undefined

  const previous =
    chartData.length > 1 ? chartData[chartData.length - 2] : undefined

  const changePercent =
    latest && previous && previous.Sales > 0
      ? ((latest.Sales - previous.Sales) / previous.Sales) * 100
      : null

  const TIME_RANGE_OPTIONS: {
    key: TimeRange
    label: string
  }[] = [
    {
      key: 'daily',
      label: t('dashboard.salesTrendChart.daily'),
    },
    {
      key: 'weekly',
      label: t('dashboard.salesTrendChart.weekly'),
    },
    {
      key: 'monthly',
      label: t('dashboard.salesTrendChart.monthly'),
    },
  ]

  function formatCompact(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} M`
    }

    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`
    }

    return value.toLocaleString('id-ID')
  }

  return (
    <div className='bg-card flex w-full min-w-0 flex-col gap-5 rounded-2xl border p-5 shadow-[0_12px_40px_-32px_var(--brand-ink)] sm:p-6'>
      {/* Header */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
        <div>
          <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
            {t('dashboard.salesTrendChart.title')}
          </p>

          <p className='text-muted-foreground mt-1 text-xs'>
            {peak.name !== '—'
              ? `Peak ${peak.name} · Rp${peak.Sales.toLocaleString('id-ID')}`
              : '—'}
          </p>
        </div>

        {/* Period */}
        <div className='bg-muted/40 flex self-start overflow-hidden rounded-lg border p-0.5'>
          {TIME_RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                timeRange === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
        <Metric label='Revenue' value={`Rp${formatCompact(totalSales)}`} />

        <Metric label='Orders' value={totalOrders.toLocaleString('id-ID')} />

        <Metric
          label='Avg. order'
          value={`Rp${formatCompact(averageOrderValue)}`}
        />

        <Metric
          label='Latest change'
          value={
            changePercent === null
              ? '—'
              : `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
          }
          trend={changePercent}
        />
      </div>

      {/* Legend */}
      <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
        <LegendItem
          color='var(--chart-1)'
          label={t('dashboard.salesTrendChart.legendSales')}
          type='box'
        />

        <LegendItem
          color='var(--chart-2)'
          label={t('dashboard.salesTrendChart.legendOrders')}
          type='line'
        />

        <div className='text-muted-foreground ml-auto hidden text-xs sm:block'>
          Avg revenue Rp
          {formatCompact(averageSalesPerPeriod)}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className='flex h-72 items-center justify-center sm:h-80'>
          <p className='text-muted-foreground text-xs'>
            {t('dashboard.salesTrendChart.loading')}
          </p>
        </div>
      ) : chartData.length === 0 ? (
        <div className='flex h-72 items-center justify-center sm:h-80'>
          <p className='text-muted-foreground text-xs'>
            {t('dashboard.salesTrendChart.noData')}
          </p>
        </div>
      ) : (
        <div className='h-72 min-h-0 w-full min-w-0 sm:h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart
              data={chartData}
              margin={{
                top: 12,
                right: 4,
                bottom: 0,
                left: -12,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray='3 3'
                stroke='var(--border)'
                opacity={0.5}
              />

              <XAxis
                dataKey='name'
                tick={{
                  fontSize: 11,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                stroke='var(--muted-foreground)'
              />

              <YAxis
                yAxisId='sales'
                tick={{
                  fontSize: 11,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                width={55}
                stroke='var(--muted-foreground)'
                tickFormatter={(value: number) => formatCompact(value)}
              />

              <YAxis
                yAxisId='orders'
                orientation='right'
                tick={{
                  fontSize: 11,
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                }}
                tickLine={false}
                axisLine={false}
                width={34}
                allowDecimals={false}
                stroke='var(--muted-foreground)'
              />

              <Tooltip
                cursor={{
                  fill: 'var(--muted)',
                  opacity: 0.25,
                }}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
                  boxShadow: '0 8px 28px rgba(0,0,0,.08)',
                }}
                formatter={(value, name) => {
                  if (name === 'Sales') {
                    return [
                      `Rp${Number(value).toLocaleString('id-ID')}`,
                      t('dashboard.salesTrendChart.tooltipRevenue'),
                    ]
                  }

                  return [
                    Number(value).toLocaleString('id-ID'),
                    t('dashboard.salesTrendChart.tooltipOrders'),
                  ]
                }}
              />

              {/* Average */}
              {averageSalesPerPeriod > 0 && (
                <ReferenceLine
                  yAxisId='sales'
                  y={averageSalesPerPeriod}
                  stroke='var(--muted-foreground)'
                  strokeDasharray='5 5'
                  opacity={0.4}
                />
              )}

              {/* Revenue */}
              <Bar
                isAnimationActive={false}
                yAxisId='sales'
                dataKey='Sales'
                fill='var(--chart-1)'
                radius={[5, 5, 0, 0]}
                maxBarSize={42}
                opacity={0.9}
              />

              {/* Orders */}
              <Line
                isAnimationActive={false}
                yAxisId='orders'
                type='monotone'
                dataKey='Orders'
                stroke='var(--chart-2)'
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'var(--chart-2)',
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 5,
                  strokeWidth: 0,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  trend?: number | null
}

function Metric({ label, value, trend }: MetricProps) {
  const trendClass =
    trend === undefined || trend === null
      ? ''
      : trend > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : trend < 0
          ? 'text-red-500'
          : ''

  return (
    <div className='bg-muted/30 rounded-xl border px-3 py-3'>
      <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-semibold tabular-nums sm:text-base ${trendClass}`}
      >
        {value}
      </p>
    </div>
  )
}

function LegendItem({
  color,
  label,
  type,
}: {
  color: string
  label: string
  type: 'box' | 'line'
}) {
  return (
    <div className='flex items-center gap-1.5'>
      {type === 'box' ? (
        <span
          className='h-2.5 w-2.5 rounded-sm'
          style={{ backgroundColor: color }}
        />
      ) : (
        <span
          className='h-0.5 w-4 rounded-full'
          style={{ backgroundColor: color }}
        />
      )}

      <span className='text-muted-foreground text-[10px] tracking-wide uppercase'>
        {label}
      </span>
    </div>
  )
}
