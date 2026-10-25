import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { getRouteApi, Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataPanel } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import { AlertCircle, ArrowLeft, Star, UserCheck } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import {
  useCustomerQuery,
  useCustomerRedemptionsQuery,
  useCustomerTransactionsQuery,
  usePointsHistoryQuery,
} from '../api/loyalty.queries'
import type {
  CustomerDetail as Customer,
  PageParams,
} from '../api/loyalty.types'
import {
  CustomerStatusBadge,
  LedgerTypeBadge,
  ListPager,
} from '../components/loyalty-ui'
import { useCustomerPermissions, useLoyaltyDates } from '../hooks'
import {
  customerStatus,
  formatPoints,
  formatPointsChange,
  initials,
} from '../lib/loyalty'
import {
  CustomerActionItems,
  CustomerDialogs,
  type CustomerDialog,
} from './customer-actions'

const route = getRouteApi('/_authenticated/customers/$customerId')

export function CustomerDetail() {
  const copy = useCopy()
  const { customerId } = route.useParams()
  const query = useCustomerQuery(customerId)
  const [dialog, setDialog] = useState<CustomerDialog | null>(null)

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Link
          to='/customers'
          className='text-fg-secondary hover:text-foreground inline-flex w-fit items-center gap-1 text-[13px]'
        >
          <ArrowLeft className='size-3.5' aria-hidden />
          {copy('Pelanggan', 'Customers')}
        </Link>

        {query.isError ? (
          <DataPanel>
            <ErrorState
              title={copy('Profil belum termuat', "This profile couldn't load")}
              description={query.error.message}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          </DataPanel>
        ) : !query.data ? (
          <div className='bg-surface-hover h-40 animate-pulse rounded-lg' />
        ) : (
          <Profile customer={query.data} onDialog={setDialog} />
        )}
      </Main>
      {query.data && (
        <CustomerDialogs
          customer={query.data}
          open={dialog}
          onOpenChange={setDialog}
        />
      )}
    </>
  )
}

function Profile({
  customer,
  onDialog,
}: {
  customer: Customer
  onDialog: (dialog: CustomerDialog) => void
}) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const { canManage, canRestore } = useCustomerPermissions()
  const status = customerStatus(customer)
  const average =
    customer.visitCount > 0
      ? Number(customer.totalSpent) / customer.visitCount
      : null

  return (
    <>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar className='size-11'>
            <AvatarFallback>{initials(customer.name)}</AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-xl leading-7 font-semibold tracking-[-0.02em]'>
                {customer.name}
              </h1>
              <CustomerStatusBadge status={status} />
            </div>
            <p className='text-fg-muted text-[13px] leading-6'>
              <span className='tabular-nums'>{customer.phone}</span>
              {customer.email && <> · {customer.email}</>} ·{' '}
              {copy(
                `Member sejak ${dates.date(customer.createdAt)}`,
                `Member since ${dates.date(customer.createdAt)}`
              )}
            </p>
          </div>
        </div>
        {canManage && (
          <div className='flex items-center gap-2'>
            {status !== 'banned' && (
              <Button onClick={() => onDialog('adjust')}>
                <Star size={16} />
                {copy('Sesuaikan poin', 'Adjust points')}
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  aria-label={copy('Aksi lain', 'More actions')}
                >
                  <DotsHorizontalIcon className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-[190px]'>
                <CustomerActionItems customer={customer} onSelect={onDialog} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {status === 'banned' && (
        <Alert variant='destructive'>
          <AlertCircle />
          <AlertTitle>
            {copy(
              `Diblokir sejak ${dates.date(customer.bannedAt!)}`,
              `Banned since ${dates.date(customer.bannedAt!)}`
            )}
            {customer.bannedBy &&
              copy(
                ` oleh ${customer.bannedBy.name}`,
                ` by ${customer.bannedBy.name}`
              )}
          </AlertTitle>
          <AlertDescription>
            <p>{customer.banReason}</p>
            <p>
              {copy(
                'Poinnya dibekukan: tidak bisa didapat atau ditukar di kasir mana pun.',
                'Points are frozen: nothing can be earned or redeemed at any register.'
              )}
            </p>
            {canManage && (
              <Button
                variant='outline'
                size='sm'
                className='mt-2'
                onClick={() => onDialog('unban')}
              >
                <UserCheck size={16} />
                {copy('Cabut blokir', 'Lift ban')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {status === 'inactive' && (
        <Alert>
          <AlertCircle />
          <AlertTitle>
            {copy('Pelanggan nonaktif', 'Deactivated customer')}
          </AlertTitle>
          <AlertDescription>
            {canRestore
              ? copy(
                  'Tidak tampil di kasir dan tidak mendapat poin. Aktifkan kembali dari menu aksi.',
                  'Hidden from registers and not earning points. Restore from the actions menu.'
                )
              : copy(
                  'Tidak tampil di kasir dan tidak mendapat poin. Hanya pemilik usaha yang bisa mengaktifkannya kembali.',
                  'Hidden from registers and not earning points. Only an owner can restore them.'
                )}
          </AlertDescription>
        </Alert>
      )}

      <DataPanel className='overflow-hidden'>
        <MetricGroup className='grid-cols-2 md:grid-cols-3 xl:grid-cols-6'>
          <Metric
            label={copy('Saldo poin', 'Points balance')}
            value={formatPoints(customer.currentPoints)}
            definition={copy(
              'Poin yang bisa ditukar sekarang.',
              'Points that can be redeemed now.'
            )}
          />
          <Metric
            label={copy('Total poin', 'Lifetime points')}
            value={formatPoints(customer.totalPoints)}
            definition={copy(
              'Semua poin yang pernah didapat, termasuk yang sudah ditukar.',
              'Every point ever earned, including redeemed ones.'
            )}
          />
          <Metric
            label={copy('Total belanja', 'Total spent')}
            value={formatMoney(customer.totalSpent)}
          />
          <Metric
            label={copy('Kunjungan', 'Visits')}
            value={formatPoints(customer.visitCount)}
          />
          <Metric
            label={copy('Rata-rata belanja', 'Average spend')}
            value={average === null ? '—' : formatMoney(average)}
          />
          <Metric
            label={copy('Terakhir datang', 'Last visit')}
            value={
              customer.lastVisitAt ? dates.date(customer.lastVisitAt) : '—'
            }
          />
        </MetricGroup>
        {(customer.tags?.length || customer.address || customer.notes) && (
          <dl className='border-divider grid gap-x-6 gap-y-3 border-t px-5 py-4 text-[13px] sm:grid-cols-3'>
            {customer.tags && customer.tags.length > 0 && (
              <div>
                <dt className='text-fg-muted'>{copy('Label', 'Tags')}</dt>
                <dd className='mt-1 flex flex-wrap gap-1'>
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {customer.address && (
              <div>
                <dt className='text-fg-muted'>{copy('Alamat', 'Address')}</dt>
                <dd className='mt-1'>{customer.address}</dd>
              </div>
            )}
            {customer.notes && (
              <div>
                <dt className='text-fg-muted'>{copy('Catatan', 'Notes')}</dt>
                <dd className='mt-1 whitespace-pre-line'>{customer.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </DataPanel>

      <Tabs defaultValue='points' className='gap-3'>
        <TabsList variant='line'>
          <TabsTrigger value='points'>
            {copy('Riwayat poin', 'Points history')}
          </TabsTrigger>
          <TabsTrigger value='redemptions'>
            {copy('Penukaran hadiah', 'Redemptions')} (
            {customer._count.redemptions})
          </TabsTrigger>
          <TabsTrigger value='transactions'>
            {copy('Transaksi', 'Transactions')} ({customer._count.transactions})
          </TabsTrigger>
        </TabsList>
        <TabsContent value='points'>
          <PointsHistory customerId={customer.id} />
        </TabsContent>
        <TabsContent value='redemptions'>
          <Redemptions customerId={customer.id} />
        </TabsContent>
        <TabsContent value='transactions'>
          <Transactions customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function usePage(initial = 20) {
  const [page, setPage] = useState<Required<PageParams>>({
    limit: initial,
    offset: 0,
  })
  return [page, setPage] as const
}

function TabPanel({
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  empty,
  children,
  footer,
}: {
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  isEmpty: boolean
  empty: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const copy = useCopy()
  return (
    <DataPanel className='overflow-hidden'>
      {isError ? (
        <ErrorState
          title={copy('Belum termuat', "Couldn't load")}
          description={error?.message}
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <div className='space-y-2 p-4'>
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className='bg-surface-hover block h-5 animate-pulse rounded'
            />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState title={empty} />
      ) : (
        <>
          {children}
          {footer}
        </>
      )}
    </DataPanel>
  )
}

function PointsHistory({ customerId }: { customerId: string }) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const [page, setPage] = usePage()
  const query = usePointsHistoryQuery(customerId, page)
  const rows = query.data?.data ?? []

  return (
    <TabPanel
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={rows.length === 0}
      empty={copy('Belum ada pergerakan poin', 'No point activity yet')}
      footer={
        <ListPager
          className='border-divider border-t'
          total={query.data?.meta.total ?? 0}
          {...page}
          onChange={setPage}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy('Waktu', 'Date')}</TableHead>
            <TableHead>{copy('Jenis', 'Type')}</TableHead>
            <TableHead>{copy('Keterangan', 'Details')}</TableHead>
            <TableHead className='text-end'>{copy('Poin', 'Points')}</TableHead>
            <TableHead className='text-end'>
              {copy('Saldo', 'Balance')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isPlaceholderData && 'opacity-60')}>
          {rows.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className='text-fg-secondary whitespace-nowrap'>
                {dates.dateTime(entry.createdAt)}
              </TableCell>
              <TableCell>
                <LedgerTypeBadge type={entry.type} />
              </TableCell>
              <TableCell>
                <div>{entry.description}</div>
                {entry.actor && (
                  <div className='text-fg-muted text-[13px]'>
                    {copy(`oleh ${entry.actor.name}`, `by ${entry.actor.name}`)}
                  </div>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-end font-medium tabular-nums',
                  entry.points > 0 ? 'text-status-success' : 'text-fg-secondary'
                )}
              >
                {formatPointsChange(entry.points)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatPoints(entry.balanceAfter)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TabPanel>
  )
}

function Redemptions({ customerId }: { customerId: string }) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const [page, setPage] = usePage()
  const query = useCustomerRedemptionsQuery(customerId, page)
  const rows = query.data?.data ?? []

  return (
    <div className='flex flex-col gap-2'>
      <TabPanel
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={rows.length === 0}
        empty={copy('Belum pernah menukar hadiah', 'No rewards redeemed yet')}
        footer={
          <ListPager
            className='border-divider border-t'
            total={query.data?.meta.total ?? 0}
            {...page}
            onChange={setPage}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy('Waktu', 'Date')}</TableHead>
              <TableHead>{copy('Hadiah', 'Reward')}</TableHead>
              <TableHead>{copy('Transaksi', 'Transaction')}</TableHead>
              <TableHead className='text-end'>
                {copy('Poin', 'Points')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(query.isPlaceholderData && 'opacity-60')}>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='text-fg-secondary whitespace-nowrap'>
                  {dates.dateTime(r.createdAt)}
                </TableCell>
                <TableCell>
                  {r.reward.name}
                  {r.isVoided && (
                    <Badge variant='outline' className='ms-2'>
                      {copy('Dibatalkan', 'Voided')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className='text-fg-secondary'>
                  {r.transaction
                    ? `${r.transaction.transactionNo} · ${r.transaction.outlet.name}`
                    : '—'}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatPointsChange(-r.pointsSpent)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>
      <p className='text-fg-muted text-[13px]'>
        {copy(
          'Penukaran saat kasir offline tercatat di riwayat poin.',
          'Redemptions made while a register was offline appear in the points history.'
        )}
      </p>
    </div>
  )
}

function Transactions({ customerId }: { customerId: string }) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const [page, setPage] = usePage()
  const query = useCustomerTransactionsQuery(customerId, page)
  const rows = query.data?.data ?? []

  return (
    <TabPanel
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      isEmpty={rows.length === 0}
      empty={copy('Belum ada transaksi', 'No transactions yet')}
      footer={
        <ListPager
          className='border-divider border-t'
          total={query.data?.meta.total ?? 0}
          {...page}
          onChange={setPage}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy('Waktu', 'Date')}</TableHead>
            <TableHead>{copy('No. transaksi', 'Transaction')}</TableHead>
            <TableHead>{copy('Gerai', 'Outlet')}</TableHead>
            <TableHead className='text-end'>{copy('Item', 'Items')}</TableHead>
            <TableHead className='text-end'>{copy('Total', 'Total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isPlaceholderData && 'opacity-60')}>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell className='text-fg-secondary whitespace-nowrap'>
                {dates.dateTime(t.transactionDate)}
              </TableCell>
              <TableCell className='tabular-nums'>{t.transactionNo}</TableCell>
              <TableCell>{t.outlet.name}</TableCell>
              <TableCell className='text-end tabular-nums'>
                {t.items.reduce((sum, item) => sum + item.quantity, 0)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatMoney(t.grandTotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TabPanel>
  )
}
