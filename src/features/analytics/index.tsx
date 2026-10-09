/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useAnalyticsSummaryQuery } from './api/analytics.queries'
import { AnalyticsKpiStrip } from './components/analytics-kpi-strip'
import { AnalyticsPeakHours } from './components/analytics-peak-hours'
import { AnalyticsTopProducts } from './components/analytics-top-products'

export function Analytics() {
  const copy = useCopy()
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  const analyticsParams = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    outletId: selectedOutletId || undefined,
  }

  const { data: analyticsData, isLoading } =
    useAnalyticsSummaryQuery(analyticsParams)
  const summary = analyticsData?.data ?? null

  return (
    <>
      <AppHeader />

      <Main className='w-full flex-1 space-y-6'>
        <PageHeader
          title={copy('Pahami usaha Anda.', 'Understand your business.')}
          description={copy(
            'Lihat produk terlaris, jam ramai, dan laba pada periode yang Anda pilih.',
            'See best sellers, busy hours, and profit for your selected period.'
          )}
        />
        {/* Filters Bar */}
        <div className='bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4'>
          {/* Outlet selector */}
          {outlets.length > 0 && (
            <Select
              value={selectedOutletId}
              onValueChange={setSelectedOutletId}
            >
              <SelectTrigger className='h-9 w-[200px] text-sm'>
                <SelectValue
                  placeholder={copy('Pilih gerai', 'Select outlet')}
                />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-[280px] justify-start text-sm font-normal'
              >
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, 'dd MMM yyyy')} – ${format(dateRange.to, 'dd MMM yyyy')}`
                  : copy('Pilih periode', 'Select date range')}
                <CalendarIcon className='ml-auto size-4 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='range'
                captionLayout='dropdown'
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range)}
                disabled={(d) => d > new Date()}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* KPI Strip */}
        <AnalyticsKpiStrip kpis={summary?.kpis ?? null} isLoading={isLoading} />

        {/* Charts Row */}
        <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
          <AnalyticsTopProducts
            products={summary?.topProducts ?? []}
            isLoading={isLoading}
          />
          <AnalyticsPeakHours
            peakHours={summary?.peakHours ?? []}
            isLoading={isLoading}
          />
        </div>
      </Main>
    </>
  )
}
