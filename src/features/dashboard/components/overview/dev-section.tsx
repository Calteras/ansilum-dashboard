/**
 * DEV-ONLY: Enhanced Overview Section
 *
 * Rendered exclusively when import.meta.env.DEV === true.
 * All data here is hardcoded mock — this is a feature-direction preview
 * for the real implementation that will follow.
 *
 * Planned features surfaced here:
 *  - Extended KPI strip (profit, margin, items sold, repeat rate, alerts)
 *  - Top Products ranking widget
 *  - Peak Hours bar chart
 *  - Customer Insights mini-cards
 *  - Business Goals progress tracker
 */
import {
  TrendingUp,
  TrendingDown,
  Percent,
  ShoppingBag,
  Users,
  UserPlus,
  RotateCcw,
  AlertTriangle,
  Clock,
  Target,
  Star,
  ChartBar,
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
    label: 'Gross Profit',
    value: 'Rp 28,4 Jt',
    sub: '+18% vs last period',
    positive: true,
    icon: TrendingUp,
    color: 'text-chart-4',
    bg: 'bg-chart-4/10',
  },
  {
    label: 'Profit Margin',
    value: '62.3%',
    sub: '+3.1 pts vs last period',
    positive: true,
    icon: Percent,
    color: 'text-chart-2',
    bg: 'bg-chart-2/10',
  },
  {
    label: 'Items Sold',
    value: '1,847',
    sub: '+234 vs last period',
    positive: true,
    icon: ShoppingBag,
    color: 'text-chart-1',
    bg: 'bg-chart-1/10',
  },
  {
    label: 'Repeat Rate',
    value: '68%',
    sub: '-2% vs last period',
    positive: false,
    icon: RotateCcw,
    color: 'text-chart-3',
    bg: 'bg-chart-3/10',
  },
  {
    label: 'Low Stock Alerts',
    value: '3 items',
    sub: 'Action required',
    positive: false,
    icon: AlertTriangle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    label: 'Pending Orders',
    value: '5',
    sub: 'Awaiting processing',
    positive: null,
    icon: Clock,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
]

const MOCK_TOP_PRODUCTS = [
  {
    rank: 1,
    name: 'Espresso',
    category: 'Beverages',
    sold: 342,
    revenue: 5_130_000,
    trend: 12,
  },
  {
    rank: 2,
    name: 'Cappuccino',
    category: 'Beverages',
    sold: 287,
    revenue: 5_740_000,
    trend: 8,
  },
  {
    rank: 3,
    name: 'Croissant',
    category: 'Food',
    sold: 198,
    revenue: 2_970_000,
    trend: -4,
  },
  {
    rank: 4,
    name: 'Caffe Latte',
    category: 'Beverages',
    sold: 176,
    revenue: 4_400_000,
    trend: 21,
  },
  {
    rank: 5,
    name: 'Americano',
    category: 'Beverages',
    sold: 154,
    revenue: 2_310_000,
    trend: 3,
  },
]

const MAX_SOLD = MOCK_TOP_PRODUCTS[0].sold

const MOCK_PEAK_HOURS = [
  { hour: '7AM', orders: 12 },
  { hour: '8AM', orders: 45 },
  { hour: '9AM', orders: 78 },
  { hour: '10AM', orders: 56 },
  { hour: '11AM', orders: 34 },
  { hour: '12PM', orders: 89 },
  { hour: '1PM', orders: 102 },
  { hour: '2PM', orders: 67 },
  { hour: '3PM', orders: 43 },
  { hour: '4PM', orders: 55 },
  { hour: '5PM', orders: 71 },
  { hour: '6PM', orders: 48 },
  { hour: '7PM', orders: 38 },
  { hour: '8PM', orders: 22 },
]

const PEAK_MAX = Math.max(...MOCK_PEAK_HOURS.map((h) => h.orders))

const MOCK_CUSTOMER = {
  total: 1_234,
  newThisMonth: 87,
  returningRate: 68,
  avgFrequency: 2.4,
  npsScore: 72,
}

const MOCK_GOALS = [
  {
    label: 'Monthly Revenue',
    current: 45_600_000,
    target: 60_000_000,
    fmt: (v: number) => `Rp${(v / 1_000_000).toFixed(1)}Jt`,
  },
  {
    label: 'Daily Orders',
    current: 67,
    target: 80,
    fmt: (v: number) => `${v}`,
  },
  {
    label: 'New Customers',
    current: 87,
    target: 100,
    fmt: (v: number) => `${v}`,
  },
  {
    label: 'Avg Rating',
    current: 4.6,
    target: 5.0,
    fmt: (v: number) => `${v.toFixed(1)} ★`,
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────


function ExtraKpiStrip() {
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

function TopProductsWidget() {
  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-105'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-1/10 rounded-md p-1.5'>
          <Star className='text-chart-2 size-4' />
        </div>
        <span className='text-sm font-medium'>Top Products</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          by revenue
        </span>
      </div>

      <div className='flex flex-col gap-3'>
        {MOCK_TOP_PRODUCTS.map((p) => (
          <div key={p.name} className='flex items-center gap-3'>
            {/* Rank */}
            <span
              className={`w-4 shrink-0 text-xs font-bold tabular-nums ${
                p.rank === 1 ? 'text-chart-2' : 'text-muted-foreground'
              }`}
            >
              {p.rank}
            </span>

            {/* Info + bar */}
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate text-xs font-medium'>{p.name}</span>
                <div className='flex shrink-0 items-center gap-1.5'>
                  {p.trend > 0 ? (
                    <TrendingUp className='size-3 text-leaf' />
                  ) : (
                    <TrendingDown className='size-3 text-red-400' />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      p.trend > 0 ? 'text-leaf' : 'text-red-500'
                    }`}
                  >
                    {p.trend > 0 ? '+' : ''}
                    {p.trend}%
                  </span>
                </div>
              </div>
              {/* Relative bar */}
              <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                <div
                  className='bg-chart-1 h-full rounded-full transition-colors'
                  style={{ width: `${(p.sold / MAX_SOLD) * 100}%` }}
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>
                  {p.category} · {p.sold} sold
                </span>
                <span className='text-xs font-semibold tabular-nums'>
                  Rp{(p.revenue / 1_000_000).toFixed(1)}Jt
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PeakHoursChart() {
  return (
    <div className='bg-card flex flex-1 flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-3/10 rounded-md p-1.5'>
          <ChartBar className='text-chart-3 size-4' />
        </div>
        <span className='text-sm font-medium'>Peak Hours</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          orders per hour
        </span>
      </div>

      <div className='h-45 w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={MOCK_PEAK_HOURS}
            margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          >
            <XAxis
              dataKey='hour'
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(v: number | undefined) => [v ?? 0, 'Orders']}
            />
            <Bar isAnimationActive={false} dataKey='orders' radius={[3, 3, 0, 0]}>
              {MOCK_PEAK_HOURS.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={
                    entry.orders === PEAK_MAX
                      ? 'var(--chart-3)'
                      : entry.orders >= PEAK_MAX * 0.7
                        ? 'var(--chart-1)'
                        : 'var(--chart-4)'
                  }
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className='flex items-center gap-4 text-xs'>
        <div className='flex items-center gap-1.5'>
          <span className='bg-chart-3 inline-block size-2 rounded-full' />
          <span className='text-muted-foreground'>Peak</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='bg-chart-1 inline-block size-2 rounded-full' />
          <span className='text-muted-foreground'>High</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='bg-chart-4 inline-block size-2 rounded-full' />
          <span className='text-muted-foreground'>Normal</span>
        </div>
      </div>
    </div>
  )
}

function CustomerInsights() {
  const cards = [
    {
      label: 'Total Customers',
      value: MOCK_CUSTOMER.total.toLocaleString(),
      icon: Users,
      color: 'text-chart-5',
      bg: 'bg-chart-5/10',
    },
    {
      label: 'New This Month',
      value: MOCK_CUSTOMER.newThisMonth.toString(),
      icon: UserPlus,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
    {
      label: 'Avg Frequency',
      value: `${MOCK_CUSTOMER.avgFrequency}× / mo`,
      icon: RotateCcw,
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
  ]

  return (
    <div className='bg-card flex flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-5/10 rounded-md p-1.5'>
          <Users className='text-chart-5 size-4' />
        </div>
        <span className='text-sm font-medium'>Customer Insights</span>
        <span className='bg-chart-4/10 text-chart-4 ml-auto rounded-full px-2 py-0.5 text-xs font-semibold'>
          NPS {MOCK_CUSTOMER.npsScore}
        </span>
      </div>

      <div className='grid grid-cols-3 gap-3'>
        {cards.map((c) => (
          <div
            key={c.label}
            className='bg-muted/50 flex flex-col gap-2 rounded-lg p-3'
          >
            <div className={`w-fit rounded-md p-1.5 ${c.bg}`}>
              <c.icon className={`size-3.5 ${c.color}`} />
            </div>
            <p className='text-base leading-tight font-bold'>{c.value}</p>
            <p className='text-muted-foreground text-xs leading-snug'>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Returning rate bar */}
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>Returning customers</span>
          <span className='font-semibold'>{MOCK_CUSTOMER.returningRate}%</span>
        </div>
        <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
          <div
            className='bg-chart-4 h-full rounded-full'
            style={{ width: `${MOCK_CUSTOMER.returningRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function BusinessGoals() {
  return (
    <div className='bg-card flex flex-col gap-4 rounded-xl border p-4 sm:p-5'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-2/10 rounded-md p-1.5'>
          <Target className='text-chart-2 size-4' />
        </div>
        <span className='text-sm font-medium'>Business Goals</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          This month
        </span>
      </div>

      <div className='flex flex-col gap-4'>
        {MOCK_GOALS.map((g) => {
          const pct = Math.min((g.current / g.target) * 100, 100)
          const isAchieved = pct >= 100

          return (
            <div key={g.label} className='space-y-1.5'>
              <div className='flex items-center justify-between gap-2 text-xs'>
                <span className='text-muted-foreground'>{g.label}</span>
                <div className='flex items-center gap-1.5'>
                  <span className='font-semibold tabular-nums'>
                    {g.fmt(g.current)}
                  </span>
                  <span className='text-muted-foreground'>
                    / {g.fmt(g.target)}
                  </span>
                  {isAchieved && (
                    <span className='rounded-full bg-leaf/10 px-1.5 py-0.5 text-xs font-bold text-leaf'>
                      ✓
                    </span>
                  )}
                </div>
              </div>
              <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                <div
                  className={`h-full rounded-full transition-colors ${
                    isAchieved
                      ? 'bg-leaf'
                      : pct >= 70
                        ? 'bg-chart-2'
                        : pct >= 40
                          ? 'bg-chart-1'
                          : 'bg-chart-3'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className='text-muted-foreground text-xs'>
                {pct.toFixed(0)}% of target
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DevOverviewSection() {
  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <ExtraKpiStrip />

      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <TopProductsWidget />
        <PeakHoursChart />
      </div>

      <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
        <CustomerInsights />
        <BusinessGoals />
      </div>
    </div>
  )
}
