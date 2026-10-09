import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@/components/icons'
import { useTranslation } from 'react-i18next'
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

export interface StockMovement {
  id: string
  movementType: string
  quantity: string
  unit: string
  costPerUnit: string
  totalCost: string
  referenceType: string
  notes: string
  movementDate: string
  ingredient: {
    id: string
    code: string
    name: string
    unit: string
  }
  employee: {
    id: string
    name: string
    employeeNo: string
  }
  outlet: {
    id: string
    name: string
    code: string
  }
}

interface StockMovementsTableProps {
  movements: StockMovement[]
  isLoading?: boolean
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

const TYPE_CONFIG: Record<
  string,
  { dot: string; text: string; labelKey: string }
> = {
  SALE: {
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    labelKey: 'dashboard.movementTypes.SALE',
  },
  PURCHASE: {
    dot: 'bg-leaf',
    text: 'text-leaf ',
    labelKey: 'dashboard.movementTypes.PURCHASE',
  },
  ADJUSTMENT: {
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    labelKey: 'dashboard.movementTypes.ADJUSTMENT',
  },
  WASTE: {
    dot: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    labelKey: 'dashboard.movementTypes.WASTE',
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StockMovementsTable({
  movements,
  isLoading,
}: StockMovementsTableProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const filteredMovements = React.useMemo(() => {
    if (!searchQuery) return movements
    const q = searchQuery.toLowerCase()
    return movements.filter(
      (m) =>
        m.ingredient.name.toLowerCase().includes(q) ||
        m.ingredient.code.toLowerCase().includes(q) ||
        m.employee.name.toLowerCase().includes(q) ||
        m.notes.toLowerCase().includes(q) ||
        m.movementType.toLowerCase().includes(q)
    )
  }, [movements, searchQuery])

  const totalPages = Math.ceil(filteredMovements.length / pageSize)

  const paginatedMovements = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredMovements.slice(startIndex, startIndex + pageSize)
  }, [filteredMovements, currentPage, pageSize])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className='overflow-hidden rounded-xl border bg-card'>
      {/* Toolbar */}
      <div className='flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6'>
        <div className='flex flex-1 items-center gap-3'>
          <p className='text-xs font-semibold tracking-wide text-foreground uppercase'>
            {t('dashboard.stockTable.title')}
          </p>
          <span className='rounded bg-primary/10 px-1.5 py-0.5 font-sans tabular-nums text-xs text-primary'>
            {filteredMovements.length}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative flex-1 sm:flex-none'>
            <Input
              placeholder={t('dashboard.stockTable.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-8 w-full text-xs sm:w-[220px]'
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='border-b hover:bg-transparent'>
              <TableHead className='w-[40px] px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-6'>
                {t('dashboard.stockTable.colNo')}
              </TableHead>
              <TableHead className='min-w-[140px] px-2 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {t('dashboard.stockTable.colDate')}
              </TableHead>
              <TableHead className='min-w-[140px] px-2 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {t('dashboard.stockTable.colIngredient')}
              </TableHead>
              <TableHead className='min-w-[80px] px-2 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {t('dashboard.stockTable.colType')}
              </TableHead>
              <TableHead className='min-w-[90px] px-2 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {t('dashboard.stockTable.colQty')}
              </TableHead>
              <TableHead className='hidden min-w-[90px] px-2 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase md:table-cell'>
                {t('dashboard.stockTable.colCostPerUnit')}
              </TableHead>
              <TableHead className='min-w-[110px] px-2 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {t('dashboard.stockTable.colTotalCost')}
              </TableHead>
              <TableHead className='hidden min-w-[120px] px-2 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:table-cell'>
                {t('dashboard.stockTable.colEmployee')}
              </TableHead>
              <TableHead className='hidden min-w-[200px] px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-6 xl:table-cell'>
                {t('dashboard.stockTable.colNotes')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='h-32 text-center font-sans tabular-nums text-xs text-muted-foreground'
                >
                  {t('dashboard.stockTable.loading')}
                </TableCell>
              </TableRow>
            ) : paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='h-32 text-center font-sans tabular-nums text-xs text-muted-foreground'
                >
                  {t('dashboard.stockTable.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((movement, index) => {
                const typeCfg = TYPE_CONFIG[movement.movementType]
                const typeLabel = typeCfg
                  ? t(typeCfg.labelKey as any) as string
                  : movement.movementType
                const typeDot = typeCfg?.dot ?? 'bg-muted-foreground'
                const typeText = typeCfg?.text ?? 'text-muted-foreground'
                const qty = Number(movement.quantity)

                return (
                  <TableRow
                    key={movement.id}
                    className='group border-b last:border-0 hover:bg-muted/20'
                  >
                    <TableCell className='px-4 py-3 font-sans tabular-nums text-xs text-muted-foreground sm:px-6'>
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className='px-2 py-3 font-sans tabular-nums text-xs text-muted-foreground'>
                      {formatDate(movement.movementDate)}
                    </TableCell>
                    <TableCell className='px-2 py-3'>
                      <div className='min-w-0'>
                        <span className='block truncate text-xs font-medium'>
                          {movement.ingredient.name}
                        </span>
                        <span className='font-sans tabular-nums text-xs text-muted-foreground'>
                          {movement.ingredient.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='px-2 py-3'>
                      <div className='flex items-center gap-1.5'>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${typeDot}`}
                        />
                        <span
                          className={`text-xs font-medium ${typeText}`}
                        >
                          {typeLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='px-2 py-3 text-right font-sans tabular-nums text-xs tabular-nums'>
                      <span
                        className={
                          qty < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-leaf '
                        }
                      >
                        {qty.toLocaleString()} {movement.unit}
                      </span>
                    </TableCell>
                    <TableCell className='hidden px-2 py-3 text-right font-sans tabular-nums text-xs tabular-nums text-muted-foreground md:table-cell'>
                      Rp{Number(movement.costPerUnit).toLocaleString()}
                    </TableCell>
                    <TableCell className='px-2 py-3 text-right font-sans tabular-nums text-xs font-medium tabular-nums'>
                      Rp{Number(movement.totalCost).toLocaleString()}
                    </TableCell>
                    <TableCell className='hidden px-2 py-3 text-xs text-muted-foreground lg:table-cell'>
                      {movement.employee.name}
                    </TableCell>
                    <TableCell className='hidden max-w-[250px] truncate px-4 py-3 text-xs text-muted-foreground sm:px-6 xl:table-cell'>
                      {movement.notes}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredMovements.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:px-6'>
          <div className='flex items-center gap-2 font-sans tabular-nums text-xs text-muted-foreground'>
            <span className='hidden sm:inline'>{t('dashboard.stockTable.rows')}</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className='h-7 w-[58px] text-xs'>
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
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredMovements.length)} of{' '}
              {filteredMovements.length}
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
                    className={`flex size-7 items-center justify-center rounded font-sans tabular-nums text-xs transition-colors ${
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
