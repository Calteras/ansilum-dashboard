import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { modifierGroupStatusStyles } from '../data/data'
import type { ModifierGroup } from '../api/modifier-groups.types'
import { DataTableRowActions } from './data-table-row-actions'

export const modifierGroupsColumns: ColumnDef<ModifierGroup>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48'>{row.getValue('name')}</LongText>
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
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>
        {row.getValue('description') || '-'}
      </LongText>
    ),
  },
  {
    id: 'required',
    accessorFn: (row) => (row.isRequired ? 'Yes' : 'No'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Required' />
    ),
    cell: ({ row }) => {
      const required = row.original.isRequired
      return (
        <Badge variant='outline' className={required ? 'border-status-warning/30 text-status-warning' : ''}>
          {required ? 'Yes' : 'No'}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    id: 'selection',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Selection' />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.minSelection} – {row.original.maxSelection}
      </div>
    ),
    enableSorting: false,
  },
  {
    id: 'modifiers',
    accessorFn: (row) => row.modifiers?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Modifiers' />
    ),
    cell: ({ row }) => {
      const count = row.original.modifiers?.length ?? 0
      return <div className='text-center'>{count}</div>
    },
    enableSorting: false,
  },
  {
    id: 'status',
    accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.isActive ? 'active' : 'inactive'
      const badgeColor = modifierGroupStatusStyles.get(status)
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
