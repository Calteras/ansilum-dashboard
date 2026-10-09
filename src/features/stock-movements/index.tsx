import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
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
import {
  useDashboardOutletsQuery,
  useStockMovementsQuery,
} from '@/features/dashboard/api/dashboard.queries'
import { StockMovementsStats } from '@/features/dashboard/components/stock-movements/stock-movements-stats'
import { StockMovementsGroupedTable } from './components/stock-movements-grouped-table'

export function StockMovementsReport() {
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const { data: movementsData, isLoading: isLoadingMovements } =
    useStockMovementsQuery(true)
  const stockMovements = movementsData?.data ?? []

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  return (
    <>
      <AppHeader />

      <Main className='w-full flex-1 space-y-4 overscroll-none p-3 sm:space-y-6 sm:p-4 md:p-6'>
        <PageHeader
          eyebrow='INVENTORY FLOW'
          title='Stock movements'
          description='Understand what is moving through your outlets and where attention is needed.'
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
                <SelectValue placeholder='Select outlet' />
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
                  : 'Select date range'}
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

        {/* Summary Cards */}
        <StockMovementsStats movements={stockMovements} />

        {/* Grouped Table */}
        <StockMovementsGroupedTable
          movements={stockMovements}
          isLoading={isLoadingMovements}
        />
      </Main>
    </>
  )
}
