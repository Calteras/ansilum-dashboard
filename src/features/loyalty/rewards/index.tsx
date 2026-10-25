import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataPanel } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import {
  CircleOff,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
} from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useHasAnyRole } from '@/features/auth/hooks/use-auth'
import {
  useRewardActiveMutation,
  useRewardRedemptionsQuery,
  useRewardsQuery,
} from '../api/loyalty.queries'
import type { PageParams, Reward, RewardType } from '../api/loyalty.types'
import { ListPager, RewardStateBadge } from '../components/loyalty-ui'
import { useLoyaltyDates } from '../hooks'
import {
  formatPoints,
  rewardState,
  rewardTypeLabel,
  rewardValue,
  type RewardState,
} from '../lib/loyalty'
import { RewardFormDialog } from './reward-form-dialog'

type Availability = 'all' | 'available' | 'unavailable'
const AVAILABLE: RewardState[] = ['active', 'expiring']

type Open =
  | { kind: 'create' }
  | { kind: 'edit' | 'redemptions' | 'deactivate'; reward: Reward }
  | null

export function Rewards() {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const canManage = useHasAnyRole(['OWNER', 'ADMIN'])
  const query = useRewardsQuery()
  const toggle = useRewardActiveMutation()
  const [open, setOpen] = useState<Open>(null)
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState<Availability>('all')
  const [type, setType] = useState<'all' | RewardType>('all')

  // One clock per visit, so states don't flicker between renders.
  const [now] = useState(() => Date.now())
  const all = query.data?.data ?? []
  const rows = all.filter((reward) => {
    const state = rewardState(reward, now)
    if (availability === 'available' && !AVAILABLE.includes(state)) return false
    if (availability === 'unavailable' && AVAILABLE.includes(state))
      return false
    if (type !== 'all' && reward.type !== type) return false
    return reward.name.toLowerCase().includes(search.trim().toLowerCase())
  })

  return (
    <>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4'>
        <PageHeader
          title={copy('Hadiah', 'Rewards')}
          description={copy(
            'Katalog penukaran poin yang tersedia di semua kasir',
            'What customers can redeem points for, at every register'
          )}
          actions={
            canManage && (
              <Button onClick={() => setOpen({ kind: 'create' })}>
                <Plus size={16} />
                {copy('Hadiah baru', 'New reward')}
              </Button>
            )
          }
        />

        <ContextToolbar aria-label={copy('Filter hadiah', 'Reward filters')}>
          <Input
            type='search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={copy('Cari hadiah…', 'Search rewards…')}
            aria-label={copy('Cari hadiah', 'Search rewards')}
            className='h-8 w-full sm:w-56'
          />
          <SegmentedControl<Availability>
            aria-label={copy('Ketersediaan', 'Availability')}
            value={availability}
            onValueChange={setAvailability}
            options={[
              { value: 'all', label: copy('Semua', 'All') },
              { value: 'available', label: copy('Bisa ditukar', 'Available') },
              {
                value: 'unavailable',
                label: copy('Tidak tersedia', 'Unavailable'),
              },
            ]}
          />
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger size='sm' aria-label={copy('Jenis', 'Type')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>
                {copy('Semua jenis', 'All types')}
              </SelectItem>
              {(
                ['DISCOUNT_FIXED', 'DISCOUNT_PERCENT', 'FREE_ITEM'] as const
              ).map((t) => (
                <SelectItem key={t} value={t}>
                  {rewardTypeLabel(t, copy)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ContextToolbar>

        <DataPanel className='overflow-hidden'>
          {query.isError ? (
            <ErrorState
              title={copy('Hadiah belum termuat', "Rewards couldn't load")}
              description={query.error.message}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : !query.isLoading && rows.length === 0 ? (
            <EmptyState
              title={
                all.length === 0
                  ? copy('Belum ada hadiah', 'No rewards yet')
                  : copy('Tidak ada hadiah yang cocok', 'No rewards match')
              }
              description={
                all.length === 0
                  ? copy(
                      'Buat hadiah pertama agar pelanggan punya alasan mengumpulkan poin.',
                      'Create a first reward so customers have something to collect points for.'
                    )
                  : undefined
              }
              action={
                all.length === 0 &&
                canManage && (
                  <Button size='sm' onClick={() => setOpen({ kind: 'create' })}>
                    <Plus size={16} />
                    {copy('Hadiah baru', 'New reward')}
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy('Hadiah', 'Reward')}</TableHead>
                  <TableHead className='text-end'>
                    {copy('Harga poin', 'Cost')}
                  </TableHead>
                  <TableHead className='text-end max-md:hidden'>
                    {copy('Min. belanja', 'Min. spend')}
                  </TableHead>
                  <TableHead className='text-end max-md:hidden'>
                    {copy('Ditukar', 'Redeemed')}
                  </TableHead>
                  <TableHead className='max-lg:hidden'>
                    {copy('Berlaku sampai', 'Valid until')}
                  </TableHead>
                  <TableHead>{copy('Status', 'Status')}</TableHead>
                  <TableHead className='w-10'>
                    <span className='sr-only'>{copy('Aksi', 'Actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <span className='bg-surface-hover block h-5 animate-pulse rounded' />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div className='font-medium'>{reward.name}</div>
                          <div className='text-fg-muted text-[13px]'>
                            {rewardValue(reward, copy)}
                          </div>
                        </TableCell>
                        <TableCell className='text-end font-medium tabular-nums'>
                          {copy(
                            `${formatPoints(reward.pointsCost)} poin`,
                            `${formatPoints(reward.pointsCost)} pts`
                          )}
                        </TableCell>
                        <TableCell className='text-fg-secondary text-end tabular-nums max-md:hidden'>
                          {reward.minimumAmount != null &&
                          Number(reward.minimumAmount) > 0
                            ? formatMoney(reward.minimumAmount)
                            : '—'}
                        </TableCell>
                        <TableCell className='text-end tabular-nums max-md:hidden'>
                          {formatPoints(reward.totalRedemptions)}
                          <span className='text-fg-muted'>
                            {' / '}
                            {reward.maxRedemptions ?? '∞'}
                          </span>
                        </TableCell>
                        <TableCell className='text-fg-secondary max-lg:hidden'>
                          {reward.expiresAt
                            ? dates.date(reward.expiresAt)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <RewardStateBadge state={rewardState(reward, now)} />
                        </TableCell>
                        <TableCell>
                          <RewardActions
                            reward={reward}
                            canManage={canManage}
                            onOpen={(kind) => setOpen({ kind, reward })}
                            onActivate={() =>
                              toggle.mutate({ id: reward.id, isActive: true })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}
        </DataPanel>
        <p className='text-fg-muted text-[13px]'>
          {copy(
            'Jumlah ditukar menghitung penukaran yang diverifikasi online. Hadiah diskon tanpa kuota juga bisa ditukar di kasir offline; penukaran itu tercatat di riwayat poin pelanggan.',
            "Redeemed counts redemptions verified online. Uncapped discount rewards can also be redeemed at offline registers; those appear in each customer's points history."
          )}
        </p>
      </Main>

      {open?.kind === 'create' && (
        <RewardFormDialog
          open
          onOpenChange={(next) => !next && setOpen(null)}
        />
      )}
      {open?.kind === 'edit' && (
        <RewardFormDialog
          reward={open.reward}
          open
          onOpenChange={(next) => !next && setOpen(null)}
        />
      )}
      <RedemptionsSheet
        reward={open?.kind === 'redemptions' ? open.reward : null}
        onClose={() => setOpen(null)}
      />
      <ConfirmDialog
        open={open?.kind === 'deactivate'}
        onOpenChange={(next) => !next && setOpen(null)}
        title={copy('Nonaktifkan hadiah?', 'Deactivate this reward?')}
        desc={copy(
          'Kasir berhenti menawarkannya setelah daftar hadiah diperbarui. Riwayat penukaran tetap tersimpan, dan Anda bisa mengaktifkannya lagi.',
          'Registers stop offering it once their reward list refreshes. Past redemptions are kept, and you can activate it again.'
        )}
        confirmText={copy('Nonaktifkan', 'Deactivate')}
        cancelBtnText={copy('Batal', 'Cancel')}
        destructive
        isLoading={toggle.isPending}
        handleConfirm={async () => {
          if (open?.kind !== 'deactivate') return
          try {
            await toggle.mutateAsync({ id: open.reward.id, isActive: false })
            setOpen(null)
          } catch {
            // Toast shown by the mutation
          }
        }}
      />
    </>
  )
}

function RewardActions({
  reward,
  canManage,
  onOpen,
  onActivate,
}: {
  reward: Reward
  canManage: boolean
  onOpen: (kind: 'edit' | 'redemptions' | 'deactivate') => void
  onActivate: () => void
}) {
  const copy = useCopy()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>{copy('Buka menu', 'Open menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[190px]'>
        <DropdownMenuItem onClick={() => onOpen('redemptions')}>
          {copy('Lihat penukaran', 'View redemptions')}
          <DropdownMenuShortcut>
            <ClipboardList size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuItem onClick={() => onOpen('edit')}>
              {copy('Ubah', 'Edit')}
              <DropdownMenuShortcut>
                <Pencil size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {reward.isActive ? (
              <DropdownMenuItem
                onClick={() => onOpen('deactivate')}
                className='text-status-danger!'
              >
                {copy('Nonaktifkan', 'Deactivate')}
                <DropdownMenuShortcut>
                  <CircleOff size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onActivate}>
                {copy('Aktifkan', 'Activate')}
                <DropdownMenuShortcut>
                  <RotateCcw size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RedemptionsSheet({
  reward,
  onClose,
}: {
  reward: Reward | null
  onClose: () => void
}) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const [page, setPage] = useState<Required<PageParams>>({
    limit: 20,
    offset: 0,
  })
  const query = useRewardRedemptionsQuery(reward?.id ?? '', page)
  const rows = query.data?.data ?? []

  return (
    <Sheet
      open={!!reward}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
          setPage({ limit: 20, offset: 0 })
        }
      }}
    >
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{reward?.name}</SheetTitle>
          <SheetDescription>
            {copy(
              'Penukaran yang diverifikasi online, terbaru di atas.',
              'Redemptions verified online, newest first.'
            )}
          </SheetDescription>
        </SheetHeader>
        <div className='px-4'>
          {query.isError ? (
            <ErrorState
              title={copy('Belum termuat', "Couldn't load")}
              description={query.error.message}
              onRetry={() => void query.refetch()}
            />
          ) : !query.isLoading && rows.length === 0 ? (
            <EmptyState
              title={copy('Belum ada penukaran', 'No redemptions yet')}
            />
          ) : (
            <ul
              className={cn(
                'divide-divider divide-y',
                query.isPlaceholderData && 'opacity-60'
              )}
            >
              {rows.map((r) => (
                <li
                  key={r.id}
                  className='flex items-start justify-between gap-3 py-3'
                >
                  <div className='min-w-0'>
                    <Link
                      to='/customers/$customerId'
                      params={{ customerId: r.customer.id }}
                      className='font-medium hover:underline'
                    >
                      {r.customer.name}
                    </Link>
                    <div className='text-fg-muted text-[13px]'>
                      {dates.dateTime(r.createdAt)}
                      {r.transaction &&
                        ` · ${r.transaction.transactionNo} · ${r.transaction.outlet.name}`}
                    </div>
                  </div>
                  <div className='text-end text-[13px] whitespace-nowrap tabular-nums'>
                    {copy(
                      `${formatPoints(r.pointsSpent)} poin`,
                      `${formatPoints(r.pointsSpent)} pts`
                    )}
                    {r.isVoided && (
                      <div className='text-fg-muted'>
                        {copy('Dibatalkan', 'Voided')}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ListPager
          total={query.data?.meta.total ?? 0}
          {...page}
          pageSizes={[20, 50]}
          onChange={setPage}
        />
      </SheetContent>
    </Sheet>
  )
}
