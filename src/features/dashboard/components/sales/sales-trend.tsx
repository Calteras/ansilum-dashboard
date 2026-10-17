import { useMemo, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatSpan, type DateSpan } from '@/lib/date-range'
import { formatCompactMoney, formatMoney } from '@/lib/format'
import { formatCount, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { Delta } from '@/components/data-display/metric'
import { AlertTriangle, Grid3X3 } from '@/components/icons'
import type { Transaction } from '../../api/dashboard.types'
import {
  aggregateSales,
  buildBuckets,
  measureValue,
  summarizeSeries,
  type SalesInterval,
  type SalesMeasure,
  type SalesPoint,
} from '../../utils/sales-analytics'

const CHART_HEIGHT = 280

interface SalesTrendProps {
  span: DateSpan
  comparisonSpan: DateSpan | null
  /** CLOSED orders in `span`. Undefined until the first load completes. */
  transactions: Transaction[] | undefined
  /** Total CLOSED orders reported by the API; more than `transactions.length` means capped. */
  totalOrders: number
  comparisonTransactions: Transaction[] | undefined
  comparisonTotalOrders: number
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
  className?: string
}

interface ChartRow {
  label: string
  current: number | null
  previous: number | null
  point: SalesPoint
  previousPoint: SalesPoint | null
}

export function SalesTrend({
  span,
  comparisonSpan,
  transactions,
  totalOrders,
  comparisonTransactions,
  comparisonTotalOrders,
  isLoading,
  isFetching,
  isError,
  onRetry,
  className,
}: SalesTrendProps) {
  const copy = useCopy()
  const [selectedInterval, setSelectedInterval] =
    useState<SalesInterval>('daily')
  const [measure, setMeasure] = useState<SalesMeasure>('sales')
  const [view, setView] = useState<'chart' | 'table'>('chart')

  // Weekly/monthly only help when they produce at least two buckets.
  const intervalOptions = (['daily', 'weekly', 'monthly'] as const).map(
    (value) => ({
      value,
      label: {
        daily: copy('Harian', 'Daily'),
        weekly: copy('Mingguan', 'Weekly'),
        monthly: copy('Bulanan', 'Monthly'),
      }[value],
      disabled: value !== 'daily' && buildBuckets(span, value).length < 2,
    })
  )
  const interval = intervalOptions.find((o) => o.value === selectedInterval)
    ?.disabled
    ? 'daily'
    : selectedInterval

  const unit = {
    daily: copy('hari', 'day'),
    weekly: copy('minggu', 'week'),
    monthly: copy('bulan', 'month'),
  }[interval]

  const measureLabels: Record<SalesMeasure, string> = {
    sales: copy('Total penjualan', 'Total sales'),
    orders: copy('Pesanan', 'Orders'),
    averageOrder: copy('Rata-rata per pesanan', 'Average order value'),
  }

  const formatValue = (value: number | null, compact = false) => {
    if (value == null) return '—'
    if (measure === 'orders') return formatCount(value)
    return compact ? formatCompactMoney(value) : formatMoney(value)
  }

  const points = useMemo(
    () => (transactions ? aggregateSales(transactions, span, interval) : []),
    [transactions, span, interval]
  )
  const previousPoints = useMemo(
    () =>
      comparisonSpan && comparisonTransactions
        ? aggregateSales(comparisonTransactions, comparisonSpan, interval)
        : null,
    [comparisonTransactions, comparisonSpan, interval]
  )

  const bucketLabel = (point: SalesPoint) =>
    format(point.start, interval === 'monthly' ? 'MMM yyyy' : 'dd MMM')

  const rows: ChartRow[] = points.map((point, index) => {
    const previousPoint = previousPoints?.[index] ?? null
    return {
      label: bucketLabel(point),
      current: measureValue(point, measure),
      previous: previousPoint ? measureValue(previousPoint, measure) : null,
      point,
      previousPoint,
    }
  })

  const summary = summarizeSeries(points, measure)
  const hasComparison = Boolean(comparisonSpan && previousPoints)
  const hasSales = points.some((point) => point.orders > 0)
  const isCapped =
    (transactions && totalOrders > transactions.length) ||
    (comparisonTransactions &&
      comparisonTotalOrders > comparisonTransactions.length)

  const bucketTitle = (point: SalesPoint) =>
    interval === 'daily'
      ? format(point.start, 'EEE, dd MMM yyyy')
      : formatSpan({ from: point.start, to: point.end })

  const description = `${measureLabels[measure]} per ${unit} · ${formatSpan(span)}${
    comparisonSpan ? ` vs ${formatSpan(comparisonSpan)}` : ''
  }`

  const lastCompleteLabel = {
    daily: copy('Hari penuh terakhir', 'Last full day'),
    weekly: copy('Minggu penuh terakhir', 'Last full week'),
    monthly: copy('Bulan penuh terakhir', 'Last full month'),
  }[interval]

  const activeLabel = {
    daily: copy('Hari dengan penjualan', 'Days with sales'),
    weekly: copy('Minggu dengan penjualan', 'Weeks with sales'),
    monthly: copy('Bulan dengan penjualan', 'Months with sales'),
  }[interval]

  let body: ReactNode
  if (isLoading && !transactions) {
    body = (
      <div
        role='status'
        className='text-fg-muted flex items-center justify-center text-[13px]'
        style={{ height: CHART_HEIGHT }}
      >
        {copy('Memuat tren penjualan…', 'Loading sales trend…')}
      </div>
    )
  } else if (isError && !transactions) {
    body = (
      <ErrorState
        title={copy(
          'Tren penjualan gagal dimuat.',
          'Unable to load the sales trend.'
        )}
        description={copy(
          'Periksa koneksi Anda lalu coba lagi.',
          'Check your connection and try again.'
        )}
        onRetry={onRetry}
        isRetrying={isFetching}
        className='min-h-[280px]'
      />
    )
  } else if (!hasSales) {
    body = (
      <EmptyState
        title={copy(
          'Tidak ada penjualan pada periode ini.',
          'No sales in this period.'
        )}
        description={copy(
          'Pesanan yang selesai akan muncul di sini. Coba rentang tanggal yang lebih panjang.',
          'Closed orders will appear here. Try a wider date range.'
        )}
        className='min-h-[280px]'
      />
    )
  } else if (view === 'table') {
    body = (
      <TrendTable
        rows={rows}
        bucketTitle={bucketTitle}
        hasComparison={hasComparison}
        measureLabel={measureLabels[measure]}
        formatValue={formatValue}
      />
    )
  } else {
    body = (
      <figure
        className={cn('m-0 transition-opacity', isFetching && 'opacity-60')}
      >
        <figcaption className='sr-only'>
          {description}.{' '}
          {summary.peak &&
            `${copy('Puncak', 'Peak')} ${bucketTitle(summary.peak.point)}: ${formatValue(summary.peak.value)}.`}{' '}
          {copy(
            'Gunakan tampilan tabel untuk semua nilai.',
            'Use the table view for every value.'
          )}
        </figcaption>
        <div style={{ height: CHART_HEIGHT }} className='w-full min-w-0'>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart
              data={rows}
              margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
              barCategoryGap='24%'
            >
              <CartesianGrid vertical={false} stroke='var(--chart-grid)' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={{ stroke: 'var(--divider-strong)' }}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickMargin={8}
                minTickGap={20}
                interval='preserveStartEnd'
              />
              <YAxis
                width={measure === 'orders' ? 32 : 64}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--fg-muted)', fontSize: 11 }}
                tickCount={4}
                allowDecimals={measure !== 'orders'}
                tickFormatter={(value: number) => formatValue(value, true)}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-hover)' }}
                isAnimationActive={false}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TrendTooltip
                      row={payload[0].payload as ChartRow}
                      measure={measure}
                      bucketTitle={bucketTitle}
                      comparisonLabel={copy(
                        'periode pembanding',
                        'comparison period'
                      )}
                    />
                  ) : null
                }
              />
              <Bar
                dataKey='current'
                name={formatSpan(span)}
                fill='var(--series-primary)'
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
              {hasComparison && (
                <Line
                  dataKey='previous'
                  name={comparisonSpan ? formatSpan(comparisonSpan) : ''}
                  type='linear'
                  stroke='var(--series-neutral)'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: 'var(--series-neutral)',
                    stroke: 'var(--card)',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {hasComparison && comparisonSpan && (
          <ul className='text-fg-secondary mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs'>
            <li className='flex items-center gap-2'>
              <span
                aria-hidden
                className='bg-series-primary size-2.5 rounded-[2px]'
              />
              {formatSpan(span)}
            </li>
            <li className='flex items-center gap-2'>
              <span
                aria-hidden
                className='bg-series-neutral h-0.5 w-3.5 rounded-full'
              />
              {formatSpan(comparisonSpan)}
            </li>
          </ul>
        )}
      </figure>
    )
  }

  return (
    <section
      aria-labelledby='sales-trend-title'
      className={cn('flex min-w-0 flex-col gap-4 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='sales-trend-title'
        title={copy('Tren penjualan', 'Sales trend')}
        description={description}
        actions={
          <>
            <Select
              value={measure}
              onValueChange={(value) => setMeasure(value as SalesMeasure)}
            >
              <SelectTrigger
                size='sm'
                aria-label={copy('Ukuran', 'Measure')}
                className='border-divider-strong h-8 basis-full text-[13px] sm:basis-auto dark:bg-transparent'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align='end'>
                {(Object.keys(measureLabels) as SalesMeasure[]).map((key) => (
                  <SelectItem key={key} value={key} className='text-[13px]'>
                    {measureLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SegmentedControl
              className='flex-1 *:flex-1 sm:flex-none sm:*:flex-none'
              aria-label={copy('Interval', 'Interval')}
              value={interval}
              onValueChange={setSelectedInterval}
              options={intervalOptions}
            />
            <Button
              variant='outline'
              size='icon'
              className='border-divider-strong hover:border-divider-strong aria-pressed:bg-surface-selected size-8'
              aria-pressed={view === 'table'}
              aria-label={copy('Tampilkan sebagai tabel', 'Show as table')}
              title={copy('Tampilkan sebagai tabel', 'Show as table')}
              onClick={() => setView(view === 'table' ? 'chart' : 'table')}
            >
              <Grid3X3 className='size-4' aria-hidden />
            </Button>
          </>
        }
      />

      {hasSales && (
        <dl className='grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4'>
          <InlineStat
            label={
              measure === 'averageOrder'
                ? copy('Rata-rata periode', 'Period average')
                : copy(`Rata-rata per ${unit}`, `Average per ${unit}`)
            }
            value={formatValue(summary.average)}
          />
          <InlineStat
            label={copy('Puncak', 'Peak')}
            value={summary.peak ? formatValue(summary.peak.value) : '—'}
            detail={summary.peak ? bucketLabel(summary.peak.point) : undefined}
          />
          <InlineStat
            label={lastCompleteLabel}
            value={
              summary.lastComplete
                ? formatValue(summary.lastComplete.value)
                : '—'
            }
            detail={
              summary.lastComplete ? (
                <Delta
                  change={summary.lastComplete.change}
                  baselineLabel={copy(`${unit} sebelumnya`, `previous ${unit}`)}
                />
              ) : undefined
            }
          />
          <InlineStat
            label={activeLabel}
            value={`${summary.activeBuckets} ${copy('dari', 'of')} ${summary.totalBuckets}`}
          />
        </dl>
      )}

      <div className='border-divider border-t pt-4'>{body}</div>

      {isCapped && (
        <p className='text-fg-muted flex items-start gap-1.5 text-xs'>
          <AlertTriangle
            className='text-status-warning mt-0.5 size-3.5 shrink-0'
            aria-hidden
          />
          {copy(
            'Data parsial: grafik memakai pesanan terbaru saja, jadi awal periode bisa kurang. Total di atas tetap lengkap.',
            'Partial data: the chart uses the most recent orders only, so the start of the period may be understated. Totals above are complete.'
          )}
        </p>
      )}
    </section>
  )
}

function InlineStat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: ReactNode
}) {
  return (
    <div className='min-w-0'>
      <dt className='text-fg-muted truncate text-xs leading-5'>{label}</dt>
      <dd className='flex flex-wrap items-baseline gap-x-2 text-sm leading-5 font-medium tabular-nums'>
        {value}
        {detail && (
          <span className='text-fg-muted text-xs font-normal'>{detail}</span>
        )}
      </dd>
    </div>
  )
}

function TrendTooltip({
  row,
  measure,
  bucketTitle,
  comparisonLabel,
}: {
  row: ChartRow
  measure: SalesMeasure
  bucketTitle: (point: SalesPoint) => string
  comparisonLabel: string
}) {
  const copy = useCopy()
  const { point, previousPoint } = row
  const average = measureValue(point, 'averageOrder')
  const change = previousPoint
    ? percentChange(
        measureValue(point, measure),
        measureValue(previousPoint, measure)
      )
    : null
  const previousValue = previousPoint
    ? measureValue(previousPoint, measure)
    : null

  return (
    <div className='bg-popover text-popover-foreground border-divider-strong min-w-52 rounded-md border px-3 py-2.5 text-xs'>
      <p className='text-fg-muted mb-1.5'>{bucketTitle(point)}</p>
      <TooltipRow
        value={formatMoney(point.sales)}
        label={copy('Total penjualan', 'Total sales')}
        emphasis={measure === 'sales'}
        keyClass='bg-series-primary'
      />
      <TooltipRow
        value={formatCount(point.orders)}
        label={copy('Pesanan', 'Orders')}
        emphasis={measure === 'orders'}
      />
      <TooltipRow
        value={average == null ? '—' : formatMoney(average)}
        label={copy('Rata-rata per pesanan', 'Average order')}
        emphasis={measure === 'averageOrder'}
      />
      {previousPoint && (
        <div className='border-divider mt-2 border-t pt-2'>
          <p className='text-fg-muted mb-1.5'>{bucketTitle(previousPoint)}</p>
          <TooltipRow
            value={
              previousValue == null
                ? '—'
                : measure === 'orders'
                  ? formatCount(previousValue)
                  : formatMoney(previousValue)
            }
            label={copy('Pembanding', 'Comparison')}
            keyClass='bg-series-neutral'
          />
          <p className='mt-1.5 pl-4'>
            <Delta change={change} baselineLabel={comparisonLabel} />
          </p>
        </div>
      )}
    </div>
  )
}

/** Value first, label second: in a tooltip the reader already knows the series. */
function TooltipRow({
  value,
  label,
  emphasis,
  keyClass = 'bg-transparent',
}: {
  value: string
  label: string
  emphasis?: boolean
  keyClass?: string
}) {
  return (
    <p className='flex items-baseline gap-1.5 leading-5'>
      <span
        aria-hidden
        className={cn(
          'h-0.5 w-2.5 shrink-0 self-center rounded-full',
          keyClass
        )}
      />
      <span
        className={cn(
          'tabular-nums',
          emphasis ? 'text-[13px] font-semibold' : 'font-medium'
        )}
      >
        {value}
      </span>
      <span className='text-fg-muted ml-auto pl-4'>{label}</span>
    </p>
  )
}

function TrendTable({
  rows,
  bucketTitle,
  hasComparison,
  measureLabel,
  formatValue,
}: {
  rows: ChartRow[]
  bucketTitle: (point: SalesPoint) => string
  hasComparison: boolean
  measureLabel: string
  formatValue: (value: number | null) => string
}) {
  const copy = useCopy()
  return (
    <div className='overflow-auto' style={{ maxHeight: CHART_HEIGHT + 40 }}>
      <table className='w-full text-[13px] tabular-nums'>
        <thead className='bg-card text-fg-muted sticky top-0 text-xs'>
          <tr className='border-divider border-b'>
            <th scope='col' className='py-2 pr-4 text-left font-medium'>
              {copy('Periode', 'Period')}
            </th>
            <th scope='col' className='px-4 py-2 text-right font-medium'>
              {copy('Total penjualan', 'Total sales')}
            </th>
            <th scope='col' className='px-4 py-2 text-right font-medium'>
              {copy('Pesanan', 'Orders')}
            </th>
            <th scope='col' className='px-4 py-2 text-right font-medium'>
              {copy('Rata-rata', 'Avg. order')}
            </th>
            {hasComparison && (
              <>
                <th scope='col' className='px-4 py-2 text-right font-medium'>
                  {copy('Pembanding', 'Comparison')} · {measureLabel}
                </th>
                <th scope='col' className='py-2 pl-4 text-right font-medium'>
                  {copy('Perubahan', 'Change')}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const average = measureValue(row.point, 'averageOrder')
            return (
              <tr
                key={row.point.start.toISOString()}
                className='border-divider border-b last:border-0'
              >
                <th
                  scope='row'
                  className='py-2 pr-4 text-left font-normal whitespace-nowrap'
                >
                  {bucketTitle(row.point)}
                </th>
                <td className='px-4 py-2 text-right'>
                  {formatMoney(row.point.sales)}
                </td>
                <td className='px-4 py-2 text-right'>
                  {formatCount(row.point.orders)}
                </td>
                <td className='px-4 py-2 text-right'>
                  {average == null ? '—' : formatMoney(average)}
                </td>
                {hasComparison && (
                  <>
                    <td className='px-4 py-2 text-right'>
                      {formatValue(row.previous)}
                    </td>
                    <td className='py-2 pl-4 text-right'>
                      <Delta
                        change={percentChange(row.current, row.previous)}
                        baselineLabel={copy(
                          'periode pembanding',
                          'comparison period'
                        )}
                      />
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
