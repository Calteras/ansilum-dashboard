import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import {
  MapPin,
  Receipt,
  Search,
  ThumbsDown,
  ThumbsUp,
} from '@/components/icons'
import {
  useBlockMutation,
  useNoShowMutation,
  useOrdersByCodeQuery,
  useOrdersQuery,
  useRateMutation,
} from '../street-food.queries'
import type {
  CustomerTrust,
  OrderStatus,
  OrderView,
  StreetFoodOutlet,
  StreetOrder,
  TrustLabel,
} from '../street-food.types'

const TONE: Record<OrderStatus, keyof typeof STATUS_TONE> = {
  PENDING_ACCEPTANCE: 'warning',
  ACCEPTED: 'info',
  PREPARING: 'info',
  READY: 'success',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
}

/**
 * The right-hand side of the StreetFood page: this outlet's orders as a list, and the
 * vendors' live locations (not built yet).
 */
export function OrdersPanel({
  tenantId,
  outlets,
}: {
  tenantId: string | undefined
  outlets: StreetFoodOutlet[]
}) {
  const copy = useCopy()
  return (
    <aside
      aria-label={copy('Pesanan dan lokasi', 'Orders and location')}
      className='bg-card shadow-surface min-w-0 self-start rounded-lg border p-4 sm:p-5'
    >
      <Tabs defaultValue='orders'>
        <TabsList className='w-full sm:w-fit'>
          <TabsTrigger value='orders'>
            <Receipt aria-hidden />
            {copy('Daftar pesanan', 'Orders')}
          </TabsTrigger>
          <TabsTrigger value='location'>
            <MapPin aria-hidden />
            {copy('Lokasi vendor', 'Vendor location')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='orders' className='pt-3'>
          <OrdersList tenantId={tenantId} outlets={outlets} />
        </TabsContent>
        <TabsContent value='location' className='pt-3'>
          <LocationPlaceholder />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

function OrdersList({
  tenantId,
  outlets,
}: {
  tenantId: string | undefined
  outlets: StreetFoodOutlet[]
}) {
  const copy = useCopy()
  const [picked, setPicked] = useState<string | undefined>()
  const [view, setView] = useState<OrderView>('waiting')
  const [code, setCode] = useState('')
  const [noShowFor, setNoShowFor] = useState<StreetOrder | null>(null)
  const [blockFor, setBlockFor] = useState<StreetOrder | null>(null)
  const outletId = outlets.some((o) => o.outletId === picked)
    ? picked
    : outlets[0]?.outletId
  const query = useOrdersQuery(tenantId, outletId, view)
  const found = useOrdersByCodeQuery(tenantId, outletId, code)
  const noShow = useNoShowMutation(tenantId, {
    failed: copy('Belum berhasil', 'That did not work'),
    saved: copy(
      'Pesanan ditandai tidak diambil',
      'Order marked as not picked up'
    ),
  })

  const failed = copy('Belum berhasil', 'That did not work')
  const rate = useRateMutation(tenantId, { failed })
  const block = useBlockMutation(tenantId, {
    failed,
    saved: copy(
      'Pelanggan ini tidak akan dilayani lagi',
      'This customer will not be served again'
    ),
  })
  const actions = {
    onNoShow: setNoShowFor,
    onBlock: setBlockFor,
    onRate: (order: StreetOrder, rating: 'UP' | 'DOWN') => {
      if (outletId) rate.mutate({ outletId, orderId: order.id, rating })
    },
  }

  const views: { value: OrderView; label: string }[] = [
    { value: 'waiting', label: copy('Menunggu', 'Waiting') },
    { value: 'active', label: copy('Diproses', 'In progress') },
    { value: 'done', label: copy('Selesai', 'Done') },
  ]

  return (
    <div className='space-y-3'>
      {outlets.length > 1 && (
        <Select
          value={outletId}
          onValueChange={(value) => {
            setPicked(value)
            setCode('')
          }}
        >
          <SelectTrigger aria-label={copy('Outlet', 'Outlet')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {outlets.map((o) => (
              <SelectItem key={o.outletId} value={o.outletId}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className='relative'>
        <Search
          size={16}
          aria-hidden
          className='text-fg-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'
        />
        <Input
          value={code}
          inputMode='numeric'
          autoComplete='off'
          maxLength={4}
          className='pl-9'
          aria-label={copy('Kode ambil pelanggan', "Customer's pickup code")}
          placeholder={copy('Kode ambil pelanggan', "Customer's pickup code")}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
      </div>

      {code.length === 4 ? (
        <section
          aria-label={copy('Hasil kode', 'Code result')}
          className='space-y-1'
        >
          {found.isPending ? (
            <Skeleton className='h-14 w-full' />
          ) : found.isError ? (
            <ErrorState
              title={copy(
                'Kode tidak bisa dicari',
                'The code could not be looked up'
              )}
              description={found.error.message}
              onRetry={() => void found.refetch()}
              isRetrying={found.isFetching}
            />
          ) : found.data.length === 0 ? (
            <p className='text-fg-muted text-sm'>
              {copy(
                'Tidak ada pesanan dengan kode ini. Minta pelanggan memeriksa layarnya.',
                'No order with this code. Ask the customer to check their screen.'
              )}
            </p>
          ) : (
            <ul className='divide-divider divide-y rounded-md border px-3'>
              {found.data.map((order) => (
                <OrderRow key={order.id} order={order} {...actions} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <div
            role='group'
            aria-label={copy('Tampilkan pesanan', 'Show orders')}
            className='border-divider bg-surface-subtle inline-flex w-full gap-0.5 rounded-md border p-0.5'
          >
            {views.map((v) => (
              <button
                key={v.value}
                type='button'
                aria-pressed={view === v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  'text-fg-muted flex-1 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors',
                  view === v.value &&
                    'bg-card text-foreground ring-divider-strong ring-1'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {query.isPending ? (
            <div
              role='status'
              aria-label={copy('Memuat', 'Loading')}
              className='space-y-2'
            >
              <Skeleton className='h-14 w-full' />
              <Skeleton className='h-14 w-full' />
            </div>
          ) : query.isError ? (
            <ErrorState
              title={copy('Pesanan tidak bisa dimuat', 'Orders could not load')}
              description={query.error.message}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : query.data.length === 0 ? (
            <EmptyState
              title={
                view === 'waiting'
                  ? copy('Tidak ada pesanan menunggu', 'No orders waiting')
                  : view === 'active'
                    ? copy(
                        'Tidak ada pesanan diproses',
                        'No orders in progress'
                      )
                    : copy(
                        'Belum ada pesanan selesai',
                        'No finished orders yet'
                      )
              }
              description={
                view === 'done'
                  ? copy(
                      'Menampilkan 24 jam terakhir.',
                      'Showing the last 24 hours.'
                    )
                  : undefined
              }
              className='py-6'
            />
          ) : (
            <ul className='divide-divider divide-y'>
              {query.data.map((order) => (
                <OrderRow key={order.id} order={order} {...actions} />
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={blockFor !== null}
        onOpenChange={(open) => !open && setBlockFor(null)}
        destructive
        title={copy(
          'Jangan layani pelanggan ini lagi?',
          'Stop serving this customer?'
        )}
        desc={copy(
          'Pesanan berikutnya dari pelanggan ini ditolak di semua outlet Anda, tanpa alasan yang ditampilkan kepadanya. Anda bisa membukanya lagi di halaman ini.',
          'Their next orders are refused at all your outlets, with no reason shown to them. You can undo it on this page.'
        )}
        confirmText={copy('Jangan layani lagi', 'Stop serving')}
        cancelBtnText={copy('Batal', 'Cancel')}
        isLoading={block.isPending}
        handleConfirm={() => {
          if (!blockFor || !outletId) return
          block.mutate(
            { outletId, orderId: blockFor.id },
            { onSettled: () => setBlockFor(null) }
          )
        }}
      />

      <ConfirmDialog
        open={noShowFor !== null}
        onOpenChange={(open) => !open && setNoShowFor(null)}
        title={copy('Tandai tidak diambil?', 'Mark as not picked up?')}
        desc={copy(
          'Pelanggan akan diberi tahu pesanannya tidak diambil. Penjualan tidak dicatat.',
          'The customer will be told the order was not picked up. No sale is recorded.'
        )}
        confirmText={copy('Tandai tidak diambil', 'Mark not picked up')}
        cancelBtnText={copy('Belum', 'Not yet')}
        isLoading={noShow.isPending}
        handleConfirm={() => {
          if (!noShowFor || !outletId) return
          noShow.mutate(
            { outletId, orderId: noShowFor.id },
            { onSettled: () => setNoShowFor(null) }
          )
        }}
      />
    </div>
  )
}

/** The time, refreshed every second while something waits on it. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/**
 * "Customer did not come". Locked until the customer has been waited for, so one who is on
 * the way is never marked, and it says how long is left.
 */
function NoShowAction({
  availableAt,
  onClick,
}: {
  availableAt: string
  onClick: () => void
}) {
  const copy = useCopy()
  const until = Date.parse(availableAt)
  const now = useNow(true)
  const left = until - now
  const locked = left > 0

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      disabled={locked}
      onClick={onClick}
    >
      {locked
        ? copy(`Tunggu ${clock(left)} lagi`, `Wait ${clock(left)} more`)
        : copy('Pelanggan tidak datang', 'Customer did not come')}
    </Button>
  )
}

const LABEL_TONE: Record<TrustLabel, keyof typeof STATUS_TONE> = {
  NEW: 'neutral',
  RELIABLE: 'success',
  CAUTION: 'warning',
  PREPAY_REQUIRED: 'danger',
}

/** The platform's word on the customer: a label and a few facts, never a score. */
function TrustNote({ trust }: { trust: CustomerTrust }) {
  const copy = useCopy()
  const label: Record<TrustLabel, string> = {
    NEW: copy('Pelanggan baru', 'New customer'),
    RELIABLE: copy('Terpercaya', 'Reliable'),
    CAUTION: copy('Hati-hati', 'Caution'),
    PREPAY_REQUIRED: copy('Wajib bayar di muka', 'Prepay required'),
  }
  const facts = [
    trust.completedOrders > 0
      ? copy(
          `${trust.completedOrders} pesanan selesai`,
          `${trust.completedOrders} completed`
        )
      : null,
    trust.noShowsLast90Days > 0
      ? copy(
          `${trust.noShowsLast90Days} tidak diambil dalam 90 hari`,
          `${trust.noShowsLast90Days} not picked up in 90 days`
        )
      : null,
  ].filter(Boolean)

  return (
    <p className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1'>
      <Badge
        variant='outline'
        className={cn(STATUS_TONE[LABEL_TONE[trust.label]])}
      >
        {label[trust.label]}
      </Badge>
      {facts.length > 0 && (
        <span className='text-fg-muted text-xs'>{facts.join(' · ')}</span>
      )}
    </p>
  )
}

/**
 * Two thumbs, one tap, nothing to fill in. It shows at once; if the POS refuses it, the
 * message appears and the thumb goes back. A no-show already counts, so it is shown as given.
 */
function RateThumbs({
  order,
  onRate,
}: {
  order: StreetOrder
  onRate: (order: StreetOrder, rating: 'UP' | 'DOWN') => void
}) {
  const copy = useCopy()
  const [tapped, setTapped] = useState<'UP' | 'DOWN' | null>(null)
  const shown = order.rating ?? tapped
  const locked = !order.canRate || tapped !== null

  const thumb = (rating: 'UP' | 'DOWN') => {
    const Icon = rating === 'UP' ? ThumbsUp : ThumbsDown
    const label =
      rating === 'UP'
        ? copy('Pelanggan baik', 'Good customer')
        : copy('Pelanggan bermasalah', 'Problem customer')
    return (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className={cn('size-8', shown === rating && 'bg-muted')}
        aria-label={label}
        aria-pressed={shown === rating}
        disabled={locked}
        onClick={() => {
          setTapped(rating)
          onRate(order, rating)
        }}
      >
        <Icon size={16} aria-hidden />
      </Button>
    )
  }

  return (
    <span className='inline-flex items-center gap-0.5'>
      {thumb('UP')}
      {thumb('DOWN')}
      {order.ratingCounted && (
        <span className='text-fg-muted ml-1 text-xs'>
          {copy('Sudah dihitung', 'Already counted')}
        </span>
      )}
    </span>
  )
}

function OrderRow({
  order,
  onNoShow,
  onRate,
  onBlock,
}: {
  order: StreetOrder
  onNoShow: (order: StreetOrder) => void
  onRate: (order: StreetOrder, rating: 'UP' | 'DOWN') => void
  onBlock: (order: StreetOrder) => void
}) {
  const copy = useCopy()
  const status: Record<OrderStatus, string> = {
    PENDING_ACCEPTANCE: copy('Menunggu', 'Waiting'),
    ACCEPTED: copy('Diterima', 'Accepted'),
    PREPARING: copy('Disiapkan', 'Preparing'),
    READY: copy('Siap', 'Ready'),
    COMPLETED: copy('Selesai', 'Completed'),
    REJECTED: copy('Ditolak', 'Rejected'),
    CANCELLED:
      order.reasonCode === 'NO_SHOW'
        ? copy('Tidak diambil', 'Not picked up')
        : copy('Dibatalkan', 'Cancelled'),
    EXPIRED: copy('Kedaluwarsa', 'Expired'),
  }
  const time = new Date(order.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
  const where =
    order.fulfillment.type === 'DINE_IN'
      ? copy('Makan di tempat', 'Dine in')
      : copy('Ambil', 'Pickup')
  const rateable = order.canRate || order.rating !== null

  return (
    <li className='flex items-start justify-between gap-3 py-3'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>
          {order.customerName || order.platformOrderId}
          {order.pickupCode && (
            <span className='text-fg-muted ml-2 font-mono text-xs'>
              #{order.pickupCode}
            </span>
          )}
        </p>
        {order.customerTrust && <TrustNote trust={order.customerTrust} />}
        <p className='text-fg-muted mt-1 text-xs'>
          {time} · {where}
          {order.fulfillment.label ? ` ${order.fulfillment.label}` : ''} ·{' '}
          {copy(`${order.itemCount} item`, `${order.itemCount} items`)}
        </p>
        <p className='text-fg-muted text-xs'>
          {order.paymentMode === 'PREPAID'
            ? copy('Sudah dibayar online', 'Paid online')
            : copy('Bayar di tempat', 'Pay at pickup')}
        </p>
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          {order.status === 'READY' && order.noShowAvailableAt && (
            <NoShowAction
              availableAt={order.noShowAvailableAt}
              onClick={() => onNoShow(order)}
            />
          )}
          {rateable && <RateThumbs order={order} onRate={onRate} />}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-fg-muted h-8'
            onClick={() => onBlock(order)}
          >
            {copy('Jangan layani lagi', 'Do not serve again')}
          </Button>
        </div>
      </div>
      <div className='flex shrink-0 flex-col items-end gap-1'>
        <span className='text-sm font-medium tabular-nums'>
          {formatMoney(order.totalMinor / 100)}
        </span>
        <Badge
          variant='outline'
          className={cn(STATUS_TONE[TONE[order.status]])}
        >
          {status[order.status]}
        </Badge>
      </div>
    </li>
  )
}

/** Placeholder: the vendors' live positions on a map are still being built. */
function LocationPlaceholder() {
  const copy = useCopy()
  return (
    <div className='border-divider flex min-h-64 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center'>
      <span className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full'>
        <MapPin size={20} aria-hidden />
      </span>
      <Badge variant='outline' className={cn(STATUS_TONE.warning)}>
        WIP
      </Badge>
      <p className='text-sm font-medium'>
        {copy('Lokasi vendor secara langsung', 'Live vendor location')}
      </p>
      <p className='text-fg-muted max-w-xs text-xs'>
        {copy(
          'Sedang dikerjakan. Peta posisi gerai keliling akan tampil di sini.',
          'Work in progress. A map of your mobile vendors will appear here.'
        )}
      </p>
    </div>
  )
}
