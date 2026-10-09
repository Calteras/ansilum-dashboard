/**
 * DEV-ONLY: Enhanced Stock Movements Section
 *
 * Rendered exclusively when import.meta.env.DEV === true.
 * All data is hardcoded mock — this previews planned features
 * derived from the per-outlet inventory architecture:
 *
 *   Ingredient (master) → OutletInventory (per-outlet source of truth)
 *     - quantityOnHand   per outlet
 *     - avgCostPerUnit   WAC, updated on every PURCHASE
 *     - reorderPoint     per-outlet threshold
 *
 * Feature directions surfaced here:
 *  - Per-outlet inventory snapshot (OutletInventory model)
 *  - WAC-based stock valuation & COGS
 *  - Low-stock / reorder alerts by outlet
 *  - Movement type breakdown (SALE/PURCHASE/ADJUSTMENT/WASTE/TRANSFER)
 *  - Inter-outlet stock transfer pipeline
 *  - Top consumed ingredients ranking
 *  - StockOpname subscription gate preview
 */
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  ArrowLeftRight,
  Package,
  ShoppingCart,
  Layers,
  Lock,
} from '@/components/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_KPIS = [
  {
    label: 'Stock Valuation',
    value: 'Rp 20,5 Jt',
    sub: 'Across all outlets (WAC)',
    positive: null,
    icon: Layers,
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
  },
  {
    label: 'COGS This Period',
    value: 'Rp 18,3 Jt',
    sub: '+9% vs last period',
    positive: false,
    icon: TrendingDown,
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
  },
  {
    label: 'WAC Ingredients',
    value: '24 items',
    sub: 'Cost tracked per outlet',
    positive: null,
    icon: Package,
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
  },
  {
    label: 'Transfers Active',
    value: '3',
    sub: '1 in-transit · 2 pending',
    positive: null,
    icon: ArrowLeftRight,
    color: 'text-chart-5',
    bg: 'bg-chart-5/10',
  },
  {
    label: 'Below Reorder',
    value: '4 items',
    sub: '2 critical · 2 warning',
    positive: false,
    icon: AlertTriangle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    label: 'StockOpname',
    value: 'Gated',
    sub: '⚡ Subscription required',
    positive: null,
    icon: Lock,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
]

const MOCK_OUTLET_INVENTORY = [
  {
    outlet: 'Main Store',
    code: 'OUT-01',
    items: 24,
    stockValue: 8_450_000,
    utilization: 78,
  },
  {
    outlet: 'Branch Selatan',
    code: 'OUT-02',
    items: 18,
    stockValue: 5_120_000,
    utilization: 62,
  },
  {
    outlet: 'Branch Utara',
    code: 'OUT-03',
    items: 21,
    stockValue: 6_890_000,
    utilization: 71,
  },
]

const MOCK_MOVEMENT_BREAKDOWN = [
  { type: 'SALE', count: 342, qty: 1_847, color: 'var(--chart-3)' },
  { type: 'PURCHASE', count: 45, qty: 3_200, color: 'var(--chart-4)' },
  { type: 'WASTE', count: 23, qty: 178, color: 'var(--chart-2)' },
  { type: 'ADJ_IN', count: 12, qty: 240, color: 'var(--chart-1)' },
  { type: 'ADJ_OUT', count: 8, qty: 95, color: 'var(--chart-5)' },
  { type: 'TRANSFER', count: 14, qty: 350, color: 'var(--chart-2)' },
]

const MOCK_LOW_STOCK = [
  {
    ingredient: 'Kopi Arabika',
    code: 'ING-001',
    outlet: 'Branch Selatan',
    current: 0.5,
    reorder: 2.0,
    unit: 'kg',
    severity: 'critical' as const,
  },
  {
    ingredient: 'Sirup Vanilla',
    code: 'ING-012',
    outlet: 'Branch Selatan',
    current: 0.0,
    reorder: 1.0,
    unit: 'liter',
    severity: 'critical' as const,
  },
  {
    ingredient: 'Susu Segar',
    code: 'ING-003',
    outlet: 'Branch Utara',
    current: 3.0,
    reorder: 5.0,
    unit: 'liter',
    severity: 'warning' as const,
  },
  {
    ingredient: 'Gula Pasir',
    code: 'ING-007',
    outlet: 'Main Store',
    current: 1.2,
    reorder: 3.0,
    unit: 'kg',
    severity: 'warning' as const,
  },
]

const MOCK_TOP_CONSUMED = [
  {
    ingredient: 'Kopi Robusta',
    code: 'ING-002',
    qty: 450,
    unit: 'g',
    cost: 9_000_000,
    trend: 15,
  },
  {
    ingredient: 'Susu UHT',
    code: 'ING-004',
    qty: 380,
    unit: 'liter',
    cost: 3_800_000,
    trend: 8,
  },
  {
    ingredient: 'Air Galon',
    code: 'ING-010',
    qty: 240,
    unit: 'galon',
    cost: 2_400_000,
    trend: -3,
  },
  {
    ingredient: 'Gula Pasir',
    code: 'ING-007',
    qty: 120,
    unit: 'kg',
    cost: 1_680_000,
    trend: 5,
  },
  {
    ingredient: 'Coklat Bubuk',
    code: 'ING-008',
    qty: 95,
    unit: 'g',
    cost: 950_000,
    trend: 22,
  },
]

const MAX_CONSUMED = MOCK_TOP_CONSUMED[0].qty

const MOCK_TRANSFERS = [
  {
    id: 'TRF-001',
    from: 'Main Store',
    to: 'Branch Selatan',
    items: 3,
    status: 'IN_TRANSIT' as const,
  },
  {
    id: 'TRF-002',
    from: 'Main Store',
    to: 'Branch Utara',
    items: 2,
    status: 'APPROVED' as const,
  },
  {
    id: 'TRF-003',
    from: 'Branch Utara',
    to: 'Branch Selatan',
    items: 1,
    status: 'PENDING' as const,
  },
  {
    id: 'TRF-004',
    from: 'Main Store',
    to: 'Branch Selatan',
    items: 4,
    status: 'COMPLETED' as const,
  },
]

const TRANSFER_STAGES = [
  'PENDING',
  'APPROVED',
  'IN_TRANSIT',
  'COMPLETED',
] as const

// ─── Sub-components ───────────────────────────────────────────────────────────


function ExtendedKpiStrip() {
  return (
    <div className='bg-card grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-3 lg:grid-cols-6'>
      {MOCK_KPIS.map((kpi) => (
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

function OutletInventorySnapshot() {
  const total = MOCK_OUTLET_INVENTORY.reduce((a, o) => a + o.stockValue, 0)

  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-5/10 rounded-md p-1.5'>
          <Warehouse className='text-chart-5 size-4' />
        </div>
        <span className='text-sm font-medium'>Per-Outlet Inventory</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          Total: Rp{(total / 1_000_000).toFixed(1)}Jt
        </span>
      </div>

      <div className='flex flex-col gap-3'>
        {MOCK_OUTLET_INVENTORY.map((outlet) => (
          <div key={outlet.code} className='space-y-1.5'>
            <div className='flex items-center justify-between gap-2 text-xs'>
              <div>
                <span className='font-medium'>{outlet.outlet}</span>
                <span className='text-muted-foreground ml-1.5'>
                  {outlet.code}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-3'>
                <span className='text-muted-foreground'>
                  {outlet.items} items
                </span>
                <span className='font-semibold tabular-nums'>
                  Rp{(outlet.stockValue / 1_000_000).toFixed(2)}Jt
                </span>
                <span
                  className={`w-8 text-right font-semibold ${
                    outlet.utilization >= 75
                      ? 'text-leaf'
                      : outlet.utilization >= 50
                        ? 'text-chart-2'
                        : 'text-chart-3'
                  }`}
                >
                  {outlet.utilization}%
                </span>
              </div>
            </div>
            <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
              <div
                className={`h-full rounded-full transition-colors ${
                  outlet.utilization >= 75
                    ? 'bg-chart-4'
                    : outlet.utilization >= 50
                      ? 'bg-chart-2'
                      : 'bg-chart-3'
                }`}
                style={{ width: `${outlet.utilization}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className='text-muted-foreground border-t pt-3 text-xs'>
        Stock utilization = quantityOnHand / capacity threshold per
        OutletInventory
      </p>
    </div>
  )
}

function TransferPipeline() {
  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-95'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-5/10 rounded-md p-1.5'>
          <ArrowLeftRight className='text-chart-5 size-4' />
        </div>
        <span className='text-sm font-medium'>Transfer Pipeline</span>
      </div>

      {/* Stage columns */}
      <div className='grid grid-cols-4 gap-1.5'>
        {TRANSFER_STAGES.map((stage) => {
          const transfers = MOCK_TRANSFERS.filter((t) => t.status === stage)
          const stageColor: Record<typeof stage, string> = {
            PENDING: 'text-muted-foreground',
            APPROVED: 'text-chart-2',
            IN_TRANSIT: 'text-chart-3',
            COMPLETED: 'text-chart-4',
          }
          const stageBg: Record<typeof stage, string> = {
            PENDING: 'bg-muted/60',
            APPROVED: 'bg-chart-2/10',
            IN_TRANSIT: 'bg-chart-3/10',
            COMPLETED: 'bg-chart-4/10',
          }

          return (
            <div key={stage} className='flex flex-col gap-1.5'>
              <div
                className={`rounded-md px-1.5 py-1 text-center ${stageBg[stage]}`}
              >
                <p
                  className={`text-xs font-semibold tracking-wide uppercase ${stageColor[stage]}`}
                >
                  {stage === 'IN_TRANSIT'
                    ? 'Transit'
                    : stage.charAt(0) + stage.slice(1).toLowerCase()}
                </p>
                <p className={`text-sm font-bold ${stageColor[stage]}`}>
                  {transfers.length}
                </p>
              </div>
              <div className='flex flex-col gap-1'>
                {transfers.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-md border p-1.5 ${stageBg[stage]}`}
                  >
                    <p className='text-xs font-semibold'>{t.id}</p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {t.from} → {t.to}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {t.items} item{t.items > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className='text-muted-foreground border-t pt-3 text-xs'>
        IN_TRANSIT deducts source stock · COMPLETED updates destination WAC
      </p>
    </div>
  )
}

function TopConsumedWidget() {
  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-105'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-3/10 rounded-md p-1.5'>
          <ShoppingCart className='text-chart-3 size-4' />
        </div>
        <span className='text-sm font-medium'>Top Consumed</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          by qty · SALE movements
        </span>
      </div>

      <div className='flex flex-col gap-3'>
        {MOCK_TOP_CONSUMED.map((item, i) => (
          <div key={item.code} className='flex items-center gap-3'>
            <span
              className={`w-4 shrink-0 text-xs font-bold tabular-nums ${
                i === 0 ? 'text-chart-2' : 'text-muted-foreground'
              }`}
            >
              {i + 1}
            </span>

            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <div className='min-w-0'>
                  <span className='truncate text-xs font-medium'>
                    {item.ingredient}
                  </span>
                  <span className='text-muted-foreground ml-1.5 text-xs'>
                    {item.code}
                  </span>
                </div>
                <div className='flex shrink-0 items-center gap-1.5'>
                  {item.trend > 0 ? (
                    <TrendingUp className='size-3 text-leaf' />
                  ) : (
                    <TrendingDown className='size-3 text-red-400' />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      item.trend > 0 ? 'text-leaf' : 'text-red-500'
                    }`}
                  >
                    {item.trend > 0 ? '+' : ''}
                    {item.trend}%
                  </span>
                </div>
              </div>
              <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className='bg-chart-1 h-full rounded-full'
                  style={{ width: `${(item.qty / MAX_CONSUMED) * 100}%` }}
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>
                  {item.qty.toLocaleString()} {item.unit}
                </span>
                <span className='text-xs font-semibold tabular-nums'>
                  Rp{(item.cost / 1_000_000).toFixed(1)}Jt COGS
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MovementBreakdownChart() {
  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-1/10 rounded-md p-1.5'>
          <Package className='text-chart-1 size-4' />
        </div>
        <span className='text-sm font-medium'>Movement Breakdown</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          by qty moved
        </span>
      </div>

      <div className='h-50 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={MOCK_MOVEMENT_BREAKDOWN}
            layout='vertical'
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              type='number'
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
            <YAxis
              type='category'
              dataKey='type'
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={56}
              className='text-muted-foreground'
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(
                v: number | undefined,
                _name: string | undefined,
                entry: { payload?: { count: number } }
              ) => [
                `${(v ?? 0).toLocaleString()} units (${entry.payload?.count ?? 0} records)`,
                'Qty',
              ]}
            />
            <Bar isAnimationActive={false} dataKey='qty' radius={[0, 3, 3, 0]} maxBarSize={20}>
              {MOCK_MOVEMENT_BREAKDOWN.map((entry) => (
                <Cell key={entry.type} fill={entry.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row */}
      <div className='flex flex-wrap gap-x-4 gap-y-1.5'>
        {MOCK_MOVEMENT_BREAKDOWN.map((entry) => (
          <div key={entry.type} className='flex items-center gap-1.5'>
            <span
              className='inline-block size-2 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span className='text-muted-foreground text-xs'>
              {entry.type}
            </span>
            <span className='text-xs font-semibold'>{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LowStockAlerts() {
  const critical = MOCK_LOW_STOCK.filter((s) => s.severity === 'critical')
  const warning = MOCK_LOW_STOCK.filter((s) => s.severity === 'warning')

  return (
    <div className='bg-card flex flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-destructive/10 rounded-md p-1.5'>
          <AlertTriangle className='text-destructive size-4' />
        </div>
        <span className='text-sm font-medium'>Low Stock Alerts</span>
        <div className='ml-auto flex items-center gap-2'>
          <span className='bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-semibold'>
            {critical.length} critical
          </span>
          <span className='bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs font-semibold'>
            {warning.length} warning
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {MOCK_LOW_STOCK.map((item) => {
          const pct = item.reorder > 0 ? (item.current / item.reorder) * 100 : 0
          const isCritical = item.severity === 'critical'

          return (
            <div
              key={`${item.code}-${item.outlet}`}
              className={`flex flex-col gap-2 rounded-lg border p-3 ${
                isCritical
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-warning/30 bg-warning/5'
              }`}
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='truncate text-xs font-semibold'>
                    {item.ingredient}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {item.code} · {item.outlet}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                    isCritical
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-warning/20 text-warning'
                  }`}
                >
                  {isCritical ? 'Critical' : 'Low'}
                </span>
              </div>

              <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className={`h-full rounded-full ${isCritical ? 'bg-destructive' : 'bg-warning'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className='flex items-center justify-between text-xs'>
                <span
                  className={
                    isCritical
                      ? 'text-destructive font-semibold'
                      : 'text-warning font-semibold'
                  }
                >
                  {item.current} {item.unit} remaining
                </span>
                <span className='text-muted-foreground'>
                  Reorder at {item.reorder} {item.unit}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className='text-muted-foreground border-t pt-3 text-xs'>
        Reorder points are per-outlet (OutletInventory.reorderPoint) — master
        minimumStock is a separate threshold
      </p>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DevStockSection() {
  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <ExtendedKpiStrip />

      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <OutletInventorySnapshot />
        <TransferPipeline />
      </div>

      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <TopConsumedWidget />
        <MovementBreakdownChart />
      </div>

      <LowStockAlerts />
    </div>
  )
}
