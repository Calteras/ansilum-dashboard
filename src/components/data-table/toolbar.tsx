import { useCopy } from '@/hooks/use-copy'
import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { RefreshCw } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTableViewOptions } from './view-options'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
  onRefresh?: () => void
  isFetching?: boolean
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  searchKey,
  filters = [],
  onRefresh,
  isFetching,
}: DataTableToolbarProps<TData>) {
  const copy = useCopy()
  const placeholder = searchPlaceholder ?? copy('Cari…', 'Search…')
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter

  return (
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
        {searchKey ? (
          <Input
            aria-label={placeholder}
            placeholder={placeholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className='w-full sm:w-64'
          />
        ) : (
          <Input
            aria-label={placeholder}
            placeholder={placeholder}
            value={table.getState().globalFilter ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className='w-full sm:w-64'
          />
        )}
        <div className='flex flex-wrap gap-2'>
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            {copy('Hapus filter', 'Clear filters')}
            <Cross2Icon className='ms-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {onRefresh && (
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onRefresh}
            disabled={isFetching}
            title={copy('Muat ulang', 'Refresh')}
            aria-label={copy('Muat ulang', 'Refresh')}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
