import { formatMoney } from '@/lib/format'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { reservationStatusStyles } from '../data/data'
import type { Reservation } from '../api/reservations.types'
import { DataTableRowActions } from './data-table-row-actions'

const formatCurrency = formatMoney

export const reservationsColumns: ColumnDef<Reservation>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'transactionNo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Transaction No' />
    ),
    cell: ({ row }) => (
      <div className='font-sans tabular-nums'>
        {row.getValue('transactionNo')}
      </div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    id: 'customer',
    accessorFn: (row) => row.customerName,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ row }) => (
      <div>
        <div className='font-medium'>{row.original.customerName}</div>
        {row.original.customerPhone && (
          <div className='text-muted-foreground text-xs'>
            {row.original.customerPhone}
          </div>
        )}
      </div>
    ),
    meta: { className: 'w-40' },
  },
  {
    accessorKey: 'reservationDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reservation Date' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('reservationDate') as string
      return (
        <div className='text-nowrap'>
          {date
            ? new Date(date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const badgeColor = reservationStatusStyles.get(status)
      return (
        <Badge variant='outline' className={cn('capitalize', badgeColor)}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    id: 'items',
    accessorFn: (row) => row.items?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Items' />
    ),
    cell: ({ row }) => {
      const count = row.original.items?.length ?? 0
      return (
        <Badge variant='secondary'>
          {count} item{count !== 1 ? 's' : ''}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Grand Total' />
    ),
    cell: ({ row }) => (
      <div className='font-medium text-nowrap'>
        {formatCurrency(row.getValue('grandTotal'))}
      </div>
    ),
  },
  {
    accessorKey: 'depositAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Deposit' />
    ),
    cell: ({ row }) => (
      <div className='text-nowrap'>
        {formatCurrency(row.getValue('depositAmount'))}
      </div>
    ),
  },
  {
    id: 'outlet',
    accessorFn: (row) => row.outlet?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Outlet' />
    ),
    cell: ({ row }) => (
      <div>{row.original.outlet?.name ?? '-'}</div>
    ),
    enableSorting: false,
  },
  {
    id: 'cashier',
    accessorFn: (row) => row.cashier?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cashier' />
    ),
    cell: ({ row }) => (
      <div>{row.original.cashier?.name ?? '-'}</div>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
