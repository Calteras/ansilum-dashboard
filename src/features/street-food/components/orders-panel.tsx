import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { MapPin, Receipt } from '@/components/icons'
import { useOrdersQuery } from '../street-food.queries'
import type {
  OrderStatus,
  OrderView,
  StreetFoodOutlet,
  StreetOrder,
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
  const outletId = outlets.some((o) => o.outletId === picked)
    ? picked
    : outlets[0]?.outletId
  const query = useOrdersQuery(tenantId, outletId, view)

  const views: { value: OrderView; label: string }[] = [
    { value: 'waiting', label: copy('Menunggu', 'Waiting') },
    { value: 'active', label: copy('Diproses', 'In progress') },
    { value: 'done', label: copy('Selesai', 'Done') },
  ]

  return (
    <div className='space-y-3'>
      {outlets.length > 1 && (
        <Select value={outletId} onValueChange={setPicked}>
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
                ? copy('Tidak ada pesanan diproses', 'No orders in progress')
                : copy('Belum ada pesanan selesai', 'No finished orders yet')
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
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order }: { order: StreetOrder }) {
  const copy = useCopy()
  const status: Record<OrderStatus, string> = {
    PENDING_ACCEPTANCE: copy('Menunggu', 'Waiting'),
    ACCEPTED: copy('Diterima', 'Accepted'),
    PREPARING: copy('Disiapkan', 'Preparing'),
    READY: copy('Siap', 'Ready'),
    COMPLETED: copy('Selesai', 'Completed'),
    REJECTED: copy('Ditolak', 'Rejected'),
    CANCELLED: copy('Dibatalkan', 'Cancelled'),
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

  return (
    <li className='flex items-start justify-between gap-3 py-3'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>
          {order.customerName || order.platformOrderId}
        </p>
        <p className='text-fg-muted text-xs'>
          {time} · {where}
          {order.fulfillment.label ? ` ${order.fulfillment.label}` : ''} ·{' '}
          {copy(`${order.itemCount} item`, `${order.itemCount} items`)}
        </p>
        <p className='text-fg-muted text-xs'>
          {order.paymentMode === 'PREPAID'
            ? copy('Sudah dibayar online', 'Paid online')
            : copy('Bayar di tempat', 'Pay at pickup')}
        </p>
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
