import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState } from '@/components/data-display/data-states'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import { useOutletsQuery } from '@/features/outlets/api/outlets.queries'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { useAllOutletsDashboardQueries } from '../api/ingredients.queries'
import type { LowStockItem, StockValueItem } from '../api/ingredients.types'

// ── Formatting ────────────────────────────────────────────────────────────

function fmtCompact(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function fmtFull(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── Outlet health card ────────────────────────────────────────────────────

type OutletHealth = 'critical' | 'warning' | 'healthy'

function getOutletHealth(
  criticalCount: number,
  lowCount: number,
  total: number
): OutletHealth {
  if (criticalCount > 0) return 'critical'
  if (total > 0 && lowCount / total > 0.25) return 'warning'
  return 'healthy'
}

const HEALTH: Record<OutletHealth, { label: string; tone: string }> = {
  critical: { label: 'Critical', tone: STATUS_TONE.danger },
  warning: { label: 'Warning', tone: STATUS_TONE.warning },
  healthy: { label: 'Healthy', tone: STATUS_TONE.success },
}

// ── Custom tooltip for BarChart ───────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className='bg-popover text-popover-foreground border-divider-strong rounded-md border px-3 py-2 text-xs'>
      <p className='text-fg-muted'>{label}</p>
      <p className='mt-0.5 text-[13px] font-semibold tabular-nums'>
        {fmtFull(payload[0].value)}
      </p>
    </div>
  )
}

// ── Critical alerts table ─────────────────────────────────────────────────

interface AlertRow extends LowStockItem {
  outletName: string
}

function CriticalAlertsList({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        title='No stock alerts.'
        description='Every ingredient is above its minimum in all outlets.'
        className='py-8'
      />
    )
  }

  return (
    <div className='divide-divider divide-y'>
      {alerts.map((alert) => {
        const qty = parseFloat(alert.quantityOnHand)
        const isNegative = qty < 0
        return (
          <div
            key={alert.id}
            className='flex items-center gap-3 py-2.5 text-[13px]'
          >
            {/* Status dot */}
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${
                isNegative ? 'bg-status-danger' : 'bg-status-warning'
              }`}
            />

            {/* Ingredient info */}
            <div className='min-w-0 flex-1'>
              <div className='text-foreground truncate font-medium'>
                {alert.name}
              </div>
              <div className='text-fg-muted flex items-center gap-1.5 text-xs'>
                <span className='font-sans tabular-nums'>{alert.code}</span>
                <span>·</span>
                <span>{alert.outletName}</span>
              </div>
            </div>

            {/* Quantity */}
            <div
              className={`shrink-0 text-right tabular-nums ${
                isNegative
                  ? 'text-status-danger font-semibold'
                  : 'text-status-warning'
              }`}
            >
              {qty.toLocaleString('id-ID')} {alert.unit}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main dashboard component ──────────────────────────────────────────────

interface IngredientsDashboardProps {
  totalIngredients: number
}

export function IngredientsDashboard({
  totalIngredients,
}: IngredientsDashboardProps) {
  const { data: outletsData, isLoading: isLoadingOutlets } = useOutletsQuery()
  const outlets = outletsData?.data ?? []
  const outletIds = outlets.map((o) => o.id)

  const {
    lowStockQueries,
    stockValueQueries,
    isLoading: isLoadingData,
  } = useAllOutletsDashboardQueries(outletIds)

  const isLoading = isLoadingOutlets || (outletIds.length > 0 && isLoadingData)

  // ── Aggregate KPIs ──────────────────────────────────────────────────────

  const totalStockValue = stockValueQueries.reduce(
    (sum, q) => sum + (q.data?.data.totalValue ?? 0),
    0
  )

  const allLowStockItems: AlertRow[] = lowStockQueries.flatMap((q, i) =>
    (q.data?.data ?? []).map((item) => ({
      ...item,
      outletName: outlets[i]?.name ?? '—',
    }))
  )

  const criticalCount = allLowStockItems.filter(
    (i) => parseFloat(i.quantityOnHand) < 0
  ).length

  const lowStockCount = allLowStockItems.filter(
    (i) => parseFloat(i.quantityOnHand) >= 0
  ).length

  // ── Top ingredients by aggregate value across all outlets ───────────────

  const ingredientValueMap = new Map<
    string,
    { name: string; code: string; unit: string; value: number }
  >()
  for (const q of stockValueQueries) {
    for (const item of q.data?.data.items ?? []) {
      const existing = ingredientValueMap.get(item.id)
      if (existing) {
        existing.value += item.totalValue
      } else {
        ingredientValueMap.set(item.id, {
          name: item.name,
          code: item.code,
          unit: item.unit,
          value: item.totalValue,
        })
      }
    }
  }

  const topIngredients = Array.from(ingredientValueMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // ── Outlet comparison chart data ────────────────────────────────────────

  const outletChartData = outlets.map((outlet, i) => ({
    name:
      outlet.name.length > 18 ? outlet.name.slice(0, 16) + '…' : outlet.name,
    value: stockValueQueries[i]?.data?.data.totalValue ?? 0,
  }))

  // ── Outlet-level per-card data ──────────────────────────────────────────

  type OutletCardData = {
    outlet: Outlet
    stockValue: number
    itemCount: number
    criticalCount: number
    lowCount: number
  }

  const outletCardData: OutletCardData[] = outlets.map((outlet, i) => {
    const svData = stockValueQueries[i]?.data?.data
    const lsItems = lowStockQueries[i]?.data?.data ?? []
    const critical = lsItems.filter(
      (x) => parseFloat(x.quantityOnHand) < 0
    ).length
    const low = lsItems.filter((x) => parseFloat(x.quantityOnHand) >= 0).length
    return {
      outlet,
      stockValue: svData?.totalValue ?? 0,
      itemCount: svData?.itemCount ?? 0,
      criticalCount: critical,
      lowCount: low,
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────

  const metricValue = (value: string | number) => (isLoading ? '—' : value)

  return (
    <div className='flex flex-col gap-4'>
      <DataPanel aria-label='Inventory summary' className='overflow-hidden'>
        <MetricGroup className='grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'>
          <Metric
            label='Ingredients'
            definition='Items in the master ingredient list.'
            value={totalIngredients.toLocaleString('id-ID')}
          />
          <Metric
            label='Stock value'
            definition='Quantity on hand × weighted average cost, across all outlets.'
            value={metricValue(fmtFull(totalStockValue))}
          />
          <Metric label='Outlets' value={outlets.length} />
          <Metric
            label='Negative stock'
            definition='Ingredients whose quantity on hand is below zero.'
            value={
              <span
                className={cn(
                  !isLoading && criticalCount > 0 && 'text-status-danger'
                )}
              >
                {metricValue(criticalCount)}
              </span>
            }
          />
          <Metric
            label='Below minimum'
            definition='Ingredients under their minimum stock level.'
            value={
              <span
                className={cn(
                  !isLoading && lowStockCount > 0 && 'text-status-warning'
                )}
              >
                {metricValue(lowStockCount)}
              </span>
            }
          />
        </MetricGroup>
      </DataPanel>

      <DataPanel
        aria-labelledby='outlet-health-title'
        className='overflow-hidden'
      >
        <SectionHeader
          id='outlet-health-title'
          title='Outlet stock health'
          description='Stock value and alerts per outlet'
          className='p-4 sm:px-5'
        />
        {isLoadingOutlets ? (
          <div role='status' className='space-y-2 px-4 pb-4 sm:px-5'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='bg-surface-hover h-8 animate-pulse rounded'
              />
            ))}
          </div>
        ) : outlets.length === 0 ? (
          <EmptyState title='No outlets yet.' className='py-8' />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead>Outlet</TableHead>
                <TableHead className='text-right'>Stock value</TableHead>
                <TableHead className='text-right'>Items</TableHead>
                <TableHead className='text-right'>Negative</TableHead>
                <TableHead className='text-right'>Below min.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outletCardData.map(
                ({
                  outlet,
                  stockValue,
                  itemCount,
                  criticalCount: cc,
                  lowCount: lc,
                }) => {
                  const health = HEALTH[getOutletHealth(cc, lc, itemCount)]
                  return (
                    <TableRow key={outlet.id}>
                      <TableCell>
                        <span className='font-medium'>{outlet.name}</span>
                        <span className='text-fg-muted ms-2 text-xs'>
                          {outlet.code}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        {isLoadingData ? '—' : fmtFull(stockValue)}
                      </TableCell>
                      <TableCell className='text-fg-secondary text-right'>
                        {isLoadingData ? '—' : itemCount}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right',
                          cc > 0 && 'text-status-danger font-medium'
                        )}
                      >
                        {isLoadingData ? '—' : cc}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right',
                          lc > 0 && 'text-status-warning font-medium'
                        )}
                      >
                        {isLoadingData ? '—' : lc}
                      </TableCell>
                      <TableCell>
                        {!isLoadingData && (
                          <Badge variant='outline' className={health.tone}>
                            {health.label}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                }
              )}
            </TableBody>
          </Table>
        )}
      </DataPanel>

      <DataPanel className='grid overflow-hidden xl:grid-cols-2'>
        <section
          aria-labelledby='top-ingredients-title'
          className='flex min-w-0 flex-col gap-3 p-4 sm:p-5'
        >
          <SectionHeader
            as='h3'
            id='top-ingredients-title'
            title='Top ingredients by stock value'
            description='All outlets · quantity × weighted average cost'
          />
          {isLoading ? (
            <div
              role='status'
              className='bg-surface-hover h-56 w-full animate-pulse rounded'
            />
          ) : topIngredients.length === 0 ? (
            <EmptyState title='No stock value data yet.' className='h-56' />
          ) : (
            <ResponsiveContainer
              width='100%'
              height={topIngredients.length * 28 + 32}
            >
              <BarChart
                layout='vertical'
                data={topIngredients}
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke='var(--chart-grid)' />
                <XAxis
                  type='number'
                  tickFormatter={(v) => fmtCompact(v)}
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={4}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={110}
                  tick={{ fontSize: 12, fill: 'var(--fg-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'var(--surface-hover)' }}
                  isAnimationActive={false}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey='value'
                  fill='var(--series-primary)'
                  radius={[0, 4, 4, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {outlets.length > 1 ? (
          <section
            aria-labelledby='outlet-value-title'
            className='border-divider flex min-w-0 flex-col gap-3 border-t p-4 sm:p-5 xl:border-t-0 xl:border-l'
          >
            <SectionHeader
              as='h3'
              id='outlet-value-title'
              title='Stock value by outlet'
              description='Total inventory value per outlet'
            />
            <ResponsiveContainer width='100%' height={240}>
              <BarChart
                data={outletChartData}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke='var(--chart-grid)' />
                <XAxis
                  dataKey='name'
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={{ stroke: 'var(--divider-strong)' }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={(v) => fmtCompact(v)}
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={4}
                  width={72}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'var(--surface-hover)' }}
                  isAnimationActive={false}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey='value'
                  fill='var(--series-primary)'
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>
        ) : (
          <section
            aria-labelledby='value-breakdown-title'
            className='border-divider flex min-w-0 flex-col gap-3 border-t p-4 sm:p-5 xl:border-t-0 xl:border-l'
          >
            <SectionHeader
              as='h3'
              id='value-breakdown-title'
              title='Stock value breakdown'
              description='Share of total value by ingredient'
            />
            {isLoading ? (
              <div
                role='status'
                className='bg-surface-hover h-48 animate-pulse rounded'
              />
            ) : (
              <table className='w-full text-[13px] tabular-nums'>
                <tbody>
                  {(stockValueQueries[0]?.data?.data.items ?? [])
                    .filter((i): i is typeof i => i.totalValue >= 0)
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((item: StockValueItem) => {
                      const total =
                        stockValueQueries[0]?.data?.data.totalValue ?? 1
                      const pct =
                        total > 0 ? (item.totalValue / total) * 100 : 0
                      return (
                        <tr
                          key={item.id}
                          className='border-divider border-b last:border-0'
                        >
                          <th
                            scope='row'
                            className='w-full max-w-0 truncate py-2 pr-3 text-left font-medium'
                          >
                            {item.name}
                          </th>
                          <td className='py-2 pr-3 text-right whitespace-nowrap'>
                            {fmtFull(item.totalValue)}
                          </td>
                          <td className='py-2'>
                            <div className='flex items-center justify-end gap-2'>
                              <span
                                aria-hidden
                                className='bg-surface-hover h-1 w-12 overflow-hidden rounded-full'
                              >
                                <span
                                  className='bg-series-primary block h-full rounded-full'
                                  style={{ width: `${Math.max(pct, 2)}%` }}
                                />
                              </span>
                              <span className='text-fg-secondary w-12 text-right'>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            )}
          </section>
        )}
      </DataPanel>

      <DataPanel aria-labelledby='stock-alerts-title' className='p-4 sm:p-5'>
        <SectionHeader
          id='stock-alerts-title'
          title='Stock alerts'
          description='Ingredients below minimum or with negative quantity, across outlets'
          actions={
            allLowStockItems.length > 0 && (
              <>
                {criticalCount > 0 && (
                  <Badge variant='outline' className={STATUS_TONE.danger}>
                    {criticalCount} negative
                  </Badge>
                )}
                {lowStockCount > 0 && (
                  <Badge variant='outline' className={STATUS_TONE.warning}>
                    {lowStockCount} below minimum
                  </Badge>
                )}
              </>
            )
          }
        />
        <div className='mt-2'>
          {isLoading ? (
            <div role='status' className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='bg-surface-hover h-9 animate-pulse rounded'
                />
              ))}
            </div>
          ) : (
            <CriticalAlertsList alerts={allLowStockItems} />
          )}
        </div>
      </DataPanel>
    </div>
  )
}
