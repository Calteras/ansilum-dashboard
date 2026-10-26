import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  formatSpan,
  getPresetSpan,
  toApiDateTime,
  type DateSpan,
} from '@/lib/date-range'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataFreshness } from '@/components/data-display/data-freshness'
import { DataPanel } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import {
  analyticsKeys,
  useAnalyticsSummaryQuery,
} from '@/features/analytics/api/analytics.queries'
import { useAssistantPageContext } from '@/features/assistant/hooks/use-assistant-page-context'
import { pageContextFor } from '@/features/assistant/model/page-context'
import { OutletMonitor } from '@/features/outlet-monitor'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import {
  dashboardKeys,
  useClosedTransactionsQuery,
  useDashboardOutletsQuery,
  useStockMovementsQuery,
  useTransactionSummaryQuery,
  useTransactionsQuery,
} from './api/dashboard.queries'
import { AnalyticsDashboardSection } from './components/overview/analytics-section'
import { PaymentMethods } from './components/sales/payment-methods'
import { SalesBreakdown } from './components/sales/sales-breakdown'
import { SalesContextBar } from './components/sales/sales-context-bar'
import { SalesExportMenu } from './components/sales/sales-export-menu'
import { SalesMetrics } from './components/sales/sales-metrics'
import { SalesTrend } from './components/sales/sales-trend'
import { CostBreakdownChart } from './components/stock-movements/cost-breakdown-chart'
import { StockMovementsChart } from './components/stock-movements/stock-movements-chart'
import { StockMovementsStats } from './components/stock-movements/stock-movements-stats'
import { StockMovementsTable } from './components/stock-movements/stock-movements-table'
import { TransactionsTable } from './components/transactions/transactions-table'
import { useSalesExport } from './hooks/use-sales-export'
import {
  getComparisonSpan,
  isComparisonAvailable,
  type ComparisonMode,
} from './utils/sales-analytics'

type DashboardTab = 'monitor' | 'overview' | 'stock-movements'

export function Dashboard() {
  const copy = useCopy()
  const queryClient = useQueryClient()
  const { data: subscriptionData } = useCurrentSubscriptionQuery()
  const [activeTab, setActiveTab] = useState<DashboardTab>('monitor')
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [span, setSpan] = useState<DateSpan>(() => getPresetSpan('this-month'))
  const [comparison, setComparison] =
    useState<ComparisonMode>('previous-period')
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsPageSize, setTransactionsPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')

  // ── Scope ──────────────────────────────────────────────────────────────────
  const outletsQuery = useDashboardOutletsQuery()
  const outlets = useMemo(
    () => outletsQuery.data?.data ?? [],
    [outletsQuery.data]
  )
  // Default to the first outlet until the merchant picks one.
  const outletId = selectedOutletId || outlets[0]?.id || ''
  const outlet = outlets.find((o) => o.id === outletId)
  useAssistantPageContext(
    activeTab === 'monitor'
      ? pageContextFor({
          title: copy('Semua outlet', 'All outlets'),
          surface: 'dashboard',
          route: '/',
          span: getPresetSpan('today'),
        })
      : pageContextFor({
          title: copy('Dasbor', 'Dashboard'),
          surface: 'dashboard',
          route: '/',
          span,
          outletId: outletId || undefined,
          outletName: outlet?.name,
        })
  )

  // A baseline that would overlap the new range falls back to the previous period.
  const activeComparison = isComparisonAvailable(span, comparison)
    ? comparison
    : 'previous-period'
  const comparisonSpan = getComparisonSpan(span, activeComparison)
  const comparisonLabel = comparisonSpan
    ? {
        'previous-period': copy('periode sebelumnya', 'previous period'),
        'previous-month': copy('bulan sebelumnya', 'previous month'),
        'previous-year': copy('tahun sebelumnya', 'previous year'),
        none: '',
      }[activeComparison]
    : null

  const rangeParams = {
    startDate: toApiDateTime(span.from),
    endDate: toApiDateTime(span.to),
  }
  const comparisonParams = {
    startDate: comparisonSpan ? toApiDateTime(comparisonSpan.from) : '',
    endDate: comparisonSpan ? toApiDateTime(comparisonSpan.to) : '',
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const summaryQuery = useTransactionSummaryQuery(outletId, rangeParams)
  const previousSummaryQuery = useTransactionSummaryQuery(
    outletId,
    comparisonParams
  )
  const seriesQuery = useClosedTransactionsQuery({ outletId, ...rangeParams })
  const comparisonSeriesQuery = useClosedTransactionsQuery(
    { outletId, ...comparisonParams },
    comparisonSpan !== null
  )

  const summary = summaryQuery.data?.data ?? null
  const previousSummary = comparisonSpan
    ? previousSummaryQuery.data?.data
    : undefined
  const series = seriesQuery.data
  const comparisonSeries = comparisonSpan
    ? comparisonSeriesQuery.data
    : undefined
  const isSummaryStale =
    summaryQuery.isPlaceholderData ||
    (comparisonSpan !== null && previousSummaryQuery.isPlaceholderData)

  const transactionsQuery = useTransactionsQuery({
    outletId,
    ...rangeParams,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    offset: (transactionsPage - 1) * transactionsPageSize,
    limit: transactionsPageSize,
  })

  const movementsQuery = useStockMovementsQuery(activeTab === 'stock-movements')
  const stockMovements = movementsQuery.data?.data ?? []

  const isFullTier = (subscriptionData?.data?.tier ?? 'BASIC') === 'FULL'
  const { data: analyticsData } = useAnalyticsSummaryQuery({
    startDate: isFullTier ? toApiDateTime(span.from) : '',
    endDate: isFullTier ? toApiDateTime(span.to) : '',
    outletId: outletId || undefined,
  })

  const salesExport = useSalesExport({
    outlet,
    span,
    statusFilter,
    summary,
    analyticsKpis: isFullTier ? (analyticsData?.data?.kpis ?? null) : null,
    topProducts: isFullTier ? (analyticsData?.data?.topProducts ?? []) : [],
  })

  const fetchingCount =
    useIsFetching({ queryKey: dashboardKeys.all }) +
    useIsFetching({ queryKey: analyticsKeys.all })
  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    void queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
  }

  const changeScope =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setTransactionsPage(1)
    }

  // ── Render ─────────────────────────────────────────────────────────────────
  const scopeMeta = (
    <>
      <span className='text-fg-secondary'>
        {outlet?.name ?? copy('Semua outlet', 'All outlets')}
      </span>
      <span aria-hidden>·</span>
      <span className='tabular-nums'>{formatSpan(span)}</span>
      {comparisonSpan && (
        <span className='tabular-nums'>vs {formatSpan(comparisonSpan)}</span>
      )}
      {summaryQuery.dataUpdatedAt > 0 && (
        <>
          <span aria-hidden>·</span>
          <DataFreshness
            updatedAt={summaryQuery.dataUpdatedAt}
            isFetching={fetchingCount > 0}
            onRefresh={refreshAll}
          />
        </>
      )}
    </>
  )

  let salesBody
  if (outletsQuery.isSuccess && outlets.length === 0) {
    salesBody = (
      <DataPanel>
        <EmptyState
          title={copy('Belum ada outlet.', 'No outlets yet.')}
          description={copy(
            'Tambahkan outlet untuk mulai mencatat penjualan.',
            'Add an outlet to start recording sales.'
          )}
          action={
            <Button
              asChild
              variant='outline'
              size='sm'
              className='h-8 px-3 text-[13px]'
            >
              <Link to='/outlets'>
                {copy('Kelola outlet', 'Manage outlets')}
              </Link>
            </Button>
          }
        />
      </DataPanel>
    )
  } else if (summaryQuery.isError && !summary) {
    salesBody = (
      <DataPanel>
        <ErrorState
          title={copy(
            'Analitik penjualan gagal dimuat.',
            'Unable to load sales analytics.'
          )}
          description={copy(
            'Periksa koneksi Anda lalu coba lagi.',
            'Check your connection and try again.'
          )}
          onRetry={refreshAll}
          isRetrying={fetchingCount > 0}
        />
      </DataPanel>
    )
  } else {
    salesBody = (
      <>
        {summaryQuery.isError && summary && (
          <p
            role='alert'
            className='border-divider bg-surface-subtle text-fg-secondary flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2 text-[13px]'
          >
            {copy(
              `Gagal memperbarui. Menampilkan data pukul ${format(summaryQuery.dataUpdatedAt, 'HH:mm')}.`,
              `Couldn't refresh. Showing data last updated at ${format(summaryQuery.dataUpdatedAt, 'HH:mm')}.`
            )}
            <Button
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-[13px]'
              onClick={refreshAll}
            >
              {copy('Coba lagi', 'Retry')}
            </Button>
          </p>
        )}

        <DataPanel
          aria-label={copy('Ringkasan penjualan', 'Sales overview')}
          className='overflow-hidden'
        >
          <SalesMetrics
            summary={summary}
            previous={previousSummary}
            comparisonLabel={comparisonLabel}
            isLoading={summaryQuery.isLoading}
            isStale={isSummaryStale}
            className='border-divider grid-cols-2 border-b lg:grid-cols-4'
          />
          <div className='grid xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]'>
            <SalesTrend
              span={span}
              comparisonSpan={comparisonSpan}
              transactions={series?.data}
              totalOrders={series?.total ?? 0}
              comparisonTransactions={comparisonSeries?.data}
              comparisonTotalOrders={comparisonSeries?.total ?? 0}
              isLoading={seriesQuery.isLoading}
              isFetching={
                seriesQuery.isFetching || comparisonSeriesQuery.isFetching
              }
              isError={seriesQuery.isError}
              onRetry={() => void seriesQuery.refetch()}
            />
            <div className='border-divider flex min-w-0 flex-col border-t xl:border-t-0 xl:border-l'>
              <PaymentMethods
                breakdown={summary?.paymentBreakdown}
                transactions={
                  series &&
                  series.data.length >= series.total &&
                  !seriesQuery.isPlaceholderData
                    ? series.data
                    : null
                }
                isLoading={summaryQuery.isLoading}
                isStale={summaryQuery.isPlaceholderData}
              />
              <SalesBreakdown
                summary={summary}
                isLoading={summaryQuery.isLoading}
                isStale={summaryQuery.isPlaceholderData}
                className='border-divider border-t'
              />
            </div>
          </div>
        </DataPanel>

        <TransactionsTable
          transactions={transactionsQuery.data?.data ?? []}
          isLoading={
            transactionsQuery.isLoading || transactionsQuery.isFetching
          }
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          currentPage={transactionsPage}
          pageSize={transactionsPageSize}
          totalRows={transactionsQuery.data?.meta?.total ?? 0}
          onPageChange={setTransactionsPage}
          onPageSizeChange={(size) => {
            setTransactionsPage(1)
            setTransactionsPageSize(size)
          }}
        />

        <AnalyticsDashboardSection span={span} outletId={outletId} />
      </>
    )
  }

  return (
    <>
      <AppHeader />

      <Main className='flex w-full flex-1 flex-col pt-0 pb-10'>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DashboardTab)}
          className='gap-0'
        >
          <div className='border-divider -mx-4 border-b px-4 sm:-mx-6 sm:px-6'>
            <TabsList
              variant='line'
              aria-label={copy('Bagian analitik', 'Analytics sections')}
            >
              <TabsTrigger value='monitor'>
                {copy('Semua outlet', 'All outlets')}
              </TabsTrigger>
              <TabsTrigger value='overview'>
                {copy('Penjualan', 'Sales')}
              </TabsTrigger>
              <TabsTrigger value='stock-movements'>
                {copy('Pergerakan stok', 'Stock movements')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='monitor' className='flex flex-col gap-4 pt-6'>
            <OutletMonitor
              onOpenOutlet={(id) => {
                changeScope(setSelectedOutletId)(id)
                setActiveTab('overview')
              }}
            />
          </TabsContent>

          <TabsContent value='overview' className='flex flex-col gap-4 pt-6'>
            <PageHeader
              title={copy('Analitik penjualan', 'Sales analytics')}
              meta={scopeMeta}
            />
            <SalesContextBar
              outlets={outlets}
              outletId={outletId}
              onOutletChange={changeScope(setSelectedOutletId)}
              span={span}
              onSpanChange={changeScope(setSpan)}
              comparison={activeComparison}
              onComparisonChange={setComparison}
              actions={
                <SalesExportMenu
                  exporting={salesExport.exporting}
                  disabled={!salesExport.canExport}
                  onExport={salesExport.run}
                />
              }
            />
            {salesBody}
          </TabsContent>

          <TabsContent
            value='stock-movements'
            className='flex flex-col gap-4 pt-6'
          >
            <PageHeader
              title={copy('Pergerakan stok', 'Stock movements')}
              meta={
                <>
                  <span className='text-fg-secondary'>
                    {copy('Semua outlet', 'All outlets')}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{copy('Semua catatan', 'All recorded entries')}</span>
                  {movementsQuery.dataUpdatedAt > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <DataFreshness
                        updatedAt={movementsQuery.dataUpdatedAt}
                        isFetching={movementsQuery.isFetching}
                        onRefresh={() => void movementsQuery.refetch()}
                      />
                    </>
                  )}
                </>
              }
            />
            <DataPanel className='overflow-hidden'>
              <StockMovementsStats
                movements={stockMovements}
                isLoading={movementsQuery.isLoading}
                className='border-divider grid-cols-2 border-b lg:grid-cols-4'
              />
              <div className='grid xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]'>
                <CostBreakdownChart movements={stockMovements} />
                <StockMovementsChart
                  movements={stockMovements}
                  className='border-divider border-t xl:border-t-0 xl:border-l'
                />
              </div>
            </DataPanel>
            <StockMovementsTable
              movements={stockMovements}
              isLoading={movementsQuery.isLoading}
            />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
