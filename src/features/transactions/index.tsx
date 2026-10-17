import { useState, useEffect } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { getPresetSpan, toApiDateTime, type DateSpan } from '@/lib/date-range'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataPanel } from '@/components/data-display/data-panel'
import { DateRangePicker } from '@/components/date-range-picker'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { OutletSelect } from '@/components/outlet-select'
import {
  useDashboardOutletsQuery,
  useTransactionSummaryQuery,
  useTransactionsQuery,
} from '@/features/dashboard/api/dashboard.queries'
import { SalesMetrics } from '@/features/dashboard/components/sales/sales-metrics'
import { TransactionsReportTable } from './components/transactions-report-table'

const PAYMENT_METHODS = [
  { value: 'all', label: 'All payment methods' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'E_WALLET', label: 'E-Wallet' },
  { value: 'OTHER', label: 'Other' },
]

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All order types' },
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
]

const route = getRouteApi('/_authenticated/transactions/')

export function TransactionsReport() {
  const { q } = route.useSearch()
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [span, setSpan] = useState<DateSpan>(() => getPresetSpan('this-month'))
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const apiParams = {
    outletId: selectedOutletId,
    startDate: toApiDateTime(span.from),
    endDate: toApiDateTime(span.to),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data: summaryData, isLoading: isLoadingSummary } =
    useTransactionSummaryQuery(selectedOutletId, {
      startDate: apiParams.startDate,
      endDate: apiParams.endDate,
    })

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    refetch: refetchTransactions,
  } = useTransactionsQuery(apiParams)

  const allTransactions = transactionsData?.data ?? []

  // Client-side filters
  const transactions = allTransactions.filter((tx) => {
    if (
      paymentMethodFilter !== 'all' &&
      !tx.payments.some((p) => p.paymentMethod === paymentMethodFilter)
    ) {
      return false
    }
    if (
      transactionTypeFilter !== 'all' &&
      tx.transactionType !== transactionTypeFilter
    ) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  return (
    <>
      <AppHeader />

      <Main className='flex w-full flex-1 flex-col gap-4 overscroll-none'>
        <PageHeader
          title='Transactions'
          description='Orders, payments and status for the selected outlet and period'
        />
        <ContextToolbar sticky aria-label='Filters'>
          {outlets.length > 0 && (
            <OutletSelect
              outlets={outlets}
              value={selectedOutletId}
              onValueChange={setSelectedOutletId}
            />
          )}
          <DateRangePicker value={span} onChange={setSpan} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size='sm' aria-label='Status'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='OPEN'>Open</SelectItem>
              <SelectItem value='PENDING'>Pending</SelectItem>
              <SelectItem value='CLOSED'>Closed</SelectItem>
              <SelectItem value='VOIDED'>Voided</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentMethodFilter}
            onValueChange={setPaymentMethodFilter}
          >
            <SelectTrigger size='sm' aria-label='Payment method'>
              <SelectValue placeholder='Payment' />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((pm) => (
                <SelectItem key={pm.value} value={pm.value}>
                  {pm.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={transactionTypeFilter}
            onValueChange={setTransactionTypeFilter}
          >
            <SelectTrigger size='sm' aria-label='Order type'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((tt) => (
                <SelectItem key={tt.value} value={tt.value}>
                  {tt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ContextToolbar>

        <DataPanel aria-label='Sales summary' className='overflow-hidden'>
          <SalesMetrics
            summary={summaryData?.data ?? null}
            previous={undefined}
            comparisonLabel={null}
            isLoading={isLoadingSummary}
            isStale={false}
            className='grid-cols-2 lg:grid-cols-4'
          />
        </DataPanel>

        {/* Transactions Table */}
        <TransactionsReportTable
          key={q ?? ''}
          initialSearch={q ?? ''}
          transactions={transactions}
          isLoading={isLoadingTransactions}
          onRefresh={refetchTransactions}
          isFetching={isFetchingTransactions}
        />
      </Main>
    </>
  )
}
