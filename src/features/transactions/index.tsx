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
  useTransactionSummaryQuery,
  useTransactionsQuery,
} from '@/features/dashboard/api/dashboard.queries'
import { TransactionStats } from '@/features/dashboard/components/transactions/transaction-stats'
import { TransactionsReportTable } from './components/transactions-report-table'

const PAYMENT_METHODS = [
  { value: 'all', label: 'All Payments' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'E_WALLET', label: 'E-Wallet' },
  { value: 'OTHER', label: 'Other' },
]

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
]

export function TransactionsReport() {
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const apiParams = {
    outletId: selectedOutletId,
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
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

      <Main className='w-full flex-1 space-y-4 overscroll-none p-3 sm:space-y-6 sm:p-4 md:p-6'>
        <PageHeader
          eyebrow='REPORTING'
          title='Transactions'
          description='Review sales activity, payment mix, and order status in one place.'
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

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='h-9 w-[140px] text-sm'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='OPEN'>Open</SelectItem>
              <SelectItem value='PENDING'>Pending</SelectItem>
              <SelectItem value='CLOSED'>Closed</SelectItem>
              <SelectItem value='VOIDED'>Voided</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Method Filter */}
          <Select
            value={paymentMethodFilter}
            onValueChange={setPaymentMethodFilter}
          >
            <SelectTrigger className='h-9 w-[160px] text-sm'>
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

          {/* Transaction Type Filter */}
          <Select
            value={transactionTypeFilter}
            onValueChange={setTransactionTypeFilter}
          >
            <SelectTrigger className='h-9 w-[150px] text-sm'>
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
        </div>

        {/* Summary Cards */}
        <TransactionStats
          summary={summaryData?.data ?? null}
          isLoading={isLoadingSummary}
        />

        {/* Transactions Table */}
        <TransactionsReportTable
          transactions={transactions}
          isLoading={isLoadingTransactions}
          onRefresh={refetchTransactions}
          isFetching={isFetchingTransactions}
        />
      </Main>
    </>
  )
}
