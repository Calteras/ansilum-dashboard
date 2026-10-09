import { useState } from 'react'
import {
  BarChart2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LineChartIcon,
  TrendingUp,
  Calendar,
  Grid3X3,
  RefreshCw,
  Check,
} from '@/components/icons'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

const fullYearData = [
  { month: 'Jan', thisYear: 38000, prevYear: 32000 },
  { month: 'Feb', thisYear: 42000, prevYear: 38000 },
  { month: 'Mar', thisYear: 51500, prevYear: 37000 },
  { month: 'Apr', thisYear: 47000, prevYear: 31000 },
  { month: 'May', thisYear: 49000, prevYear: 35000 },
  { month: 'Jun', thisYear: 45000, prevYear: 33000 },
  { month: 'Jul', thisYear: 52000, prevYear: 36000 },
  { month: 'Aug', thisYear: 48000, prevYear: 34000 },
  { month: 'Sep', thisYear: 55000, prevYear: 39000 },
  { month: 'Oct', thisYear: 61000, prevYear: 42000 },
  { month: 'Nov', thisYear: 58000, prevYear: 40000 },
  { month: 'Dec', thisYear: 64000, prevYear: 45000 },
]

type ChartType = 'bar' | 'line' | 'area'
type TimePeriod = '3months' | '6months' | 'year' | 'q1' | 'q2' | 'q3' | 'q4'

const periodLabels: Record<TimePeriod, string> = {
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  year: 'Full Year',
  q1: 'Q1 (Jan-Mar)',
  q2: 'Q2 (Apr-Jun)',
  q3: 'Q3 (Jul-Sep)',
  q4: 'Q4 (Oct-Dec)',
}

const insights = [
  'March is the highest revenue for the last 6 months with $51,500',
  'April shows strong growth compared to previous year',
  'Consistent revenue increase throughout the period',
  'Q1 total: $131,500 - up 15% year over year',
]

function getDataForPeriod(period: TimePeriod) {
  switch (period) {
    case '3months':
      return fullYearData.slice(-3)
    case '6months':
      return fullYearData.slice(0, 6)
    case 'q1':
      return fullYearData.slice(0, 3)
    case 'q2':
      return fullYearData.slice(3, 6)
    case 'q3':
      return fullYearData.slice(6, 9)
    case 'q4':
      return fullYearData.slice(9, 12)
    default:
      return fullYearData
  }
}

interface PayloadItem {
  dataKey: string
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const thisYear =
    (payload as PayloadItem[]).find((p) => p.dataKey === 'thisYear')?.value || 0
  const prevYear =
    (payload as PayloadItem[]).find((p) => p.dataKey === 'prevYear')?.value || 0
  const diff = Number(thisYear) - Number(prevYear)
  const percentage = prevYear ? Math.round((diff / Number(prevYear)) * 100) : 0

  return (
    <div className='bg-popover border-border rounded-lg border p-2 shadow-none sm:p-3'>
      <p className='text-foreground mb-1.5 text-xs font-medium sm:mb-2 sm:text-sm'>
        {label}, 2024
      </p>
      <div className='space-y-1 sm:space-y-1.5'>
        <div className='flex items-center gap-1.5 sm:gap-2'>
          <div
            className='size-2 rounded-full sm:size-2.5'
            style={{ background: '#6e3ff3' }}
          />
          <span className='text-muted-foreground text-xs sm:text-sm'>
            This Year:
          </span>
          <span className='text-foreground text-xs font-medium sm:text-sm'>
            ${Number(thisYear).toLocaleString()}
          </span>
        </div>
        <div className='flex items-center gap-1.5 sm:gap-2'>
          <div
            className='size-2 rounded-full sm:size-2.5'
            style={{ background: '#e255f2' }}
          />
          <span className='text-muted-foreground text-xs sm:text-sm'>
            Prev Year:
          </span>
          <span className='text-foreground text-xs font-medium sm:text-sm'>
            ${Number(prevYear).toLocaleString()}
          </span>
        </div>
        <div className='border-border mt-1 border-t pt-1'>
          <span
            className={`text-xs font-medium sm:text-xs ${
              diff >= 0 ? 'text-leaf' : 'text-red-500'
            }`}
          >
            {diff >= 0 ? '+' : ''}
            {percentage}% vs last year
          </span>
        </div>
      </div>
    </div>
  )
}

export function RevenueFlowChart() {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [period, setPeriod] = useState<TimePeriod>('6months')
  const [showGrid, setShowGrid] = useState(true)
  const [showThisYear, setShowThisYear] = useState(true)
  const [showPrevYear, setShowPrevYear] = useState(true)
  const [smoothCurve, setSmoothCurve] = useState(true)
  const [currentInsight, setCurrentInsight] = useState(0)

  const axisColor = '#71717a'
  const gridColor = '#27272a'

  const chartData = getDataForPeriod(period)
  const totalRevenue = chartData.reduce((acc, item) => acc + item.thisYear, 0)

  return (
    <div className='bg-card flex min-w-0 flex-1 flex-col gap-4 rounded-xl border p-4 sm:gap-6 sm:p-6'>
      <div className='flex flex-wrap items-center gap-2 sm:gap-4'>
        <div className='flex flex-1 items-center gap-2 sm:gap-2.5'>
          <Button variant='outline' size='icon' className='size-7 sm:size-8'>
            <BarChart2 className='text-muted-foreground size-4 sm:size-[18px]' />
          </Button>
          <span className='text-sm font-medium sm:text-base'>Revenue Flow</span>
        </div>
        <div className='hidden items-center gap-3 sm:flex sm:gap-5'>
          <div className='flex items-center gap-1.5'>
            <div className='size-2.5 rounded-full bg-[#6e3ff3] sm:size-3' />
            <span className='text-muted-foreground text-xs sm:text-xs'>
              This Year
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='size-2.5 rounded-full bg-[#e255f2] sm:size-3' />
            <span className='text-muted-foreground text-xs sm:text-xs'>
              Prev Year
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='size-7 sm:size-8'>
              <MoreHorizontal className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel>Chart Options</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <BarChart3 className='mr-2 size-4' />
                Chart Type
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType('bar')}>
                  <BarChart3 className='mr-2 size-4' />
                  Bar Chart
                  {chartType === 'bar' && <Check className='ml-auto size-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('line')}>
                  <LineChartIcon className='mr-2 size-4' />
                  Line Chart
                  {chartType === 'line' && <Check className='ml-auto size-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('area')}>
                  <TrendingUp className='mr-2 size-4' />
                  Area Chart
                  {chartType === 'area' && <Check className='ml-auto size-4' />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Calendar className='mr-2 size-4' />
                Time Period
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(periodLabels) as TimePeriod[]).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => setPeriod(key)}>
                    {periodLabels[key]}
                    {period === key && <Check className='ml-auto size-4' />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
            >
              <Grid3X3 className='mr-2 size-4' />
              Show Grid Lines
            </DropdownMenuCheckboxItem>

            {(chartType === 'line' || chartType === 'area') && (
              <DropdownMenuCheckboxItem
                checked={smoothCurve}
                onCheckedChange={setSmoothCurve}
              >
                <TrendingUp className='mr-2 size-4' />
                Smooth Curve
              </DropdownMenuCheckboxItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className='text-xs'>
              Data Series
            </DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={showThisYear}
              onCheckedChange={setShowThisYear}
            >
              <div
                className='mr-2 size-3 rounded-full'
                style={{ background: '#6e3ff3' }}
              />
              Show This Year
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={showPrevYear}
              onCheckedChange={setShowPrevYear}
            >
              <div
                className='mr-2 size-3 rounded-full'
                style={{ background: '#e255f2' }}
              />
              Show Prev Year
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                setChartType('bar')
                setPeriod('6months')
                setShowGrid(true)
                setShowThisYear(true)
                setShowPrevYear(true)
                setSmoothCurve(true)
              }}
            >
              <RefreshCw className='mr-2 size-4' />
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-10'>
        <div className='flex w-full shrink-0 flex-col gap-4 lg:w-[200px] xl:w-[220px]'>
          <div className='space-y-2 sm:space-y-4'>
            <p className='text-xl leading-tight font-semibold tracking-tight sm:text-2xl lg:text-[28px]'>
              ${totalRevenue.toLocaleString()}
            </p>
            <p className='text-muted-foreground text-xs sm:text-sm'>
              Total Revenue ({periodLabels[period]})
            </p>
          </div>

          <div className='bg-muted/50 space-y-3 rounded-lg p-3 sm:space-y-4 sm:p-4'>
            <p className='text-xs font-semibold sm:text-sm'>
              🏆 Best Performing Month
            </p>
            <p className='text-muted-foreground text-xs leading-relaxed sm:text-xs'>
              {insights[currentInsight]}
            </p>
            <div className='flex items-center gap-2.5 sm:gap-3.5'>
              <ChevronLeft
                className='text-muted-foreground hover:text-foreground size-3 cursor-pointer transition-colors sm:size-3.5'
                onClick={() =>
                  setCurrentInsight((prev) =>
                    prev === 0 ? insights.length - 1 : prev - 1
                  )
                }
              />
              <div className='flex flex-1 items-center gap-1'>
                {insights.map((_, index) => (
                  <div
                    key={index}
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      index === currentInsight
                        ? 'bg-foreground'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <ChevronRight
                className='text-muted-foreground hover:text-foreground size-3 cursor-pointer transition-colors sm:size-3.5'
                onClick={() =>
                  setCurrentInsight((prev) =>
                    prev === insights.length - 1 ? 0 : prev + 1
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className='h-[180px] min-w-0 flex-1 sm:h-[200px] lg:h-[240px]'>
          <ResponsiveContainer width='100%' height='100%'>
            {chartType === 'bar' ? (
              <BarChart data={chartData} barGap={2}>
                <defs>
                  <linearGradient
                    id='thisYearGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='0%' stopColor='#6e3ff3' stopOpacity={1} />
                    <stop offset='100%' stopColor='#6e3ff3' stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient
                    id='prevYearGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='0%' stopColor='#e255f2' stopOpacity={1} />
                    <stop offset='100%' stopColor='#e255f2' stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray='0'
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey='month'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dx={-5}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: '#27272a', radius: 4 }}
                />
                {showThisYear && (
                  <Bar isAnimationActive={false}
                    dataKey='thisYear'
                    fill='url(#thisYearGradient)'
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                  />
                )}
                {showPrevYear && (
                  <Bar isAnimationActive={false}
                    dataKey='prevYear'
                    fill='url(#prevYearGradient)'
                    radius={[4, 4, 0, 0]}
                    maxBarSize={18}
                  />
                )}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData}>
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray='0'
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey='month'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dx={-5}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#52525b' }}
                />
                {showThisYear && (
                  <Line isAnimationActive={false}
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey='thisYear'
                    stroke='#6e3ff3'
                    strokeWidth={2}
                    dot={{ fill: '#6e3ff3', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#6e3ff3' }}
                  />
                )}
                {showPrevYear && (
                  <Line isAnimationActive={false}
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey='prevYear'
                    stroke='#e255f2'
                    strokeWidth={2}
                    dot={{ fill: '#e255f2', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#e255f2' }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id='thisYearAreaGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='0%' stopColor='#6e3ff3' stopOpacity={0.3} />
                    <stop
                      offset='100%'
                      stopColor='#6e3ff3'
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id='prevYearAreaGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='0%' stopColor='#e255f2' stopOpacity={0.3} />
                    <stop
                      offset='100%'
                      stopColor='#e255f2'
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray='0'
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey='month'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dx={-5}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#52525b' }}
                />
                {showThisYear && (
                  <Area isAnimationActive={false}
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey='thisYear'
                    stroke='#6e3ff3'
                    strokeWidth={2}
                    fill='url(#thisYearAreaGradient)'
                  />
                )}
                {showPrevYear && (
                  <Area isAnimationActive={false}
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey='prevYear'
                    stroke='#e255f2'
                    strokeWidth={2}
                    fill='url(#prevYearAreaGradient)'
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
