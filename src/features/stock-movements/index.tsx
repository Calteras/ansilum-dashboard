import { useState } from 'react'
import { getPresetSpan, toApiDateTime, type DateSpan } from '@/lib/date-range'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataPanel } from '@/components/data-display/data-panel'
import { DateRangePicker } from '@/components/date-range-picker'
import { AlertTriangle } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { OutletSelect } from '@/components/outlet-select'
import {
  useDashboardOutletsQuery,
  useStockMovementRangeQuery,
} from '@/features/dashboard/api/dashboard.queries'
import { StockMovementsStats } from '@/features/dashboard/components/stock-movements/stock-movements-stats'
import { StockMovementsGroupedTable } from './components/stock-movements-grouped-table'

export function StockMovementsReport() {
  const [outletId, setOutletId] = useState('all')
  const [span, setSpan] = useState<DateSpan>(() => getPresetSpan('this-month'))

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  // Filtered by the server: a busy outlet records far more than one page a day.
  const { data: movementsData, isLoading: isLoadingMovements } =
    useStockMovementRangeQuery({
      outletId: outletId === 'all' ? undefined : outletId,
      startDate: toApiDateTime(span.from),
      endDate: toApiDateTime(span.to),
    })
  const stockMovements = movementsData?.data ?? []
  const isPartial =
    (movementsData?.total ?? 0) > (movementsData?.data.length ?? 0)

  return (
    <>
      <AppHeader />

      <Main className='flex w-full flex-1 flex-col gap-4 overscroll-none'>
        <PageHeader
          title='Stock movements'
          description='Purchases, sales usage, adjustments and waste by ingredient'
        />
        <ContextToolbar sticky aria-label='Filters'>
          {outlets.length > 0 && (
            <OutletSelect
              outlets={outlets}
              value={outletId}
              onValueChange={setOutletId}
              allLabel='All outlets'
            />
          )}
          <DateRangePicker value={span} onChange={setSpan} />
        </ContextToolbar>

        {isPartial && (
          <p className='text-fg-muted flex items-center gap-1.5 text-xs'>
            <AlertTriangle
              className='text-status-warning size-3.5 shrink-0'
              aria-hidden
            />
            Partial data: {movementsData?.data.length} of {movementsData?.total}{' '}
            entries loaded, so totals may be understated.
          </p>
        )}

        <DataPanel aria-label='Stock summary' className='overflow-hidden'>
          <StockMovementsStats
            movements={stockMovements}
            isLoading={isLoadingMovements}
            className='grid-cols-2 lg:grid-cols-4'
          />
        </DataPanel>

        <StockMovementsGroupedTable
          movements={stockMovements}
          isLoading={isLoadingMovements}
        />
      </Main>
    </>
  )
}
