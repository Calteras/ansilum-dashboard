import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { getPresetSpan, type DateSpan } from '@/lib/date-range'
import { useCopy } from '@/hooks/use-copy'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataPanel } from '@/components/data-display/data-panel'
import { DateRangePicker } from '@/components/date-range-picker'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { OutletSelect } from '@/components/outlet-select'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useAnalyticsSummaryQuery } from './api/analytics.queries'
import { AnalyticsKpiStrip } from './components/analytics-kpi-strip'
import { AnalyticsPeakHours } from './components/analytics-peak-hours'
import { AnalyticsTopProducts } from './components/analytics-top-products'

export function Analytics() {
  const copy = useCopy()
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [span, setSpan] = useState<DateSpan>(() => getPresetSpan('this-month'))

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = useMemo(() => outletsData?.data ?? [], [outletsData])
  // Default to the first outlet until the merchant picks one.
  const outletId = selectedOutletId || outlets[0]?.id || ''

  const analyticsParams = {
    startDate: format(span.from, 'yyyy-MM-dd'),
    endDate: format(span.to, 'yyyy-MM-dd'),
    outletId: outletId || undefined,
  }

  const { data: analyticsData, isLoading } =
    useAnalyticsSummaryQuery(analyticsParams)
  const summary = analyticsData?.data ?? null

  return (
    <>
      <AppHeader />

      <Main className='flex w-full flex-1 flex-col gap-4'>
        <PageHeader
          title={copy('Analitik', 'Analytics')}
          description={copy(
            'Produk terlaris, jam ramai, dan laba untuk periode yang dipilih',
            'Top products, busy hours and profit for the selected period'
          )}
        />
        <ContextToolbar sticky aria-label={copy('Cakupan data', 'Data scope')}>
          {outlets.length > 0 && (
            <OutletSelect
              outlets={outlets}
              value={outletId}
              onValueChange={setSelectedOutletId}
            />
          )}
          <DateRangePicker value={span} onChange={setSpan} />
        </ContextToolbar>

        <DataPanel className='overflow-hidden'>
          <AnalyticsKpiStrip
            kpis={summary?.kpis ?? null}
            isLoading={isLoading}
            className='border-divider border-b'
          />
          <div className='grid xl:grid-cols-2'>
            <AnalyticsTopProducts
              products={summary?.topProducts ?? []}
              isLoading={isLoading}
            />
            <AnalyticsPeakHours
              peakHours={summary?.peakHours ?? []}
              isLoading={isLoading}
              className='border-divider border-t xl:border-t-0 xl:border-l'
            />
          </div>
        </DataPanel>
      </Main>
    </>
  )
}
