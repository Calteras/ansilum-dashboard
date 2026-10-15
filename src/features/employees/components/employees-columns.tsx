import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { employeeStatusStyles, employeeRoles } from '../data/data'
import type { Employee } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const employeesColumns: ColumnDef<Employee>[] = [
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
    accessorKey: 'employeeNo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employee No' />
    ),
    cell: ({ row }) => (
      <div className='font-sans tabular-nums text-sm'>{row.getValue('employeeNo')}</div>
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
      <div className='flex items-center gap-2'>
        <Avatar className='size-7'>
          <AvatarImage src={row.original.image ?? undefined} alt='' className='object-cover' />
          <AvatarFallback className='text-xs'>
            {row.original.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <LongText className='max-w-36'>{row.getValue('name')}</LongText>
      </div>
    ),
    meta: { className: 'w-44' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>
        {row.getValue('email') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone' />
    ),
    cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.original.role
      const roleData = employeeRoles.find(({ value }) => value === role)

      if (!roleData) {
        return null
      }

      return (
        <div className='flex items-center gap-x-2'>
          {roleData.icon && (
            <roleData.icon size={16} className='text-muted-foreground' />
          )}
          <span className='text-sm'>{roleData.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'status',
    accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.isActive ? 'active' : 'inactive'
      const badgeColor = employeeStatusStyles.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {status}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: 'outlets',
    accessorFn: (row) => row.outlets?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Outlets' />
    ),
    cell: ({ row }) => {
      const outlets = row.original.outlets || []
      if (outlets.length === 0) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <Badge variant='secondary'>
          {outlets.length} outlet{outlets.length > 1 ? 's' : ''}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
