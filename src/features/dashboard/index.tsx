import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { formatCompactMoney } from '@/lib/format'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, FileDown } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useAnalyticsSummaryQuery } from '@/features/analytics/api/analytics.queries'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import { listTransactionsApi } from './api/dashboard.api'
// Query hooks
import {
  useDashboardOutletsQuery,
  useTransactionSummaryQuery,
  useTransactionsQuery,
  useStockMovementsQuery,
} from './api/dashboard.queries'
// Analytics section (live data for FULL tier, locked mock for others)
import { AnalyticsDashboardSection } from './components/overview/analytics-section'
import { CostBreakdownChart } from './components/stock-movements/cost-breakdown-chart'
import { StockMovementsChart } from './components/stock-movements/stock-movements-chart'
// Stock Movements components
import { StockMovementsStats } from './components/stock-movements/stock-movements-stats'
import { StockMovementsTable } from './components/stock-movements/stock-movements-table'
import { PaymentBreakdownChart } from './components/transactions/payment-breakdown-chart'
import { SalesTrendChart } from './components/transactions/sales-trend-chart'
// Transaction components
import { TransactionStats } from './components/transactions/transaction-stats'
import { TransactionsTable } from './components/transactions/transactions-table'
import { buildDashboardPdf } from './utils/pdf-report'

type DashboardTab = 'overview' | 'stock-movements'

export function Dashboard() {
  const { t } = useTranslation()
  const copy = useCopy()
  const { data: subscriptionData } = useCurrentSubscriptionQuery()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsPageSize, setTransactionsPageSize] = useState(10)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Queries
  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = useMemo(() => outletsData?.data ?? [], [outletsData])

  const summaryParams = {
    startDate: dateRange.from
      ? format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss")
      : '',
    endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'HH:mm:ss") : '',
  }

  const { data: summaryData, isLoading: isLoadingSummary } =
    useTransactionSummaryQuery(selectedOutletId, summaryParams)
  const transactionSummary = summaryData?.data ?? null

  const isFullTier = (subscriptionData?.data?.tier ?? 'BASIC') === 'FULL'

  const analyticsParams = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    outletId: selectedOutletId || undefined,
  }

  const { data: analyticsData } = useAnalyticsSummaryQuery({
    ...analyticsParams,
    startDate: isFullTier ? analyticsParams.startDate : '',
    endDate: isFullTier ? analyticsParams.endDate : '',
  })

  const analyticsKpis = isFullTier ? (analyticsData?.data?.kpis ?? null) : null

  const topProducts = isFullTier ? (analyticsData?.data?.topProducts ?? []) : []

  const transactionParams = {
    outletId: selectedOutletId,
    startDate: summaryParams.startDate,
    endDate: summaryParams.endDate,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    offset: (transactionsPage - 1) * transactionsPageSize,
    limit: transactionsPageSize,
  }

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
  } = useTransactionsQuery(transactionParams)
  const transactions = transactionsData?.data ?? []
  const transactionsMeta = transactionsData?.meta

  const { data: movementsData, isLoading: isLoadingMovements } =
    useStockMovementsQuery(activeTab === 'stock-movements')
  const stockMovements = movementsData?.data ?? []

  const fmtCurrencyShort = (value: number | null | undefined) =>
    value == null ? '—' : formatCompactMoney(value)
  const selectedOutletName =
    outlets.find((outlet) => outlet.id === selectedOutletId)?.name ??
    copy('semua outlet', 'all outlets')
  const periodLabel =
    dateRange.from && dateRange.to
      ? `${format(dateRange.from, 'dd MMM')} — ${format(dateRange.to, 'dd MMM yyyy')}`
      : copy('Periode belum dipilih', 'No period selected')
  const netSalesShare =
    transactionSummary && transactionSummary.totalSales > 0
      ? Math.round(
          (transactionSummary.netSales / transactionSummary.totalSales) * 100
        )
      : 0

  // Auto-select first outlet when outlets load
  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  // Reset to first page when transaction filters change
  useEffect(() => {
    setTransactionsPage(1)
  }, [
    selectedOutletId,
    summaryParams.startDate,
    summaryParams.endDate,
    statusFilter,
  ])

  const exportLabel = String(
    t('dashboard.actions.exportPdf' as never) ?? 'Export PDF'
  )

  const loadingLabel = String(t('common.loading' as never) ?? 'Loading...')

  return (
    <>
      {/* ===== Top Heading ===== */}
      <AppHeader />

      {/* ===== Main ===== */}
      <Main className='w-full flex-1 space-y-8 bg-[radial-gradient(circle_at_92%_0%,var(--brand-soft),transparent_28rem)]'>
        <PageHeader
          eyebrow={copy('RINGKASAN OPERASIONAL', 'OPERATIONS BRIEF')}
          title={copy('Selamat datang kembali.', 'Welcome back.')}
          description={copy(
            `Berikut ritme bisnis ${selectedOutletName} untuk ${periodLabel.toLowerCase()}.`,
            `Here is the rhythm of ${selectedOutletName} for ${periodLabel.toLowerCase()}.`
          )}
          actions={
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as DashboardTab)}
            >
              <TabsList
                aria-label={copy('Tampilan ringkasan', 'Dashboard views')}
                className='bg-card/80 rounded-full border p-1'
              >
                <TabsTrigger className='rounded-full px-4' value='overview'>
                  {copy('Penjualan', 'Sales')}
                </TabsTrigger>
                <TabsTrigger
                  className='rounded-full px-4'
                  value='stock-movements'
                >
                  {t('dashboard.tabs.stockMovements')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        {activeTab === 'overview' && (
          <>
            <div className='bg-card/80 flex flex-wrap items-center gap-3 rounded-2xl border p-3 shadow-[0_12px_40px_-28px_var(--brand-ink)] sm:p-4'>
              {/* Outlet selector */}
              {outlets.length > 0 && (
                <Select
                  value={selectedOutletId}
                  onValueChange={setSelectedOutletId}
                >
                  <SelectTrigger className='h-9 w-50 text-sm'>
                    <SelectValue
                      placeholder={t('dashboard.filters.selectOutlet')}
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
                    className='h-11 w-full justify-start rounded-xl text-sm font-normal sm:w-auto'
                  >
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'dd MMM yyyy')} – ${format(dateRange.to, 'dd MMM yyyy')}`
                      : t('dashboard.filters.selectDateRange')}
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

              <Button
                variant='outline'
                size='sm'
                className='ml-auto flex h-11 items-center gap-2 rounded-xl'
                disabled={
                  isExportingPdf ||
                  !selectedOutletId ||
                  !summaryParams.startDate ||
                  !summaryParams.endDate
                }
                onClick={async () => {
                  setIsExportingPdf(true)
                  try {
                    const outletName =
                      outlets.find((o) => o.id === selectedOutletId)?.name ??
                      t('dashboard.filters.selectOutlet')
                    const dateRangeLabel = `${format(dateRange.from!, 'dd MMM yyyy')} – ${format(dateRange.to!, 'dd MMM yyyy')}`
                    const statusLabelMap: Record<string, string> = {
                      OPEN: t('dashboard.transactionsTable.statusOpen'),
                      PENDING: t('dashboard.transactionsTable.statusPending'),
                      CLOSED: t('dashboard.transactionsTable.statusClosed'),
                      VOIDED: t('dashboard.transactionsTable.statusVoided'),
                    }
                    const statusLabel =
                      statusFilter === 'all'
                        ? t('dashboard.transactionsTable.allStatus')
                        : (statusLabelMap[statusFilter] ?? statusFilter)

                    const itemsCogsData = analyticsKpis
                      ? {
                          totalRevenue: fmtCurrencyShort(
                            analyticsKpis.totalRevenue
                          ),
                          transactions: `${analyticsKpis.totalTransactions} transactions`,
                          grossProfit: fmtCurrencyShort(
                            analyticsKpis.grossProfit
                          ),
                          cogs: fmtCurrencyShort(analyticsKpis.totalCOGS),
                          profitMargin: `${analyticsKpis.profitMargin.toFixed(1)}%`,
                          profitMarginNote: 'of total revenue',
                          itemsSold: `${analyticsKpis.itemsSold.toLocaleString('id-ID')} items`,
                          ordersNote: `across ${analyticsKpis.totalTransactions} orders`,
                          uniqueCustomers:
                            analyticsKpis.totalUniqueCustomers.toLocaleString(
                              'id-ID'
                            ),
                          returned: `${analyticsKpis.repeatCustomers.toLocaleString('id-ID')} returned`,
                          repeatRate: `${analyticsKpis.repeatRate.toFixed(1)}%`,
                          pendingOrders: `${analyticsKpis.pendingOrders} pending orders`,
                          topProducts: topProducts.map((p) => ({
                            name: p.name,
                            revenue: fmtCurrencyShort(p.revenue),
                            sold: `${p.quantity} sold`,
                          })),
                        }
                      : undefined

                    const allTransactions: typeof transactions = []
                    const pageLimit = 200
                    let offset = 0
                    let total = Number.POSITIVE_INFINITY
                    // Fetch all pages sequentially to include every row
                    while (allTransactions.length < total) {
                      const page = await listTransactionsApi({
                        outletId: selectedOutletId,
                        startDate: summaryParams.startDate,
                        endDate: summaryParams.endDate,
                        status:
                          statusFilter !== 'all' ? statusFilter : undefined,
                        offset,
                        limit: pageLimit,
                      })
                      allTransactions.push(...page.data)
                      total = page.meta?.total ?? allTransactions.length
                      offset =
                        (page.meta?.offset ?? offset) +
                        (page.meta?.limit ?? pageLimit)
                    }

                    buildDashboardPdf({
                      outletName,
                      dateRangeLabel,
                      statusLabel,
                      summary: transactionSummary,
                      transactions: allTransactions,
                      itemsCogs: itemsCogsData,
                      generatedAt: new Date(),
                    })
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to export PDF', err)
                  } finally {
                    setIsExportingPdf(false)
                  }
                }}
              >
                <FileDown className='size-4' />
                {isExportingPdf ? loadingLabel : exportLabel}
              </Button>
            </div>

            <TransactionStats
              summary={transactionSummary}
              isLoading={isLoadingSummary}
            />

            <div className='grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)]'>
              <SalesTrendChart
                transactions={transactions}
                isLoading={isLoadingTransactions}
              />

              <PaymentBreakdownChart
                paymentBreakdown={transactionSummary?.paymentBreakdown ?? {}}
                isLoading={isLoadingSummary}
              />
            </div>

            <div className='grid gap-5 lg:grid-cols-[1.3fr_0.7fr]'>
              <div className='bg-card rounded-2xl border p-5 shadow-[0_12px_40px_-32px_var(--brand-ink)] sm:p-6'>
                <div className='mb-5 flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
                      {copy('Bacaan cepat', 'QUICK READ')}
                    </p>
                    <h2 className='mt-2 text-xl font-bold tracking-tight'>
                      {copy('Apa yang berubah?', 'What changed?')}
                    </h2>
                  </div>
                  <span className='bg-brand-soft text-brand-ink rounded-full px-3 py-1 text-xs font-semibold'>
                    {netSalesShare}% {copy('net sales', 'net sales')}
                  </span>
                </div>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='bg-muted/50 rounded-xl p-4'>
                    <p className='text-muted-foreground text-xs'>
                      {copy('Nilai pesanan rata-rata', 'Average order value')}
                    </p>
                    <p className='mt-2 text-lg font-bold tabular-nums'>
                      {transactionSummary
                        ? fmtCurrencyShort(
                            transactionSummary.netSales /
                              Math.max(transactionSummary.totalTransactions, 1)
                          )
                        : '—'}
                    </p>
                  </div>
                  <div className='bg-muted/50 rounded-xl p-4'>
                    <p className='text-muted-foreground text-xs'>
                      {copy('Diskon & pajak', 'Discounts & tax')}
                    </p>
                    <p className='mt-2 text-lg font-bold tabular-nums'>
                      {transactionSummary
                        ? fmtCurrencyShort(
                            transactionSummary.totalDiscount +
                              transactionSummary.totalTax
                          )
                        : '—'}
                    </p>
                  </div>
                  <div className='bg-muted/50 rounded-xl p-4'>
                    <p className='text-muted-foreground text-xs'>
                      {copy('Pesanan tertunda', 'Pending orders')}
                    </p>
                    <p className='mt-2 text-lg font-bold tabular-nums'>
                      {analyticsKpis?.pendingOrders ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='bg-brand-ink rounded-2xl p-5 text-white shadow-[0_18px_50px_-30px_var(--brand-ink)] sm:p-6'>
                <p className='text-xs font-bold tracking-[0.18em] text-white/60 uppercase'>
                  {copy('Fokus hari ini', 'TODAY’S FOCUS')}
                </p>
                <p className='mt-6 max-w-xs text-2xl leading-tight font-semibold tracking-tight'>
                  {copy(
                    'Jaga ritme penjualan, lalu cek stok yang bergerak paling cepat.',
                    'Keep the sales rhythm, then check the stock moving fastest.'
                  )}
                </p>
                <div className='mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-sm'>
                  <span className='text-white/60'>{selectedOutletName}</span>
                  <span className='font-semibold'>
                    {format(new Date(), 'EEE, dd MMM')}
                  </span>
                </div>
              </div>
            </div>

            <AnalyticsDashboardSection
              dateRange={dateRange}
              outletId={selectedOutletId}
            />

            <TransactionsTable
              transactions={transactions}
              isLoading={isLoadingTransactions || isFetchingTransactions}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              currentPage={transactionsPage}
              pageSize={transactionsPageSize}
              totalRows={transactionsMeta?.total ?? 0}
              onPageChange={setTransactionsPage}
              onPageSizeChange={(size) => {
                setTransactionsPage(1)
                setTransactionsPageSize(size)
              }}
            />
          </>
        )}

        {activeTab === 'stock-movements' && (
          <>
            <StockMovementsStats movements={stockMovements} />

            <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
              <CostBreakdownChart movements={stockMovements} />
              <StockMovementsChart movements={stockMovements} />
            </div>
            <StockMovementsTable
              movements={stockMovements}
              isLoading={isLoadingMovements}
            />
          </>
        )}
      </Main>
    </>
  )
}
