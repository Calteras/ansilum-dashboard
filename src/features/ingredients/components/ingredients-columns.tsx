import { formatMoney } from '@/lib/format'
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { ingredientStatusStyles } from '../data/data'
import type { Ingredient } from '../api/ingredients.types'
import { DataTableRowActions } from './data-table-row-actions'

function formatNumber(value: number | string): string {
  return new Intl.NumberFormat('id-ID').format(Number(value))
}

const formatRupiah = formatMoney

export const ingredientsColumns: ColumnDef<Ingredient>[] = [
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
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Code' />
    ),
    cell: ({ row }) => (
      <div className='font-sans tabular-nums'>{row.getValue('code')}</div>
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48'>{row.getValue('name')}</LongText>
    ),
    meta: { className: 'w-48' },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unit' />
    ),
    cell: ({ row }) => <div>{row.getValue('unit')}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'costPerUnit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cost/Unit' />
    ),
    cell: ({ row }) => (
      <div className='font-sans tabular-nums'>
        {formatRupiah(row.getValue('costPerUnit'))}
      </div>
    ),
  },
  {
    accessorKey: 'currentStock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Current Stock' />
    ),
    cell: ({ row }) => {
      const current = Number(row.original.currentStock)
      const minimum = Number(row.original.minimumStock)
      const isLow = current <= minimum
      return (
        <div
          className={cn('font-sans tabular-nums', isLow && 'font-semibold text-status-danger')}
        >
          {formatNumber(current)} {row.original.unit}
        </div>
      )
    },
  },
  {
    accessorKey: 'minimumStock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Min Stock' />
    ),
    cell: ({ row }) => (
      <div className='font-sans tabular-nums'>
        {formatNumber(row.getValue('minimumStock'))} {row.original.unit}
      </div>
    ),
  },
  {
    id: 'status',
    accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.isActive ? 'active' : 'inactive'
      const badgeColor = ingredientStatusStyles.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {status}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
