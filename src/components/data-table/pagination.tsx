import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { useCopy } from '@/hooks/use-copy'
import { type Table } from '@tanstack/react-table'
import { cn, getPageNumbers } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  className?: string
}

export function DataTablePagination<TData>({
  table,
  className,
}: DataTablePaginationProps<TData>) {
  const copy = useCopy()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = Math.max(1, table.getPageCount())
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip px-2',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium @2xl/content:hidden'>
          {copy('Halaman', 'Page')} {currentPage} {copy('dari', 'of')} {totalPages}
        </div>
        <div className='flex items-center gap-2 @max-2xl/content:flex-row-reverse'>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='hidden text-sm font-medium sm:block'>{copy('Baris per halaman', 'Rows per page')}</p>
        </div>
      </div>

      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium @max-3xl/content:hidden'>
          {copy('Halaman', 'Page')} {currentPage} {copy('dari', 'of')} {totalPages}
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon' className='p-0 @max-md/content:hidden'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>{copy('Halaman pertama', 'First page')}</span>
            <DoubleArrowLeftIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon' className='p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>{copy('Halaman sebelumnya', 'Previous page')}</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>

          {/* Page number buttons */}
          {pageNumbers.map((pageNumber, index) => (
            <div key={`${pageNumber}-${index}`} className='flex items-center'>
              {pageNumber === '...' ? (
                <span className='text-muted-foreground px-1 text-sm'>...</span>
              ) : (
                <Button
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  size='icon' aria-current={currentPage === pageNumber ? 'page' : undefined} className='px-2'
                  onClick={() => table.setPageIndex((pageNumber as number) - 1)}
                >
                  <span className='sr-only'>{copy('Halaman', 'Page')} {pageNumber}</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}

          <Button
            variant='outline'
            size='icon' className='p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>{copy('Halaman berikutnya', 'Next page')}</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon' className='p-0 @max-md/content:hidden'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>{copy('Halaman terakhir', 'Last page')}</span>
            <DoubleArrowRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
