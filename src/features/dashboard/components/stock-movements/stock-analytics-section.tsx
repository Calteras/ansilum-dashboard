/**
 * Stock Analytics Section
 *
 * Replaces the DevStockSection, StockMovementsStats, CostBreakdownChart,
 * and StockMovementsChart with live data from GET /analytics/stock.
 */
import { useState } from 'react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  Layers,
  ChartLine,
} from '@/components/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector,
  Legend,
  CartesianGrid,
} from 'recharts'
import { useAnalyticsStockQuery } from '@/features/analytics/api/analytics.queries'
import type {
  AnalyticsStockKpis,
  AnalyticsStockCostItem,
  AnalyticsTopConsumed,
  AnalyticsMovementBreakdown,
  AnalyticsPerOutletInventory,
  AnalyticsTransferPipeline,
  AnalyticsIngredientUsageByDay,
  TransferStatus,
} from '@/features/analytics/api/analytics.types'

// ─── Colour palette ───────────────────────────────────────────────────────────

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const MOVEMENT_COLORS: Record<string, string> = {
  SALE: 'var(--chart-3)',
  PURCHASE: 'var(--chart-4)',
  WASTE: 'var(--chart-2)',
  ADJUSTMENT: 'var(--chart-1)',
  ADJ_IN: 'var(--chart-1)',
  ADJ_OUT: 'var(--chart-5)',
  TRANSFER: 'var(--chart-2)',
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}Jt`
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`
  return `Rp${n.toLocaleString('id-ID')}`
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function StockKpiStrip({
  kpis,
  isLoading,
}: {
  kpis: AnalyticsStockKpis | null
  isLoading: boolean
}) {
  const cards = kpis
    ? [
        {
          label: 'Stock Valuation',
          value: fmtCurrency(kpis.stockValuation),
          sub: 'Across all outlets (WAC)',
          positive: null as boolean | null,
          icon: Layers,
          color: 'text-chart-1',
          bg: 'bg-chart-1/10',
        },
        {
          label: 'COGS This Period',
          value: fmtCurrency(kpis.cogsThisPeriod),
          sub:
            kpis.cogsVsLastPeriod !== null
              ? `${kpis.cogsVsLastPeriod > 0 ? '+' : ''}${kpis.cogsVsLastPeriod.toFixed(1)}% vs last period`
              : 'No comparison data',
          positive:
            kpis.cogsVsLastPeriod !== null
              ? (kpis.cogsVsLastPeriod < 0 as boolean)
              : null,
          icon: TrendingDown,
          color: 'text-chart-3',
          bg: 'bg-chart-3/10',
        },
        {
          label: 'WAC Ingredients',
          value: `${kpis.wacIngredients} items`,
          sub: 'Cost tracked per outlet',
          positive: null as boolean | null,
          icon: Package,
          color: 'text-chart-2',
          bg: 'bg-chart-2/10',
        },
        {
          label: 'Transfers Active',
          value: `${kpis.transfersActive}`,
          sub: `${kpis.transfersByStatus.IN_TRANSIT} in-transit · ${kpis.transfersByStatus.PENDING} pending`,
          positive: null as boolean | null,
          icon: ArrowLeftRight,
          color: 'text-chart-5',
          bg: 'bg-chart-5/10',
        },
        {
          label: 'Below Reorder',
          value: `${kpis.belowReorder} items`,
          sub: `${kpis.belowReorderCritical} critical · ${kpis.belowReorderWarning} warning`,
          positive: kpis.belowReorder === 0 ? (true as boolean) : (false as boolean),
          icon: AlertTriangle,
          color: kpis.belowReorder > 0 ? 'text-destructive' : 'text-chart-4',
          bg: kpis.belowReorder > 0 ? 'bg-destructive/10' : 'bg-chart-4/10',
        },
        {
          label: 'Outlet Coverage',
          value: `${kpis.wacIngredients > 0 ? '100' : '0'}%`,
          sub: 'WAC tracking enabled',
          positive: null as boolean | null,
          icon: Warehouse,
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
      ]
    : null

  return (
    <div className='bg-card grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-3 lg:grid-cols-6'>
      {isLoading || !cards
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='flex flex-col gap-2.5 p-3 sm:p-4'>
              <div className='bg-muted h-3 w-20 animate-pulse rounded' />
              <div className='bg-muted h-5 w-24 animate-pulse rounded' />
              <div className='bg-muted h-3 w-28 animate-pulse rounded' />
            </div>
          ))
        : cards.map((kpi) => (
            <div key={kpi.label} className='flex flex-col gap-2.5 p-3 sm:p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs font-medium sm:text-xs'>
                  {kpi.label}
                </span>
                <div className={`rounded-md p-1 ${kpi.bg}`}>
                  <kpi.icon className={`size-3 ${kpi.color}`} />
                </div>
              </div>
              <p className='text-base leading-tight font-bold tracking-tight sm:text-lg'>
                {kpi.value}
              </p>
              <p
                className={`text-xs font-medium sm:text-xs ${
                  kpi.positive === true
                    ? 'text-leaf'
                    : kpi.positive === false
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                }`}
              >
                {kpi.sub}
              </p>
            </div>
          ))}
    </div>
  )
}

// ─── Cost Pie Chart ───────────────────────────────────────────────────────────

function StockCostPieChart({
  totalCost,
  items,
  isLoading,
}: {
  totalCost: number
  items: AnalyticsStockCostItem[]
  isLoading: boolean
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = items.map((item, i) => ({
    name: item.name,
    value: item.totalCost,
    pct: item.pct,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const renderActiveShape = (props: unknown) => {
    const p = props as {
      cx: number; cy: number; innerRadius: number; outerRadius: number
      startAngle: number; endAngle: number; fill: string
    }
    return (
      <g>
        <Sector
          cx={p.cx} cy={p.cy}
          innerRadius={p.innerRadius} outerRadius={p.outerRadius + 8}
          startAngle={p.startAngle} endAngle={p.endAngle}
          fill={p.fill}
        />
      </g>
    )
  }

  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-6 xl:w-[410px]'>
      <div className='flex items-center gap-2.5'>
        <div className='bg-chart-1/10 rounded-md p-1.5'>
          <ChartLine className='text-chart-1 size-4' />
        </div>
        <span className='text-sm font-medium'>Cost Breakdown</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          {fmtCurrency(totalCost)} total
        </span>
      </div>

      {isLoading ? (
        <div className='bg-muted h-[220px] w-full animate-pulse rounded-lg' />
      ) : data.length === 0 ? (
        <div className='text-muted-foreground py-10 text-center text-sm'>
          No cost data for this period.
        </div>
      ) : (
        <div className='flex flex-col items-center gap-4 sm:flex-row sm:gap-6'>
          <div className='relative size-[220px] shrink-0'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie isAnimationActive={false}
                  data={data}
                  cx='50%' cy='50%'
                  innerRadius='42%' outerRadius='70%'
                  paddingAngle={2}
                  dataKey='value'
                  strokeWidth={0}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-lg font-semibold'>{fmtCurrency(totalCost)}</span>
              <span className='text-muted-foreground text-xs'>Total Cost</span>
            </div>
          </div>

          <div className='grid w-full flex-1 grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3'>
            {data.map((item, i) => (
              <div
                key={item.name}
                className={`flex items-center gap-2 transition-opacity ${
                  activeIndex !== null && activeIndex !== i ? 'opacity-40' : ''
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className='h-4 w-1 shrink-0 rounded-sm' style={{ backgroundColor: item.color }} />
                <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>{item.name}</span>
                <span className='text-muted-foreground text-xs'>{item.pct.toFixed(1)}%</span>
                <span className='text-xs font-semibold tabular-nums'>{fmtCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ingredient Usage by Day ──────────────────────────────────────────────────

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function StockIngredientUsageChart({
  usageByDay,
  isLoading,
}: {
  usageByDay: AnalyticsIngredientUsageByDay[]
  isLoading: boolean
}) {
  // Sort by dayIndex and build recharts-compatible rows
  const sorted = [...usageByDay].sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day)
    const bi = DAY_ORDER.indexOf(b.day)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // Collect all ingredient names
  const ingredientNames = Array.from(
    new Set(sorted.flatMap((d) => d.ingredients.map((i) => i.name)))
  )

  const chartData = sorted.map((d) => {
    const row: Record<string, string | number> = { name: d.day }
    d.ingredients.forEach((ing) => {
      row[ing.name] = ing.quantity
    })
    return row
  })

  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-6'>
      <div className='flex items-center gap-2.5'>
        <div className='bg-chart-2/10 rounded-md p-1.5'>
          <ChartLine className='text-chart-2 size-4' />
        </div>
        <span className='text-sm font-medium'>Ingredient Usage by Day</span>
        <span className='text-muted-foreground ml-auto text-xs'>qty consumed</span>
      </div>

      {isLoading ? (
        <div className='bg-muted h-[300px] w-full animate-pulse rounded-lg' />
      ) : chartData.length === 0 ? (
        <div className='text-muted-foreground py-10 text-center text-sm'>
          No usage data for this period.
        </div>
      ) : (
        <div className='h-[300px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
              <XAxis
                dataKey='name'
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {ingredientNames.map((name, i) => (
                <Bar isAnimationActive={false}
                  key={name}
                  dataKey={name}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Per-outlet inventory ─────────────────────────────────────────────────────

function StockOutletInventory({
  outlets,
  isLoading,
}: {
  outlets: AnalyticsPerOutletInventory[]
  isLoading: boolean
}) {
  const total = outlets.reduce((s, o) => s + o.totalValue, 0)

  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-5/10 rounded-md p-1.5'>
          <Warehouse className='text-chart-5 size-4' />
        </div>
        <span className='text-sm font-medium'>Per-Outlet Inventory</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          Total: {fmtCurrency(total)}
        </span>
      </div>

      {isLoading ? (
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='space-y-1.5'>
              <div className='bg-muted h-3 w-3/4 animate-pulse rounded' />
              <div className='bg-muted h-2 w-full animate-pulse rounded-full' />
            </div>
          ))}
        </div>
      ) : outlets.length === 0 ? (
        <div className='text-muted-foreground py-6 text-center text-sm'>
          No outlet data for this period.
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {outlets.map((outlet) => (
            <div key={outlet.outletId} className='space-y-1.5'>
              <div className='flex items-center justify-between gap-2 text-xs'>
                <div className='min-w-0'>
                  <span className='font-medium'>{outlet.outletName}</span>
                  <span className='text-muted-foreground ml-1.5'>{outlet.outletCode}</span>
                </div>
                <div className='flex shrink-0 items-center gap-3'>
                  <span className='text-muted-foreground'>{outlet.itemCount} items</span>
                  <span className='font-semibold tabular-nums'>
                    {fmtCurrency(outlet.totalValue)}
                  </span>
                  <span
                    className={`w-8 text-right font-semibold ${
                      outlet.utilizationPct >= 75
                        ? 'text-leaf'
                        : outlet.utilizationPct >= 50
                          ? 'text-chart-2'
                          : 'text-chart-3'
                    }`}
                  >
                    {outlet.utilizationPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                <div
                  className={`h-full rounded-full transition-colors ${
                    outlet.utilizationPct >= 75
                      ? 'bg-chart-4'
                      : outlet.utilizationPct >= 50
                        ? 'bg-chart-2'
                        : 'bg-chart-3'
                  }`}
                  style={{ width: `${Math.min(outlet.utilizationPct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Transfer pipeline ────────────────────────────────────────────────────────

const TRANSFER_STAGES: TransferStatus[] = ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED']

const STAGE_STYLE: Record<TransferStatus, { color: string; bg: string; label: string }> = {
  PENDING:   { color: 'text-muted-foreground', bg: 'bg-muted/60',     label: 'Pending'   },
  APPROVED:  { color: 'text-chart-2',          bg: 'bg-chart-2/10',   label: 'Approved'  },
  IN_TRANSIT:{ color: 'text-chart-3',          bg: 'bg-chart-3/10',   label: 'In Transit'},
  COMPLETED: { color: 'text-chart-4',          bg: 'bg-chart-4/10',   label: 'Completed' },
}

function StockTransferPipeline({
  pipeline,
  isLoading,
}: {
  pipeline: AnalyticsTransferPipeline | null
  isLoading: boolean
}) {
  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-95'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-5/10 rounded-md p-1.5'>
          <ArrowLeftRight className='text-chart-5 size-4' />
        </div>
        <span className='text-sm font-medium'>Transfer Pipeline</span>
      </div>

      {isLoading || !pipeline ? (
        <div className='grid grid-cols-4 gap-1.5'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='bg-muted h-16 animate-pulse rounded-md' />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-4 gap-1.5'>
          {TRANSFER_STAGES.map((stage) => {
            const s = STAGE_STYLE[stage]
            const count = pipeline[stage].count

            return (
              <div key={stage} className='flex flex-col gap-1.5'>
                <div className={`rounded-md px-1.5 py-1 text-center ${s.bg}`}>
                  <p className={`text-xs font-semibold tracking-wide uppercase ${s.color}`}>
                    {s.label}
                  </p>
                  <p className={`text-sm font-bold ${s.color}`}>{count}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Top consumed ─────────────────────────────────────────────────────────────

function StockTopConsumed({
  items,
  isLoading,
}: {
  items: AnalyticsTopConsumed[]
  isLoading: boolean
}) {
  const maxQty = Math.max(...items.map((i) => i.totalQuantity), 1)

  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-105'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-3/10 rounded-md p-1.5'>
          <ShoppingCart className='text-chart-3 size-4' />
        </div>
        <span className='text-sm font-medium'>Top Consumed</span>
        <span className='text-muted-foreground ml-auto text-xs'>by qty · SALE movements</span>
      </div>

      {isLoading ? (
        <div className='flex flex-col gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-1.5'>
              <div className='bg-muted h-3 w-3/4 animate-pulse rounded' />
              <div className='bg-muted h-1.5 w-full animate-pulse rounded-full' />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='text-muted-foreground py-8 text-center text-sm'>
          No consumption data for this period.
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {items.map((item, i) => (
            <div key={item.ingredientId} className='flex items-center gap-3'>
              <span
                className={`w-4 shrink-0 text-xs font-bold tabular-nums ${
                  i === 0 ? 'text-chart-2' : 'text-muted-foreground'
                }`}
              >
                {item.rank}
              </span>

              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='min-w-0'>
                    <span className='truncate text-xs font-medium'>{item.name}</span>
                    <span className='text-muted-foreground ml-1.5 text-xs'>{item.code}</span>
                  </div>
                  <div className='flex shrink-0 items-center gap-1.5'>
                    {item.trendPct !== null ? (
                      <>
                        {item.trendPct >= 0 ? (
                          <TrendingUp className='size-3 text-leaf' />
                        ) : (
                          <TrendingDown className='size-3 text-red-400' />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            item.trendPct >= 0 ? 'text-leaf' : 'text-red-500'
                          }`}
                        >
                          {item.trendPct >= 0 ? '+' : ''}{item.trendPct.toFixed(1)}%
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                  <div
                    className='bg-chart-1 h-full rounded-full'
                    style={{ width: `${(item.totalQuantity / maxQty) * 100}%` }}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs'>
                    {item.totalQuantity.toLocaleString('id-ID')} {item.unit}
                  </span>
                  <span className='text-xs font-semibold tabular-nums'>
                    {fmtCurrency(item.totalCOGS)} COGS
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Movement breakdown bar chart ─────────────────────────────────────────────

function StockMovementBreakdownChart({
  movements,
  isLoading,
}: {
  movements: AnalyticsMovementBreakdown[]
  isLoading: boolean
}) {
  const data = movements.map((m) => ({
    type: m.type,
    qty: m.totalQuantity,
    count: m.count,
    color: MOVEMENT_COLORS[m.type] ?? 'var(--chart-1)',
  }))

  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-1/10 rounded-md p-1.5'>
          <Package className='text-chart-1 size-4' />
        </div>
        <span className='text-sm font-medium'>Movement Breakdown</span>
        <span className='text-muted-foreground ml-auto text-xs'>by qty moved</span>
      </div>

      {isLoading ? (
        <div className='bg-muted h-50 w-full animate-pulse rounded-lg' />
      ) : data.length === 0 ? (
        <div className='text-muted-foreground py-8 text-center text-sm'>
          No movements for this period.
        </div>
      ) : (
        <>
          <div className='h-50 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={data}
                layout='vertical'
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis
                  type='number'
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                  }
                />
                <YAxis
                  type='category'
                  dataKey='type'
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(
                    v,
                    _name,
                    entry: { payload?: { count: number } }
                  ) => [
                    `${Number(v).toLocaleString()} units (${entry.payload?.count ?? 0} records)`,
                    'Qty',
                  ]}
                />
                <Bar isAnimationActive={false} dataKey='qty' radius={[0, 3, 3, 0]} maxBarSize={20}>
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className='flex flex-wrap gap-x-4 gap-y-1.5'>
            {data.map((entry) => (
              <div key={entry.type} className='flex items-center gap-1.5'>
                <span
                  className='inline-block size-2 rounded-full'
                  style={{ backgroundColor: entry.color }}
                />
                <span className='text-muted-foreground text-xs'>{entry.type}</span>
                <span className='text-xs font-semibold'>{entry.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface StockAnalyticsSectionProps {
  dateRange: DateRange
  outletId: string
}

export function StockAnalyticsSection({
  dateRange,
  outletId,
}: StockAnalyticsSectionProps) {
  const params = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    outletId: outletId || undefined,
  }

  const { data, isLoading } = useAnalyticsStockQuery(params)
  const stock = data?.data ?? null

  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      {/* KPI strip */}
      <StockKpiStrip kpis={stock?.kpis ?? null} isLoading={isLoading} />

      {/* Outlet inventory + Transfer pipeline */}
      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <StockOutletInventory
          outlets={stock?.perOutletInventory ?? []}
          isLoading={isLoading}
        />
        <StockTransferPipeline
          pipeline={stock?.transferPipeline ?? null}
          isLoading={isLoading}
        />
      </div>

      {/* Top consumed + Movement breakdown */}
      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <StockTopConsumed
          items={stock?.topConsumed ?? []}
          isLoading={isLoading}
        />
        <StockMovementBreakdownChart
          movements={stock?.movementBreakdown ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Cost pie + Ingredient usage by day */}
      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <StockCostPieChart
          totalCost={stock?.costBreakdown.totalCost ?? 0}
          items={stock?.costBreakdown.items ?? []}
          isLoading={isLoading}
        />
        <StockIngredientUsageChart
          usageByDay={stock?.ingredientUsageByDay ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
