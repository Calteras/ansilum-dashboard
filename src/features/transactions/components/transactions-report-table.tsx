import * as React from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
} from '@/components/icons'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
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
import type { Transaction } from '@/features/dashboard/components/transactions/transactions-table'

type SortDirection = 'asc' | 'desc' | null
type SortColumn =
  | 'date'
  | 'transactionNo'
  | 'customer'
  | 'status'
  | 'items'
  | 'total'
  | 'payment'
  | 'cashier'

interface TransactionsReportTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  onRefresh?: () => void
  isFetching?: boolean
  /** Prefilled search, e.g. from the global search. */
  initialSearch?: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

const STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'Open', tone: STATUS_TONE.info },
  PENDING: { label: 'Pending', tone: STATUS_TONE.warning },
  CLOSED: { label: 'Closed', tone: STATUS_TONE.success },
  VOIDED: { label: 'Voided', tone: STATUS_TONE.danger },
}

function formatPaymentMethod(method: string) {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Transfer',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    E_WALLET: 'E-Wallet',
    OTHER: 'Other',
  }
  return labels[method] || method
}

function SortableHeader({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  className,
}: {
  label: string
  column: SortColumn
  currentSort: SortColumn | null
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
  className?: string
}) {
  const isActive = currentSort === column

  return (
    <TableHead className={className}>
      <button
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium'
        onClick={() => onSort(column)}
      >
        {label}
        {isActive && currentDirection === 'asc' ? (
          <ArrowUp className='size-3.5' />
        ) : isActive && currentDirection === 'desc' ? (
          <ArrowDown className='size-3.5' />
        ) : (
          <ArrowUpDown className='size-3.5 opacity-40' />
        )}
      </button>
    </TableHead>
  )
}

function getSortValue(tx: Transaction, column: SortColumn): string | number {
  switch (column) {
    case 'date':
      return tx.transactionDate
    case 'transactionNo':
      return tx.transactionNo
    case 'customer':
      return tx.customerName || ''
    case 'status':
      return tx.status
    case 'items':
      return tx.items.reduce((s, i) => s + i.quantity, 0)
    case 'total':
      return Number(tx.grandTotal)
    case 'payment':
      return tx.payments.map((p) => p.paymentMethod).join(', ')
    case 'cashier':
      return tx.cashier.name
    default:
      return ''
  }
}

export function TransactionsReportTable({
  transactions,
  isLoading,
  onRefresh,
  isFetching,
  initialSearch = '',
}: TransactionsReportTableProps) {
  const [searchQuery, setSearchQuery] = React.useState(initialSearch)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortColumn, setSortColumn] = React.useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredTransactions = React.useMemo(() => {
    let result = transactions.filter((tx) => {
      const q = searchQuery.toLowerCase()
      return (
        !searchQuery ||
        tx.transactionNo.toLowerCase().includes(q) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
        tx.cashier.name.toLowerCase().includes(q) ||
        tx.items.some((i) => i.productName.toLowerCase().includes(q))
      )
    })

    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        const aVal = getSortValue(a, sortColumn)
        const bVal = getSortValue(b, sortColumn)
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [transactions, searchQuery, sortColumn, sortDirection])

  const totalPages = Math.ceil(filteredTransactions.length / pageSize)

  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTransactions.slice(start, start + pageSize)
  }, [filteredTransactions, currentPage, pageSize])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className='bg-card rounded-lg border'>
      <div className='border-divider flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5'>
        <div className='flex flex-1 items-center gap-3'>
          <h2 className='text-sm leading-5 font-semibold tracking-[-0.01em]'>
            Transactions
          </h2>
          <span className='text-fg-muted text-[13px] tabular-nums'>
            {filteredTransactions.length}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative flex-1 sm:flex-none'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-8 w-full pl-9 text-[13px] sm:w-56'
            />
          </div>
          {onRefresh && (
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={onRefresh}
              aria-label='Refresh'
              disabled={isFetching}
              title='Refresh'
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='text-muted-foreground w-[40px] text-xs font-medium'>
                #
              </TableHead>
              <SortableHeader
                label='Transaction No'
                column='transactionNo'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[120px]'
              />
              <SortableHeader
                label='Date'
                column='date'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[130px]'
              />
              <SortableHeader
                label='Customer'
                column='customer'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[120px]'
              />
              <SortableHeader
                label='Status'
                column='status'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[80px]'
              />
              <SortableHeader
                label='Items'
                column='items'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[60px]'
              />
              <TableHead className='text-muted-foreground min-w-[100px] text-right text-xs font-medium'>
                Subtotal
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[90px] text-right text-xs font-medium'>
                Discount
              </TableHead>
              <TableHead className='text-muted-foreground min-w-[90px] text-right text-xs font-medium'>
                Tax
              </TableHead>
              <SortableHeader
                label='Grand Total'
                column='total'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[110px] text-right'
              />
              <SortableHeader
                label='Payment'
                column='payment'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='hidden min-w-[90px] md:table-cell'
              />
              <SortableHeader
                label='Cashier'
                column='cashier'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='hidden min-w-[100px] lg:table-cell'
              />
              <TableHead className='text-muted-foreground hidden min-w-[70px] text-xs font-medium lg:table-cell'>
                Table No
              </TableHead>
              <TableHead className='text-muted-foreground w-[50px] text-xs font-medium'>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className='text-muted-foreground h-24 text-center text-sm'
                >
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className='text-muted-foreground h-24 text-center text-sm'
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx, index) => {
                const totalItems = tx.items.reduce(
                  (s, i) => s + i.quantity,
                  0
                )
                const paymentMethods = [
                  ...new Set(tx.payments.map((p) => p.paymentMethod)),
                ]

                return (
                  <TableRow key={tx.id}>
                    <TableCell className='text-xs font-medium'>
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <span className='text-xs font-medium'>
                        {tx.transactionNo}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs'>
                      {format(parseISO(tx.transactionDate), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <span className='block truncate text-xs font-medium'>
                        {tx.customerName || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS[tx.status]?.tone ?? STATUS_TONE.neutral}
                      >
                        {STATUS[tx.status]?.label ?? tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center text-xs tabular-nums'>
                      {totalItems}
                    </TableCell>
                    <TableCell className='text-right text-xs tabular-nums'>
                      Rp{Number(tx.subtotal).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right text-xs tabular-nums'>
                      Rp{Number(tx.discountAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right text-xs tabular-nums'>
                      Rp{Number(tx.taxAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right text-xs font-medium tabular-nums'>
                      Rp{Number(tx.grandTotal).toLocaleString()}
                    </TableCell>
                    <TableCell className='hidden md:table-cell'>
                      <div className='flex flex-wrap gap-1'>
                        {paymentMethods.map((m) => (
                          <Badge
                            key={m}
                            variant='outline'
                            className='text-xs'
                          >
                            {formatPaymentMethod(m)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden text-xs lg:table-cell'>
                      {tx.cashier.name}
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden text-xs lg:table-cell'>
                      {tx.tableNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7'
                      >
                        <Eye className='size-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 border-t px-3 py-3 sm:flex-row sm:px-6'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <span className='hidden sm:inline'>Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
              {filteredTransactions.length}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className='size-4' />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className='size-4' />
            </Button>

            <div className='mx-1 flex items-center gap-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size='icon'
                    className='size-8'
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className='size-4' />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className='size-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
