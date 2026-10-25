import { useEffect, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
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
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataFreshness } from '@/components/data-display/data-freshness'
import { DataPanel } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { Plus } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useCustomersQuery } from '../api/loyalty.queries'
import type { CustomerListParams, CustomerStatus } from '../api/loyalty.types'
import { CustomerStatusBadge, ListPager } from '../components/loyalty-ui'
import { useCustomerPermissions, useLoyaltyDates } from '../hooks'
import { customerStatus, formatPoints } from '../lib/loyalty'
import { CustomerRowActions } from './customer-actions'
import { CustomerFormDialog } from './customer-dialogs'

const route = getRouteApi('/_authenticated/customers/')

export const CUSTOMER_SORTS = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  name: { sortBy: 'name', sortOrder: 'asc' },
  spent: { sortBy: 'totalSpent', sortOrder: 'desc' },
  points: { sortBy: 'currentPoints', sortOrder: 'desc' },
  visits: { sortBy: 'visitCount', sortOrder: 'desc' },
  lastVisit: { sortBy: 'lastVisitAt', sortOrder: 'desc' },
} as const satisfies Record<
  string,
  Pick<CustomerListParams, 'sortBy' | 'sortOrder'>
>

export type CustomerSort = keyof typeof CUSTOMER_SORTS

const DEFAULT_PAGE_SIZE = 20

export function Customers() {
  const copy = useCopy()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const goTo = useNavigate()
  const dates = useLoyaltyDates()
  const { canManage } = useCustomerPermissions()
  const [adding, setAdding] = useState(false)

  const status = search.status ?? 'all'
  const sort = search.sort ?? 'newest'
  const limit = search.pageSize ?? DEFAULT_PAGE_SIZE
  const offset = ((search.page ?? 1) - 1) * limit

  // Typing updates the URL after a pause, so every keystroke isn't a request.
  const [text, setText] = useState(search.q ?? '')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = text.trim() || undefined
      if (q !== search.q)
        navigate({
          search: (prev) => ({ ...prev, q, page: undefined }),
          replace: true,
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [text, search.q, navigate])

  const params: CustomerListParams = {
    search: search.q,
    status: status === 'all' ? undefined : [status],
    ...CUSTOMER_SORTS[sort],
    limit,
    offset,
  }
  const query = useCustomersQuery(params)
  const rows = query.data?.data ?? []
  const total = query.data?.meta.total ?? 0
  const isFiltered = !!search.q || status !== 'all'

  const statusOptions: { value: 'all' | CustomerStatus; label: string }[] = [
    { value: 'all', label: copy('Semua', 'All') },
    { value: 'active', label: copy('Aktif', 'Active') },
    { value: 'inactive', label: copy('Nonaktif', 'Inactive') },
    { value: 'banned', label: copy('Diblokir', 'Banned') },
  ]
  const sortLabels: Record<CustomerSort, string> = {
    newest: copy('Terbaru', 'Newest'),
    name: copy('Nama (A–Z)', 'Name (A–Z)'),
    spent: copy('Belanja terbanyak', 'Top spenders'),
    points: copy('Poin terbanyak', 'Most points'),
    visits: copy('Kunjungan terbanyak', 'Most visits'),
    lastVisit: copy('Kunjungan terakhir', 'Recent visit'),
  }

  return (
    <>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4'>
        <PageHeader
          title={copy('Pelanggan', 'Customers')}
          description={copy(
            'Member program poin: saldo, kunjungan dan status',
            'Loyalty members: balances, visits and status'
          )}
          actions={
            canManage && (
              <Button onClick={() => setAdding(true)}>
                <Plus size={16} />
                {copy('Tambah pelanggan', 'Add customer')}
              </Button>
            )
          }
        />

        <ContextToolbar
          sticky
          aria-label={copy('Filter pelanggan', 'Customer filters')}
          actions={
            <DataFreshness
              updatedAt={query.dataUpdatedAt}
              isFetching={query.isFetching}
              onRefresh={() => void query.refetch()}
              className='text-fg-muted text-[13px]'
            />
          }
        >
          <Input
            type='search'
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={copy(
              'Cari nama, HP atau email…',
              'Search name, phone or email…'
            )}
            aria-label={copy('Cari pelanggan', 'Search customers')}
            className='h-8 w-full sm:w-64'
          />
          <SegmentedControl
            aria-label={copy('Status', 'Status')}
            value={status}
            onValueChange={(next) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  status: next === 'all' ? undefined : next,
                  page: undefined,
                }),
              })
            }
            options={statusOptions}
          />
          <Select
            value={sort}
            onValueChange={(next) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  sort: next === 'newest' ? undefined : (next as CustomerSort),
                  page: undefined,
                }),
              })
            }
          >
            <SelectTrigger size='sm' aria-label={copy('Urutkan', 'Sort')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CUSTOMER_SORTS) as CustomerSort[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {sortLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ContextToolbar>

        <DataPanel className='overflow-hidden'>
          {query.isError ? (
            <ErrorState
              title={copy(
                'Daftar pelanggan belum termuat',
                "Customers couldn't load"
              )}
              description={query.error.message}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : !query.isLoading && rows.length === 0 ? (
            isFiltered ? (
              <EmptyState
                title={copy(
                  'Tidak ada pelanggan yang cocok',
                  'No customers match'
                )}
                action={
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setText('')
                      navigate({ search: {} })
                    }}
                  >
                    {copy('Hapus filter', 'Clear filters')}
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title={copy('Belum ada pelanggan', 'No customers yet')}
                description={copy(
                  'Pelanggan terdaftar saat kasir memasukkan nomor HP mereka, atau tambahkan di sini.',
                  'Customers join when a cashier enters their phone number, or add them here.'
                )}
              />
            )
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy('Pelanggan', 'Customer')}</TableHead>
                    <TableHead className='max-sm:hidden'>
                      {copy('Status', 'Status')}
                    </TableHead>
                    <TableHead className='text-end'>
                      {copy('Poin', 'Points')}
                    </TableHead>
                    <TableHead className='text-end max-md:hidden'>
                      {copy('Total belanja', 'Total spent')}
                    </TableHead>
                    <TableHead className='text-end max-md:hidden'>
                      {copy('Kunjungan', 'Visits')}
                    </TableHead>
                    <TableHead className='max-lg:hidden'>
                      {copy('Terakhir datang', 'Last visit')}
                    </TableHead>
                    <TableHead className='w-10'>
                      <span className='sr-only'>{copy('Aksi', 'Actions')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody
                  className={cn(query.isPlaceholderData && 'opacity-60')}
                >
                  {query.isLoading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}>
                            <span className='bg-surface-hover block h-5 w-full animate-pulse rounded' />
                          </TableCell>
                        </TableRow>
                      ))
                    : rows.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className='cursor-pointer'
                          onClick={() =>
                            goTo({
                              to: '/customers/$customerId',
                              params: { customerId: customer.id },
                            })
                          }
                        >
                          <TableCell>
                            <Link
                              to='/customers/$customerId'
                              params={{ customerId: customer.id }}
                              className='font-medium hover:underline'
                              onClick={(e) => e.stopPropagation()}
                            >
                              {customer.name}
                            </Link>
                            <div className='text-fg-muted text-[13px] tabular-nums'>
                              {customer.phone}
                            </div>
                            {/* Phones fold the status column into the name; only exceptions show. */}
                            {customerStatus(customer) !== 'active' && (
                              <div className='mt-1 sm:hidden'>
                                <CustomerStatusBadge
                                  status={customerStatus(customer)}
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className='max-sm:hidden'>
                            <CustomerStatusBadge
                              status={customerStatus(customer)}
                            />
                          </TableCell>
                          <TableCell className='text-end tabular-nums'>
                            <div className='font-medium'>
                              {formatPoints(customer.currentPoints)}
                            </div>
                            <div
                              className='text-fg-muted text-[13px]'
                              title={copy(
                                'Total poin seumur hidup',
                                'Lifetime points'
                              )}
                            >
                              {copy(
                                `${formatPoints(customer.totalPoints)} total`,
                                `${formatPoints(customer.totalPoints)} lifetime`
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-end tabular-nums max-md:hidden'>
                            {formatMoney(customer.totalSpent)}
                          </TableCell>
                          <TableCell className='text-end tabular-nums max-md:hidden'>
                            {formatPoints(customer.visitCount)}
                          </TableCell>
                          <TableCell className='text-fg-secondary max-lg:hidden'>
                            {customer.lastVisitAt ? (
                              <span
                                title={dates.dateTime(customer.lastVisitAt)}
                              >
                                {dates.ago(customer.lastVisitAt)}
                              </span>
                            ) : (
                              <span className='text-fg-muted'>—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <CustomerRowActions customer={customer} />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
              <ListPager
                className='border-divider border-t'
                total={total}
                limit={limit}
                offset={offset}
                onChange={(next) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      page:
                        next.offset / next.limit + 1 > 1
                          ? next.offset / next.limit + 1
                          : undefined,
                      pageSize:
                        next.limit === DEFAULT_PAGE_SIZE
                          ? undefined
                          : next.limit,
                    }),
                  })
                }
              />
            </>
          )}
        </DataPanel>
      </Main>

      {adding && (
        <CustomerFormDialog
          open
          onOpenChange={(open) => !open && setAdding(false)}
          onSaved={(customer) =>
            goTo({
              to: '/customers/$customerId',
              params: { customerId: customer.id },
            })
          }
        />
      )}
    </>
  )
}
