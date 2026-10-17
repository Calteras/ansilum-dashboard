import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  SlidersHorizontal,
} from '@/components/icons'

export interface Transaction {
  id: string
  transactionNo: string
  transactionDate: string
  transactionType: string
  status: string
  subtotal: string
  discountAmount: string
  taxAmount: string
  grandTotal: string
  customerName: string | null
  tableNumber: string | null
  outlet: { id: string; name: string; code: string }
  cashier: { id: string; name: string; employeeNo: string }
  items: {
    id: string
    productName: string
    variantName: string | null
    quantity: number
    unitPrice: string
    subtotal: string
  }[]
  payments: {
    id: string
    paymentMethod: string
    amount: string
    receivedAmount: string
    changeAmount: string | null
  }[]
}

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  currentPage: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

const STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; labelKey: string }
> = {
  OPEN: {
    dot: 'bg-status-info',
    text: 'text-fg-secondary',
    labelKey: 'dashboard.transactionsTable.statusOpen',
  },
  PENDING: {
    dot: 'bg-status-warning',
    text: 'text-status-warning',
    labelKey: 'dashboard.transactionsTable.statusPending',
  },
  CLOSED: {
    dot: 'bg-status-success',
    text: 'text-status-success',
    labelKey: 'dashboard.transactionsTable.statusClosed',
  },
  VOIDED: {
    dot: 'bg-status-danger',
    text: 'text-status-danger',
    labelKey: 'dashboard.transactionsTable.statusVoided',
  },
}

const PAYMENT_METHOD_KEYS: Record<string, string> = {
  BANK_TRANSFER: 'dashboard.paymentMethods.BANK_TRANSFER',
  CASH: 'dashboard.paymentMethods.CASH',
  CREDIT_CARD: 'dashboard.paymentMethods.CREDIT_CARD',
  DEBIT_CARD: 'dashboard.paymentMethods.DEBIT_CARD',
  E_WALLET: 'dashboard.paymentMethods.E_WALLET',
}

export function TransactionsTable({
  transactions,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: TransactionsTableProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = React.useState('')
  const translateKey = React.useCallback(
    (key: string) => t(key as never) as string,
    [t]
  )

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase()
      return (
        !searchQuery ||
        tx.transactionNo.toLowerCase().includes(q) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
        tx.cashier.name.toLowerCase().includes(q) ||
        tx.items.some((i) => i.productName.toLowerCase().includes(q))
      )
    })
  }, [transactions, searchQuery])

  const isLocalSearch = searchQuery.trim().length > 0
  const displayedTransactions = filteredTransactions
  const effectiveTotalRows = isLocalSearch
    ? filteredTransactions.length
    : totalRows
  const totalPages = Math.max(1, Math.ceil(effectiveTotalRows / pageSize))

  React.useEffect(() => {
    onPageChange(1)
  }, [searchQuery, pageSize, statusFilter, onPageChange])

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className='border-divider bg-card overflow-hidden rounded-lg border'>
      {/* Table toolbar */}
      <div className='border-divider flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5'>
        <div className='flex flex-1 items-center gap-3'>
          <h2 className='text-sm leading-5 font-semibold tracking-[-0.01em]'>
            {t('dashboard.transactionsTable.title')}
          </h2>
          <span className='text-fg-muted text-[13px] tabular-nums'>
            {effectiveTotalRows}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger
              size='sm'
              aria-label={t('dashboard.transactionsTable.colStatus')}
              className='border-divider-strong h-8 text-[13px] dark:bg-transparent'
            >
              <SlidersHorizontal className='size-3.5' aria-hidden />
              <SelectValue
                placeholder={t('dashboard.transactionsTable.colStatus')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>
                {t('dashboard.transactionsTable.allStatus')}
              </SelectItem>
              <SelectItem value='OPEN'>
                {t('dashboard.transactionsTable.statusOpen')}
              </SelectItem>
              <SelectItem value='PENDING'>
                {t('dashboard.transactionsTable.statusPending')}
              </SelectItem>
              <SelectItem value='CLOSED'>
                {t('dashboard.transactionsTable.statusClosed')}
              </SelectItem>
              <SelectItem value='VOIDED'>
                {t('dashboard.transactionsTable.statusVoided')}
              </SelectItem>
            </SelectContent>
          </Select>

          <div className='relative flex-1 sm:flex-none'>
            <Input
              placeholder={t('dashboard.transactionsTable.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='border-divider-strong h-8 w-full text-[13px] sm:w-56'
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader className='bg-transparent'>
            <TableRow className='border-divider bg-surface-subtle border-b hover:bg-transparent'>
              <TableHead className='text-muted-foreground w-[40px] px-4 py-2.5 text-xs font-medium sm:px-6'>
                {t('dashboard.transactionsTable.colNo')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[130px] px-4 py-2.5 text-xs font-medium sm:px-6'>
                {t('dashboard.transactionsTable.colTxNo')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[130px] px-2 py-2.5 text-xs font-medium'>
                {t('dashboard.transactionsTable.colDate')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[120px] px-2 py-2.5 text-xs font-medium'>
                {t('dashboard.transactionsTable.colCustomer')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[80px] px-2 py-2.5 text-xs font-medium'>
                {t('dashboard.transactionsTable.colStatus')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[50px] px-2 py-2.5 text-xs font-medium'>
                {t('dashboard.transactionsTable.colQty')}
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[110px] px-2 py-2.5 text-right text-xs font-medium'>
                {t('dashboard.transactionsTable.colTotal')}
              </TableHead>
              <TableHead className='text-muted-foreground hidden min-w-[80px] px-2 py-2.5 text-xs font-medium md:table-cell'>
                {t('dashboard.transactionsTable.colMethod')}
              </TableHead>
              <TableHead className='text-muted-foreground hidden min-w-[100px] px-2 py-2.5 text-xs font-medium lg:table-cell'>
                {t('dashboard.transactionsTable.colCashier')}
              </TableHead>
              <TableHead className='text-muted-foreground w-[40px] px-2 py-2.5 text-xs font-medium' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className='text-muted-foreground h-32 text-center font-sans text-xs tabular-nums'
                >
                  {t('dashboard.transactionsTable.loading')}
                </TableCell>
              </TableRow>
            ) : displayedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className='text-muted-foreground h-32 text-center font-sans text-xs tabular-nums'
                >
                  {t('dashboard.transactionsTable.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              displayedTransactions.map((tx, index) => {
                const totalItems = tx.items.reduce((s, i) => s + i.quantity, 0)
                const paymentMethods = [
                  ...new Set(tx.payments.map((p) => p.paymentMethod)),
                ]
                const statusCfg = STATUS_CONFIG[tx.status]
                const statusLabel = statusCfg
                  ? translateKey(statusCfg.labelKey)
                  : tx.status

                return (
                  <TableRow
                    key={tx.id}
                    className='group hover:bg-surface-hover border-divider border-b last:border-0'
                  >
                    <TableCell className='text-muted-foreground px-4 py-2 font-sans text-xs tabular-nums sm:px-6'>
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className='px-4 py-2 sm:px-6'>
                      <span className='font-sans text-xs font-medium tabular-nums'>
                        {tx.transactionNo}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground px-2 py-2 font-sans text-xs tabular-nums'>
                      {format(parseISO(tx.transactionDate), 'dd MMM yy HH:mm')}
                    </TableCell>
                    <TableCell className='px-2 py-2'>
                      <div className='min-w-0'>
                        <span className='block truncate text-xs font-medium'>
                          {tx.customerName || '—'}
                        </span>
                        {tx.tableNumber && (
                          <span className='text-muted-foreground font-sans text-xs tabular-nums'>
                            {t('dashboard.transactionsTable.tbl')}{' '}
                            {tx.tableNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='px-2 py-2'>
                      <div className='flex items-center gap-1.5'>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${statusCfg?.dot ?? 'bg-muted-foreground'}`}
                        />
                        <span
                          className={`text-xs font-medium ${statusCfg?.text ?? 'text-muted-foreground'}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='px-2 py-2 text-center font-sans text-xs tabular-nums'>
                      {totalItems}
                    </TableCell>
                    <TableCell className='px-2 py-2 text-right font-sans text-xs font-medium tabular-nums'>
                      {formatMoney(tx.grandTotal)}
                    </TableCell>
                    <TableCell className='hidden px-2 py-2 md:table-cell'>
                      <div className='flex flex-wrap gap-1'>
                        {paymentMethods.map((m) => (
                          <span
                            key={m}
                            className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-sans text-xs tabular-nums'
                          >
                            {PAYMENT_METHOD_KEYS[m]
                              ? translateKey(PAYMENT_METHOD_KEYS[m])
                              : m}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden px-2 py-2 text-xs lg:table-cell'>
                      {tx.cashier.name}
                    </TableCell>
                    <TableCell className='px-2 py-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
                      >
                        <Eye className='size-3.5' />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {effectiveTotalRows > 0 && (
        <div className='border-divider flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:px-5'>
          <div className='text-muted-foreground flex items-center gap-2 font-sans text-xs tabular-nums'>
            <span className='hidden sm:inline'>
              {t('dashboard.transactionsTable.rows')}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className='h-7 !w-auto min-w-[64px] gap-1 px-2.5 font-sans text-xs tabular-nums [&>span]:whitespace-nowrap [&>svg]:shrink-0'>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {effectiveTotalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, effectiveTotalRows)} of{' '}
              {effectiveTotalRows}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className='size-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='size-3.5' />
            </Button>

            <div className='mx-1 flex items-center gap-0.5'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i + 1
                else if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`flex size-7 items-center justify-center rounded font-sans text-xs tabular-nums transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className='size-3.5' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className='size-3.5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
