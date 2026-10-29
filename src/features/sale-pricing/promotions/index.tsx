import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import {
  BarChart3,
  CircleOff,
  Pencil,
  Plus,
  RotateCcw,
} from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useHasAnyRole } from '@/features/auth/hooks/use-auth'
import {
  usePricingSettingsQuery,
  usePromotionActiveMutation,
  usePromotionsQuery,
} from '../api/pricing.queries'
import {
  PROMOTION_TYPES,
  type Promotion,
  type PromotionType,
} from '../api/pricing.types'
import { Notice, PromotionStateBadge } from '../components/pricing-ui'
import { usePricingDates } from '../hooks'
import {
  DEFAULT_TIMEZONE,
  formatUses,
  promotionBenefit,
  promotionConditions,
  promotionState,
  promotionTypeLabel,
  type PromotionState,
} from '../lib/pricing'
import { ManualDiscountForm } from './manual-discount-form'
import { PromotionFormDialog } from './promotion-form-dialog'
import { PromotionPerformanceSheet } from './promotion-performance-sheet'

type Filter = 'all' | 'running' | 'scheduled' | 'stopped'
const ORDER: PromotionState[] = [
  'running',
  'scheduled',
  'usedUp',
  'ended',
  'inactive',
]

type Open =
  | { kind: 'create' }
  | { kind: 'edit' | 'performance' | 'deactivate'; promotion: Promotion }
  | null

export function Promotions() {
  const copy = useCopy()
  const canManage = useHasAnyRole(['OWNER', 'ADMIN'])
  const [tab, setTab] = useState<'campaigns' | 'manual'>('campaigns')
  const settings = usePricingSettingsQuery()
  const timezone = settings.data?.timezone ?? DEFAULT_TIMEZONE

  return (
    <>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4'>
        <PageHeader
          title={copy('Promo & diskon', 'Promotions & discounts')}
          description={copy(
            'Kampanye potongan harga dan batas diskon yang diberikan kasir',
            'Discount campaigns and the limits on discounts cashiers give'
          )}
        />
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as typeof tab)}
          className='gap-0'
        >
          <TabsList variant='line'>
            <TabsTrigger value='campaigns'>
              {copy('Kampanye promo', 'Campaigns')}
            </TabsTrigger>
            <TabsTrigger value='manual'>
              {copy('Diskon manual', 'Manual discounts')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='campaigns' className='grid gap-4 pt-4'>
            <Campaigns canManage={canManage} timezone={timezone} />
          </TabsContent>
          <TabsContent value='manual' className='grid max-w-3xl gap-4 pt-4'>
            <DataPanel className='p-4 sm:p-5'>
              <SectionHeader
                title={copy(
                  'Diskon manual di kasir',
                  'Manual discounts at the register'
                )}
                description={copy(
                  'Potongan yang diberikan kasir sendiri, di luar promo dan hadiah poin.',
                  'Reductions a cashier gives by hand, apart from promotions and rewards.'
                )}
                className='mb-4'
              />
              {settings.isError ? (
                <ErrorState
                  title={copy('Aturan belum termuat', "Rules couldn't load")}
                  description={settings.error.message}
                  onRetry={() => void settings.refetch()}
                />
              ) : settings.data ? (
                <ManualDiscountForm
                  key={JSON.stringify(settings.data.controls)}
                  controls={settings.data.controls}
                  canEdit={canManage}
                />
              ) : (
                <div className='bg-surface-hover h-48 animate-pulse rounded' />
              )}
            </DataPanel>
            <p className='text-fg-muted text-[13px]'>
              {copy(
                'Berlaku untuk transaksi yang dihitung online. Aplikasi kasir versi saat ini belum menerapkan batas ini saat offline.',
                'Applies to sales priced online. The current register app does not enforce these limits offline yet.'
              )}
            </p>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function Campaigns({
  canManage,
  timezone,
}: {
  canManage: boolean
  timezone: string
}) {
  const copy = useCopy()
  const dates = usePricingDates()
  const query = usePromotionsQuery()
  const toggle = usePromotionActiveMutation()
  const [open, setOpen] = useState<Open>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [type, setType] = useState<'all' | PromotionType>('all')

  // One clock per visit, so states don't flicker between renders.
  const [now] = useState(() => Date.now())
  const all = query.data ?? []
  const term = search.trim().toLowerCase()
  const rows = all
    .map((promotion) => ({ promotion, state: promotionState(promotion, now) }))
    .filter(({ promotion, state }) => {
      if (filter === 'running' && state !== 'running') return false
      if (filter === 'scheduled' && state !== 'scheduled') return false
      if (
        filter === 'stopped' &&
        (state === 'running' || state === 'scheduled')
      )
        return false
      if (type !== 'all' && promotion.discountType !== type) return false
      return (
        promotion.name.toLowerCase().includes(term) ||
        promotion.code.toLowerCase().includes(term)
      )
    })
    .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state))

  const period = (promotion: Promotion) =>
    promotion.validUntil
      ? `${dates.date(promotion.validFrom)} – ${dates.date(promotion.validUntil)}`
      : copy(
          `Mulai ${dates.date(promotion.validFrom)}`,
          `From ${dates.date(promotion.validFrom)}`
        )

  return (
    <>
      <Notice
        title={copy(
          'Promo dihitung oleh server',
          'Promotions are applied by the server'
        )}
      >
        {copy(
          'Promo berlaku untuk transaksi dan reservasi yang dihitung online. Aplikasi kasir versi saat ini belum menerapkan kode promo atau promo otomatis; kasir offline tetap bisa memberi diskon manual.',
          'They apply to sales and reservations priced online. The current register app does not apply promo codes or automatic promotions yet; offline registers can still give manual discounts.'
        )}
      </Notice>

      <ContextToolbar
        aria-label={copy('Filter promo', 'Promotion filters')}
        actions={
          canManage && (
            <Button size='sm' onClick={() => setOpen({ kind: 'create' })}>
              <Plus size={16} />
              {copy('Promo baru', 'New promotion')}
            </Button>
          )
        }
      >
        <Input
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy('Cari nama atau kode…', 'Search name or code…')}
          aria-label={copy('Cari promo', 'Search promotions')}
          className='h-8 w-full sm:w-56'
        />
        <SegmentedControl<Filter>
          aria-label={copy('Status', 'Status')}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: copy('Semua', 'All') },
            { value: 'running', label: copy('Berjalan', 'Running') },
            { value: 'scheduled', label: copy('Terjadwal', 'Scheduled') },
            { value: 'stopped', label: copy('Selesai', 'Stopped') },
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
            {PROMOTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {promotionTypeLabel(t, copy)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ContextToolbar>

      <DataPanel className='overflow-hidden'>
        {query.isError ? (
          <ErrorState
            title={copy('Promo belum termuat', "Promotions couldn't load")}
            description={query.error.message}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : !query.isLoading && rows.length === 0 ? (
          <EmptyState
            title={
              all.length === 0
                ? copy('Belum ada promo', 'No promotions yet')
                : copy('Tidak ada promo yang cocok', 'No promotions match')
            }
            description={
              all.length === 0
                ? copy(
                    'Buat promo pertama: diskon persen, potongan harga, beli X gratis Y, atau harga paket.',
                    'Create a first promotion: percent off, amount off, buy X get Y or a bundle price.'
                  )
                : undefined
            }
            action={
              all.length === 0 &&
              canManage && (
                <Button size='sm' onClick={() => setOpen({ kind: 'create' })}>
                  <Plus size={16} />
                  {copy('Promo baru', 'New promotion')}
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy('Promo', 'Promotion')}</TableHead>
                <TableHead className='max-lg:hidden'>
                  {copy('Syarat', 'Conditions')}
                </TableHead>
                <TableHead className='max-md:hidden'>
                  {copy('Periode', 'Period')}
                </TableHead>
                <TableHead className='text-end max-sm:hidden'>
                  {copy('Dipakai', 'Uses')}
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
                      <TableCell colSpan={6}>
                        <span className='bg-surface-hover block h-5 animate-pulse rounded' />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map(({ promotion, state }) => (
                    <TableRow key={promotion.id}>
                      <TableCell className='whitespace-normal'>
                        <div className='font-medium'>{promotion.name}</div>
                        <div className='text-fg-muted text-[13px]'>
                          {promotionBenefit(promotion, copy)}
                          <span className='sm:hidden'>
                            {' · '}
                            {copy(
                              `${formatUses(promotion.usedCount)}/${promotion.usageLimit ?? '∞'} dipakai`,
                              `${formatUses(promotion.usedCount)}/${promotion.usageLimit ?? '∞'} used`
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-fg-secondary max-w-72 whitespace-normal max-lg:hidden'>
                        {promotionConditions(promotion, copy)}
                      </TableCell>
                      <TableCell className='text-fg-secondary max-md:hidden'>
                        {period(promotion)}
                      </TableCell>
                      <TableCell className='text-end tabular-nums max-sm:hidden'>
                        {formatUses(promotion.usedCount)}
                        <span className='text-fg-muted'>
                          {' / '}
                          {promotion.usageLimit ?? '∞'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PromotionStateBadge state={state} />
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <PromotionActions
                            promotion={promotion}
                            onOpen={(kind) => setOpen({ kind, promotion })}
                            onActivate={() =>
                              toggle.mutate({
                                id: promotion.id,
                                isActive: true,
                              })
                            }
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </DataPanel>
      <p className='text-fg-muted text-[13px]'>
        {copy(
          'Dipakai menghitung transaksi yang sudah dibayar dan yang sedang menahan promo. Transaksi terbuka yang tidak dibayar melepas promo setelah 30 menit.',
          'Uses count paid sales and sales holding the promotion. Unpaid open sales release it after 30 minutes.'
        )}
      </p>

      {open?.kind === 'create' && (
        <PromotionFormDialog
          open
          timezone={timezone}
          onOpenChange={(next) => !next && setOpen(null)}
        />
      )}
      {open?.kind === 'edit' && (
        <PromotionFormDialog
          promotion={open.promotion}
          open
          timezone={timezone}
          onOpenChange={(next) => !next && setOpen(null)}
        />
      )}
      <PromotionPerformanceSheet
        promotion={open?.kind === 'performance' ? open.promotion : null}
        onClose={() => setOpen(null)}
      />
      <ConfirmDialog
        open={open?.kind === 'deactivate'}
        onOpenChange={(next) => !next && setOpen(null)}
        title={copy('Nonaktifkan promo?', 'Deactivate this promotion?')}
        desc={copy(
          'Promo berhenti diterapkan ke transaksi baru. Transaksi terbuka yang sudah menahannya tetap bisa dibayar, riwayat pemakaian tetap tersimpan, dan Anda bisa mengaktifkannya lagi.',
          'New sales stop receiving it. Open sales already holding it can still be paid, usage history is kept, and you can activate it again.'
        )}
        confirmText={copy('Nonaktifkan', 'Deactivate')}
        cancelBtnText={copy('Batal', 'Cancel')}
        destructive
        isLoading={toggle.isPending}
        handleConfirm={async () => {
          if (open?.kind !== 'deactivate') return
          try {
            await toggle.mutateAsync({
              id: open.promotion.id,
              isActive: false,
            })
            setOpen(null)
          } catch {
            // Toast shown by the mutation
          }
        }}
      />
    </>
  )
}

function PromotionActions({
  promotion,
  onOpen,
  onActivate,
}: {
  promotion: Promotion
  onOpen: (kind: 'edit' | 'performance' | 'deactivate') => void
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
        <DropdownMenuItem onClick={() => onOpen('performance')}>
          {copy('Lihat kinerja', 'View performance')}
          <DropdownMenuShortcut>
            <BarChart3 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpen('edit')}>
          {copy('Ubah', 'Edit')}
          <DropdownMenuShortcut>
            <Pencil size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {promotion.isActive ? (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
