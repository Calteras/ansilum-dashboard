import { formatMoney } from '@/lib/format'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { productStatusStyles } from '../data/data'
import type { Product, ProductScope, ProductType } from '../api/products.types'
import { DataTableRowActions } from './data-table-row-actions'

const formatRupiah = formatMoney

export function useProductsColumns(): ColumnDef<Product>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('products.columns.selectAll')}
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
          aria-label={t('products.columns.selectRow')}
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.sku')} />
      ),
      cell: ({ row }) => (
        <div className='font-sans tabular-nums text-sm'>{row.getValue('sku')}</div>
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
        <DataTableColumnHeader column={column} title={t('products.columns.name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8 rounded-md'>
            <AvatarImage src={row.original.imageUrl} alt='' className='object-cover' />
            <AvatarFallback className='rounded-md text-xs'>
              {row.original.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <LongText className='max-w-40'>{row.getValue('name')}</LongText>
        </div>
      ),
      meta: { className: 'w-56' },
    },
    {
      id: 'category',
      accessorFn: (row) => row.category?.name ?? '-',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.category')} />
      ),
      cell: ({ row }) => {
        const category = row.original.category
        if (!category) return <span>-</span>
        return (
          <Badge
            variant='outline'
            style={{
              borderColor: category.color,
              color: category.color,
            }}
          >
            {category.name}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'basePrice',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.basePrice')} />
      ),
      cell: ({ row }) => (
        <div className='font-sans tabular-nums text-sm'>
          {formatRupiah(row.getValue('basePrice'))}
        </div>
      ),
    },
    {
      accessorKey: 'productType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.type')} />
      ),
      cell: ({ row }) => {
        const type = row.getValue('productType') as ProductType
        return (
          <Badge variant='outline'>
            {t(`products.types.${type}` as any, { defaultValue: type }) as string}
          </Badge>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
      enableSorting: false,
    },
    {
      id: 'status',
      accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.isActive ? 'active' : 'inactive'
        const badgeColor = productStatusStyles.get(status)
        return (
          <div className='flex space-x-2'>
            <Badge variant='outline' className={cn('capitalize', badgeColor)}>
              {t(`products.statuses.${status}` as any) as string}
            </Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: 'scope',
      accessorKey: 'scope',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.scope')} />
      ),
      cell: ({ row }) => {
        const scope = (row.getValue('scope') ?? 'GLOBAL') as ProductScope
        const outletCount = row.original.outletVisibilities?.length ?? 0
        return scope === 'OUTLET_SPECIFIC' ? (
          <Badge variant='outline' className='gap-1 text-xs'>
            {outletCount} {outletCount !== 1 ? t('nav.outlets').toLowerCase() : t('nav.outlets').toLowerCase().replace(/s$/, '')}
          </Badge>
        ) : (
          <Badge variant='secondary' className='text-xs'>
            {t('products.scope.GLOBAL')}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      id: 'variants',
      accessorFn: (row) => row.variants?.length ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('products.columns.variants')} />
      ),
      cell: ({ row }) => {
        const count = row.original.variants?.length ?? 0
        return <div className='text-center'>{count}</div>
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
    },
  ]
}
