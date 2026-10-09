import {
  AlertTriangle,
  Beaker,
  Building2,
  CheckCircle2,
  DollarSign,
  XCircle,
} from '@/components/icons'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// ── KPI card ──────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  description?: string
  variant?: 'default' | 'critical' | 'warning' | 'success'
}

function KpiCard({
  label,
  value,
  icon: Icon,
  description,
  variant = 'default',
}: KpiCardProps) {
  const variantClass = {
    default: 'border-border',
    critical: 'border-destructive/30 bg-destructive/5',
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
  }[variant]

  const iconClass = {
    default: 'bg-muted text-muted-foreground',
    critical: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  }[variant]

  const valueClass = {
    default: 'text-foreground',
    critical: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
  }[variant]

  return (
    <Card className={`gap-2 ${variantClass}`}>
      <CardContent className='flex items-start gap-3 pt-4 pb-4'>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</div>
          <div className='text-muted-foreground text-sm'>{label}</div>
          {description && (
            <div className='text-muted-foreground mt-0.5 text-xs'>{description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Outlet health card ────────────────────────────────────────────────────

type OutletHealth = 'critical' | 'warning' | 'healthy'

function getOutletHealth(criticalCount: number, lowCount: number, total: number): OutletHealth {
  if (criticalCount > 0) return 'critical'
  if (total > 0 && lowCount / total > 0.25) return 'warning'
  return 'healthy'
}

const healthChip: Record<OutletHealth, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  warning: {
    label: 'Warning',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  healthy: {
    label: 'Healthy',
    className: 'border-success/30 bg-success/10 text-success',
  },
}

interface OutletHealthCardProps {
  outlet: Outlet
  stockValue: number
  itemCount: number
  criticalCount: number
  lowCount: number
  isLoading: boolean
}

function OutletHealthCard({
  outlet,
  stockValue,
  itemCount,
  criticalCount,
  lowCount,
  isLoading,
}: OutletHealthCardProps) {
  const health = getOutletHealth(criticalCount, lowCount, itemCount)
  const chip = healthChip[health]

  return (
    <Card className='gap-0'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <CardTitle className='truncate text-sm font-semibold'>
              {outlet.name}
            </CardTitle>
            <span className='text-muted-foreground font-sans tabular-nums text-xs'>
              {outlet.code}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${chip.className}`}
          >
            {chip.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 pb-4'>
        {isLoading ? (
          <div className='space-y-2'>
            {[1, 2].map((i) => (
              <div key={i} className='bg-muted h-4 animate-pulse rounded' />
            ))}
          </div>
        ) : (
          <>
            {/* Stock value */}
            <div className='flex items-baseline gap-1.5'>
              <span className='text-foreground text-lg font-bold tabular-nums'>
                {fmtCompact(stockValue)}
              </span>
              <span className='text-muted-foreground text-xs'>stock value</span>
            </div>

            {/* Item count row */}
            <div className='text-muted-foreground flex items-center gap-3 text-xs'>
              <span>{itemCount} items tracked</span>
            </div>

            {/* Alert counts */}
            <div className='flex flex-wrap gap-2'>
              {criticalCount > 0 && (
                <span className='border-destructive/30 bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium'>
                  <XCircle className='h-3 w-3' />
                  {criticalCount} critical
                </span>
              )}
              {lowCount > 0 && (
                <span className='border-warning/30 bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium'>
                  <AlertTriangle className='h-3 w-3' />
                  {lowCount} low stock
                </span>
              )}
              {criticalCount === 0 && lowCount === 0 && (
                <span className='border-success/30 bg-success/10 text-success inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium'>
                  <CheckCircle2 className='h-3 w-3' />
                  All items healthy
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
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
    <div
      className='rounded-lg border px-3 py-2 text-sm shadow-none'
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className='text-muted-foreground mb-1 text-xs'>{label}</div>
      <div className='text-foreground font-semibold'>{fmtFull(payload[0].value)}</div>
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
      <div className='text-muted-foreground flex h-32 items-center justify-center text-sm'>
        No critical or low-stock items — all outlets are healthy.
      </div>
    )
  }

  return (
    <div className='divide-border divide-y'>
      {alerts.map((alert) => {
        const qty = parseFloat(alert.quantityOnHand)
        const isNegative = qty < 0
        return (
          <div key={alert.id} className='flex items-center gap-3 py-3 text-sm'>
            {/* Status dot */}
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${
                isNegative ? 'bg-destructive' : 'bg-warning'
              }`}
            />

            {/* Ingredient info */}
            <div className='min-w-0 flex-1'>
              <div className='text-foreground truncate font-medium'>{alert.name}</div>
              <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                <span className='font-sans tabular-nums'>{alert.code}</span>
                <span>·</span>
                <span>{alert.outletName}</span>
              </div>
            </div>

            {/* Quantity */}
            <div
              className={`shrink-0 text-right tabular-nums ${
                isNegative ? 'text-destructive font-semibold' : 'text-warning'
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

export function IngredientsDashboard({ totalIngredients }: IngredientsDashboardProps) {
  const { data: outletsData, isLoading: isLoadingOutlets } = useOutletsQuery()
  const outlets = outletsData?.data ?? []
  const outletIds = outlets.map((o) => o.id)

  const { lowStockQueries, stockValueQueries, isLoading: isLoadingData } =
    useAllOutletsDashboardQueries(outletIds)

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
    const critical = lsItems.filter((x) => parseFloat(x.quantityOnHand) < 0).length
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

  return (
    <div className='space-y-6'>

      {/* ── KPI strip ──────────────────────────────────────── */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
        <KpiCard
          label='Total Ingredients'
          value={totalIngredients}
          icon={Beaker}
          description='Master catalogue'
        />
        <KpiCard
          label='Total Stock Value'
          value={isLoading ? '—' : fmtCompact(totalStockValue)}
          icon={DollarSign}
          description='Across all outlets'
        />
        <KpiCard
          label='Outlets Monitored'
          value={outlets.length}
          icon={Building2}
          description='Active outlets'
        />
        <KpiCard
          label='Critical Alerts'
          value={isLoading ? '—' : criticalCount}
          icon={XCircle}
          description='Negative stock qty'
          variant={criticalCount > 0 ? 'critical' : 'default'}
        />
        <KpiCard
          label='Low Stock Items'
          value={isLoading ? '—' : lowStockCount}
          icon={AlertTriangle}
          description='Below minimum'
          variant={lowStockCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* ── Outlet health cards ─────────────────────────────── */}
      <div>
        <h3 className='text-foreground mb-3 text-sm font-semibold'>Outlet Health Overview</h3>
        {isLoadingOutlets ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {[1, 2, 3].map((i) => (
              <Card key={i} className='h-36 animate-pulse bg-muted/40' />
            ))}
          </div>
        ) : outlets.length === 0 ? (
          <div className='text-muted-foreground rounded-xl border py-10 text-center text-sm'>
            No outlets found.
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {outletCardData.map(({ outlet, stockValue, itemCount, criticalCount: cc, lowCount: lc }) => (
              <OutletHealthCard
                key={outlet.id}
                outlet={outlet}
                stockValue={stockValue}
                itemCount={itemCount}
                criticalCount={cc}
                lowCount={lc}
                isLoading={isLoadingData}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Charts + Alerts row ─────────────────────────────── */}
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>

        {/* Top ingredients by stock value */}
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-semibold'>
              Top Ingredients by Stock Value
            </CardTitle>
            <p className='text-muted-foreground text-xs'>
              Aggregated across all outlets · WAC × qty
            </p>
          </CardHeader>
          <CardContent>
            {isLoading || topIngredients.length === 0 ? (
              <div className='flex h-48 items-center justify-center'>
                {isLoading ? (
                  <div className='bg-muted h-48 w-full animate-pulse rounded-lg' />
                ) : (
                  <span className='text-muted-foreground text-sm'>
                    No stock value data yet.
                  </span>
                )}
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={220}>
                <BarChart
                  layout='vertical'
                  data={topIngredients}
                  margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray='3 3'
                    stroke='var(--border)'
                  />
                  <XAxis
                    type='number'
                    tickFormatter={(v) => fmtCompact(v)}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={90}
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
                  <Bar isAnimationActive={false} dataKey='value' radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {topIngredients.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`var(--chart-${(i % 5) + 1})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Outlet stock value comparison (only if >1 outlet) */}
        {outlets.length > 1 ? (
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-semibold'>
                Stock Value by Outlet
              </CardTitle>
              <p className='text-muted-foreground text-xs'>
                Total inventory value per outlet
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={220}>
                <BarChart
                  data={outletChartData}
                  margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='3 3'
                    stroke='var(--border)'
                  />
                  <XAxis
                    dataKey='name'
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtCompact(v)}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
                  <Bar isAnimationActive={false} dataKey='value' fill='var(--chart-1)' radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          /* Single outlet: show all-items breakdown as table instead */
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-semibold'>
                Stock Value Breakdown
              </CardTitle>
              <p className='text-muted-foreground text-xs'>
                Per-ingredient contribution to total value
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='bg-muted h-48 animate-pulse rounded-lg' />
              ) : (
                <div className='divide-border divide-y'>
                  {(stockValueQueries[0]?.data?.data.items ?? [])
                    .filter((i): i is typeof i => i.totalValue >= 0)
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((item: StockValueItem) => {
                      const total = stockValueQueries[0]?.data?.data.totalValue ?? 1
                      const pct = total > 0 ? (item.totalValue / total) * 100 : 0
                      return (
                        <div key={item.id} className='py-2.5'>
                          <div className='mb-1.5 flex items-center justify-between text-xs'>
                            <span className='text-foreground font-medium'>{item.name}</span>
                            <span className='text-muted-foreground tabular-nums'>
                              {fmtFull(item.totalValue)}
                            </span>
                          </div>
                          <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                            <div
                              className='bg-primary h-full rounded-full transition-colors'
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Critical & low stock alerts ─────────────────────── */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold'>
              Stock Alerts
            </CardTitle>
            {allLowStockItems.length > 0 && (
              <div className='flex gap-2'>
                {criticalCount > 0 && (
                  <Badge
                    variant='outline'
                    className='border-destructive/30 bg-destructive/10 text-destructive text-xs'
                  >
                    {criticalCount} critical
                  </Badge>
                )}
                {lowStockCount > 0 && (
                  <Badge
                    variant='outline'
                    className='border-warning/30 bg-warning/10 text-warning text-xs'
                  >
                    {lowStockCount} low
                  </Badge>
                )}
              </div>
            )}
          </div>
          <p className='text-muted-foreground text-xs'>
            All ingredients below minimum stock or with negative quantity across outlets
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='bg-muted h-10 animate-pulse rounded-lg' />
              ))}
            </div>
          ) : (
            <CriticalAlertsList alerts={allLowStockItems} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
