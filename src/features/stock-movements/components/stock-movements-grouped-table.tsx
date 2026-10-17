import * as React from 'react'
import {
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from '@/components/icons'
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
import type { StockMovement } from '@/features/dashboard/components/stock-movements/stock-movements-table'

export type GroupBy = 'ingredient' | 'product' | 'transaction'
type SortDirection = 'asc' | 'desc' | null
type SortColumn =
  | 'date'
  | 'ingredient'
  | 'type'
  | 'qty'
  | 'costPerUnit'
  | 'totalCost'
  | 'employee'

interface StockMovementsGroupedTableProps {
  movements: StockMovement[]
  isLoading?: boolean
}

interface GroupInfo {
  key: string
  label: string
  subtitle: string
  items: StockMovement[]
  totalQty: number
  totalCost: number
  unit: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMovementTypeBadge(type: string) {
  const styles: Record<string, string> = {
    SALE: 'bg-status-danger/10 text-status-danger',
    PURCHASE:
      'bg-leaf-soft text-leaf  ',
    ADJUSTMENT:
      'bg-status-warning/10 text-status-warning',
    WASTE:
      'bg-status-warning/10 text-status-warning',
  }
  return styles[type] || 'bg-muted text-muted-foreground'
}

/** Parse product name from notes like "Auto-deducted (PRODUCT) for Americano x1" */
function parseProductFromNotes(notes: string): string {
  const match = notes.match(/for\s+(.+?)\s+x\d+/i)
  return match?.[1] ?? 'Unknown Product'
}

/** Parse quantity from notes like "Auto-deducted (PRODUCT) for Americano x1" */
function parseProductQtyFromNotes(notes: string): number {
  const match = notes.match(/x(\d+)/i)
  return match ? Number(match[1]) : 1
}

function buildGroups(
  movements: StockMovement[],
  groupBy: GroupBy
): GroupInfo[] {
  const map = new Map<string, StockMovement[]>()

  for (const m of movements) {
    let key: string
    switch (groupBy) {
      case 'ingredient':
        key = m.ingredient.id
        break
      case 'product':
        key = parseProductFromNotes(m.notes)
        break
      case 'transaction':
        key = m.movementType
        break
    }
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }

  return Array.from(map.entries())
    .map(([key, items]): GroupInfo => {
      const totalQty = items.reduce((a, m) => a + Number(m.quantity), 0)
      const totalCost = items.reduce(
        (a, m) => a + Math.abs(Number(m.totalCost)),
        0
      )

      switch (groupBy) {
        case 'ingredient': {
          const ing = items[0].ingredient
          return {
            key,
            label: ing.name,
            subtitle: `${Math.abs(totalQty).toLocaleString()} ${ing.unit}`,
            items,
            totalQty,
            totalCost,
            unit: ing.unit,
          }
        }
        case 'product': {
          const productName = key
          const totalProductQty = items.reduce(
            (a, m) => a + parseProductQtyFromNotes(m.notes),
            0
          )
          // Use unique transaction count as subtitle context
          const uniqueRefs = new Set(items.map((m) => m.referenceType))
          const refLabel =
            uniqueRefs.size === 1
              ? [...uniqueRefs][0]
              : `${uniqueRefs.size} refs`
          return {
            key,
            label: productName,
            subtitle: `${refLabel} · ${totalProductQty} QTY`,
            items,
            totalQty,
            totalCost,
            unit: '',
          }
        }
        case 'transaction': {
          const typeBadgeLabel = key
          return {
            key,
            label: typeBadgeLabel,
            subtitle: `${items.length} movements`,
            items,
            totalQty,
            totalCost,
            unit: '',
          }
        }
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

function getSortValue(
  movement: StockMovement,
  column: SortColumn
): string | number {
  switch (column) {
    case 'date':
      return new Date(movement.movementDate).getTime()
    case 'ingredient':
      return movement.ingredient.name.toLowerCase()
    case 'type':
      return movement.movementType
    case 'qty':
      return Number(movement.quantity)
    case 'costPerUnit':
      return Number(movement.costPerUnit)
    case 'totalCost':
      return Number(movement.totalCost)
    case 'employee':
      return movement.employee.name.toLowerCase()
  }
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
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium sm:text-sm'
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

export function StockMovementsGroupedTable({
  movements,
  isLoading,
}: StockMovementsGroupedTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [groupBy, setGroupBy] = React.useState<GroupBy>('ingredient')
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  )
  const [sortColumn, setSortColumn] = React.useState<SortColumn | null>('date')
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>('desc')

  // Filter
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

  // Sort within each group
  const sortFn = React.useCallback(
    (a: StockMovement, b: StockMovement) => {
      if (!sortColumn || !sortDirection) return 0
      const aVal = getSortValue(a, sortColumn)
      const bVal = getSortValue(b, sortColumn)
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? cmp : -cmp
    },
    [sortColumn, sortDirection]
  )

  // Build groups
  const groups = React.useMemo(() => {
    const g = buildGroups(filteredMovements, groupBy)
    // Sort items within each group
    for (const group of g) {
      group.items.sort(sortFn)
    }
    return g
  }, [filteredMovements, groupBy, sortFn])

  // Flatten for pagination
  type FlatRow =
    | { type: 'group'; group: GroupInfo }
    | { type: 'item'; data: StockMovement; isLast: boolean }

  const flatRows = React.useMemo(() => {
    const rows: FlatRow[] = []
    for (const group of groups) {
      rows.push({ type: 'group', group })
      if (!collapsedGroups.has(group.key)) {
        group.items.forEach((item, i) => {
          rows.push({
            type: 'item',
            data: item,
            isLast: i === group.items.length - 1,
          })
        })
      }
    }
    return rows
  }, [groups, collapsedGroups])

  const totalVisibleRows = flatRows.length
  const totalPages = Math.ceil(totalVisibleRows / pageSize)

  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return flatRows.slice(start, start + pageSize)
  }, [flatRows, currentPage, pageSize])

  // Reset page on filter/group changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize, groupBy])

  React.useEffect(() => {
    setCollapsedGroups(new Set())
  }, [groupBy])

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAllGroups = () => {
    const allKeys = groups.map((g) => g.key)
    if (collapsedGroups.size === allKeys.length) {
      setCollapsedGroups(new Set())
    } else {
      setCollapsedGroups(new Set(allKeys))
    }
  }

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

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const allCollapsed =
    collapsedGroups.size === groups.length && groups.length > 0

  return (
    <div className='bg-card rounded-lg border'>
      {/* Toolbar */}
      <div className='flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-3.5'>
        <div className='flex flex-1 items-center gap-2 sm:gap-2.5'>
          <Button
            variant='outline'
            size='icon'
            className='size-7 shrink-0 sm:size-8'
          >
            <ClipboardList className='text-muted-foreground size-4 sm:size-[18px]' />
          </Button>
          <span className='text-sm font-medium sm:text-base'>
            Stock Movements
          </span>
          <Badge variant='secondary' className='ml-1 text-xs sm:text-xs'>
            {filteredMovements.length}
          </Badge>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {/* Group by selector */}
          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className='h-8 w-[160px] text-xs sm:h-9 sm:text-sm'>
              <span className='text-muted-foreground mr-1'>Group:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ingredient'>Ingredient</SelectItem>
              <SelectItem value='product'>Product</SelectItem>
              <SelectItem value='transaction'>Transaction</SelectItem>
            </SelectContent>
          </Select>

          {/* Collapse/Expand all */}
          <Button
            variant='outline'
            size='sm'
            className='h-8 text-xs sm:h-9 sm:text-sm'
            onClick={toggleAllGroups}
          >
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </Button>

          {/* Search */}
          <div className='relative flex-1 sm:flex-none'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 sm:size-5' />
            <Input
              placeholder='Search ingredient, employee...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-8 w-full pl-9 text-sm sm:h-9 sm:w-[220px] sm:pl-10 lg:w-[260px]'
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto px-3 pb-3 sm:px-6 sm:pb-4'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='text-muted-foreground w-[40px] text-xs font-medium sm:text-sm' />
              <SortableHeader
                label='Date'
                column='date'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[140px]'
              />
              <SortableHeader
                label='Ingredient'
                column='ingredient'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[140px]'
              />
              <SortableHeader
                label='Type'
                column='type'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[80px]'
              />
              <SortableHeader
                label='Qty'
                column='qty'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[90px] text-right'
              />
              <SortableHeader
                label='Cost/Unit'
                column='costPerUnit'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='hidden min-w-[90px] text-right md:table-cell'
              />
              <SortableHeader
                label='Total Cost'
                column='totalCost'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='min-w-[100px] text-right'
              />
              <SortableHeader
                label='Employee'
                column='employee'
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className='hidden min-w-[120px] lg:table-cell'
              />
              <TableHead className='text-muted-foreground hidden min-w-[200px] text-xs font-medium sm:text-sm xl:table-cell'>
                Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='text-muted-foreground h-24 text-center text-sm'
                >
                  Loading stock movements...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='text-muted-foreground h-24 text-center text-sm'
                >
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                if (row.type === 'group') {
                  const { group } = row
                  const isCollapsed = collapsedGroups.has(group.key)
                  return (
                    <TableRow
                      key={`group-${group.key}`}
                      className='bg-muted/30 hover:bg-muted/50 cursor-pointer border-t'
                      onClick={() => toggleGroup(group.key)}
                    >
                      <TableCell colSpan={9} className='py-3'>
                        <div className='flex items-center justify-between gap-4'>
                          <div className='flex items-center gap-2'>
                            {isCollapsed ? (
                              <ChevronRightIcon className='text-muted-foreground size-4 shrink-0' />
                            ) : (
                              <ChevronDown className='text-muted-foreground size-4 shrink-0' />
                            )}
                            <span className='text-sm font-semibold sm:text-base'>
                              {group.label}
                            </span>
                            <span className='text-muted-foreground text-xs sm:text-sm'>
                              {group.subtitle}
                            </span>
                            <Badge
                              variant='secondary'
                              className='text-xs sm:text-xs'
                            >
                              {group.items.length} items
                            </Badge>
                          </div>
                          <div className='flex shrink-0 items-center gap-4 text-xs sm:text-sm'>
                            <span className='text-muted-foreground hidden sm:inline'>
                              Total Cost:{' '}
                              <span className='text-foreground font-medium'>
                                Rp{group.totalCost.toLocaleString()}
                              </span>
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                // Item row with tree connector
                const movement = row.data
                return (
                  <TableRow
                    key={movement.id}
                    className='hover:bg-surface-hover border-0'
                  >
                    {/* Tree connector */}
                    <TableCell className='text-muted-foreground w-[40px] pr-0 text-right font-sans tabular-nums text-xs select-none'>
                      <span className='text-border inline-block w-full text-right'>
                        {row.isLast ? '└' : '├'}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs sm:text-sm'>
                      {formatDate(movement.movementDate)}
                    </TableCell>
                    <TableCell>
                      <div className='min-w-0'>
                        <span className='block truncate text-xs font-medium sm:text-sm'>
                          {movement.ingredient.name}
                        </span>
                        <span className='text-muted-foreground text-xs sm:text-xs'>
                          {movement.ingredient.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium sm:text-xs ${getMovementTypeBadge(movement.movementType)}`}
                      >
                        {movement.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right text-xs tabular-nums sm:text-sm'>
                      <span
                        className={
                          Number(movement.quantity) < 0
                            ? 'text-status-danger'
                            : 'text-leaf'
                        }
                      >
                        {Number(movement.quantity).toLocaleString()}{' '}
                        {movement.unit}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden text-right text-xs tabular-nums sm:text-sm md:table-cell'>
                      Rp{Number(movement.costPerUnit).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right text-xs font-medium tabular-nums sm:text-sm'>
                      Rp{Number(movement.totalCost).toLocaleString()}
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden text-xs sm:text-sm lg:table-cell'>
                      {movement.employee.name}
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden max-w-[250px] truncate text-xs sm:text-sm xl:table-cell'>
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
      {flatRows.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 border-t px-3 py-3 sm:flex-row sm:px-6'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs sm:text-sm'>
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
            <span className='text-muted-foreground'>
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalVisibleRows)} of{' '}
              {totalVisibleRows}
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
