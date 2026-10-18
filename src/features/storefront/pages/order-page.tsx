import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { QRCodeSVG } from 'qrcode.react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  Copy,
  MapPin,
  Receipt,
  RefreshCw,
  Share2,
  Sun,
  X,
} from '@/components/icons'
import { StorefrontApiError } from '../api/storefront.api'
import { useOrderQuery } from '../api/storefront.queries'
import type { OrderStatus, PublicOrder } from '../api/storefront.types'
import {
  Awning,
  StoreLogo,
  StoreMessage,
  StorefrontShell,
} from '../components/storefront-shell'
import { stagger, useNow } from '../lib/motion'
import { usePageMeta } from '../lib/page-meta'
import { orderPath, rememberOrder, tokenFor } from '../lib/storefront-session'

const money = (minor: number) => formatMoney(minor / 100)

function time(iso: string, language: 'id' | 'en') {
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** /o/:code?t=… — the customer's order, to show at the counter. */
export function OrderPage({
  code,
  token: linkToken,
}: {
  code: string
  token?: string
}) {
  const copy = useCopy()
  const language = copy('id', 'en') as 'id' | 'en'
  const token = linkToken ?? tokenFor(code)
  const order = useOrderQuery(code, token)
  usePageMeta(
    order.data
      ? copy(`Pesanan ${order.data.code}`, `Order ${order.data.code}`)
      : null
  )

  // Reopening from another device: keep it for "Your last order".
  useEffect(() => {
    if (order.data && token && order.data.storefront.slug) {
      rememberOrder({
        code: order.data.code,
        token,
        slug: order.data.storefront.slug,
        storeName: order.data.storefront.name,
        placedAt: order.data.placedAt,
      })
    }
  }, [order.data, token])

  if (
    !token ||
    (order.isError &&
      order.error instanceof StorefrontApiError &&
      order.error.status === 404)
  ) {
    return (
      <StorefrontShell primaryColor={null}>
        <StoreMessage
          icon={Receipt}
          title={copy('Pesanan tidak ditemukan', 'Order not found')}
          description={copy(
            'Buka tautan pesanan yang Anda terima setelah memesan, atau sebutkan kode pesanan ke kasir.',
            'Open the order link you got after ordering, or tell the cashier your order code.'
          )}
        />
      </StorefrontShell>
    )
  }
  if (order.isPending) {
    return (
      <StorefrontShell primaryColor={null} footer={false}>
        <div className='mx-auto w-full max-w-md space-y-4 px-5 py-10' aria-busy>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-[420px] w-full rounded-[28px]' />
        </div>
      </StorefrontShell>
    )
  }
  if (order.isError) {
    return (
      <StorefrontShell primaryColor={null}>
        <StoreMessage
          icon={RefreshCw}
          title={copy('Pesanan tidak bisa dimuat', 'Your order couldn’t load')}
          description={copy(
            `Kode pesanan Anda ${code}. Periksa koneksi lalu coba lagi.`,
            `Your order code is ${code}. Check your connection and try again.`
          )}
          action={
            <Button variant='outline' onClick={() => order.refetch()}>
              {copy('Coba lagi', 'Try again')}
            </Button>
          }
        />
      </StorefrontShell>
    )
  }
  return (
    <Ticket
      order={order.data}
      token={token}
      language={language}
      refreshing={order.isFetching}
    />
  )
}

type Step = {
  label: string
  detail?: string
  state: 'done' | 'current' | 'failed' | 'next'
}

function steps(
  order: PublicOrder,
  language: 'id' | 'en',
  copy: (id: string, en: string) => string
): Step[] {
  const placed: Step = {
    label: copy('Pesanan diterima', 'Order received'),
    detail: time(order.placedAt, language),
    state: 'done',
  }
  const pay = (state: Step['state'], detail?: string): Step => ({
    label: copy('Bayar di kasir', 'Pay at the counter'),
    detail,
    state,
  })
  const paid = (state: Step['state']): Step => ({
    label: copy('Lunas', 'Paid'),
    detail: order.paidAt ? time(order.paidAt, language) : undefined,
    state,
  })
  switch (order.status) {
    case 'PAID':
      return [placed, pay('done'), paid('done')]
    case 'EXPIRED':
      return [
        placed,
        {
          label: copy('Waktu bayar habis', 'Time to pay ran out'),
          detail: time(order.expiresAt, language),
          state: 'failed',
        },
      ]
    case 'CANCELLED':
      return [
        placed,
        {
          label: copy('Dibatalkan oleh toko', 'Cancelled by the store'),
          detail: order.cancelledAt
            ? time(order.cancelledAt, language)
            : undefined,
          state: 'failed',
        },
      ]
    default:
      return [
        placed,
        pay(
          'current',
          copy(
            `sebelum ${time(order.expiresAt, language)}`,
            `before ${time(order.expiresAt, language)}`
          )
        ),
        paid('next'),
      ]
  }
}

const STATUS_PILL: Record<
  OrderStatus,
  { tone: string; id: string; en: string }
> = {
  AWAITING_PAYMENT: {
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--store-accent-text)]',
    id: 'Menunggu pembayaran',
    en: 'Waiting for payment',
  },
  PAID: {
    tone: 'bg-[var(--leaf-soft)] text-[var(--status-success)]',
    id: 'Sudah dibayar',
    en: 'Paid',
  },
  EXPIRED: {
    tone: 'bg-surface-subtle text-[var(--status-warning)]',
    id: 'Kedaluwarsa',
    en: 'Order expired',
  },
  CANCELLED: {
    tone: 'bg-surface-subtle text-[var(--status-danger)]',
    id: 'Dibatalkan',
    en: 'Order cancelled',
  },
}

function Ticket({
  order,
  token,
  language,
  refreshing,
}: {
  order: PublicOrder
  token: string
  language: 'id' | 'en'
  refreshing: boolean
}) {
  const copy = useCopy()
  const now = useNow(15_000)
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}${orderPath(order.code, token)}`
  const open = order.status === 'AWAITING_PAYMENT'
  const paid = order.status === 'PAID'
  const minutesLeft = Math.max(
    0,
    Math.ceil((new Date(order.expiresAt).getTime() - now) / 60_000)
  )
  const pill = STATUS_PILL[order.status]
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  const share = async () => {
    try {
      if (canShare)
        await navigator.share({
          title: `${order.storefront.name} ${order.code}`,
          url: link,
        })
      else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      }
    } catch {
      // Dismissed share sheet or blocked clipboard.
    }
  }

  return (
    <StorefrontShell
      primaryColor={order.storefront.primaryColor}
      header={<Awning thin />}
    >
      <article
        className='mx-auto w-full max-w-md px-5 pt-6'
        aria-labelledby='order-code'
      >
        <div className='sf-fade flex items-center gap-3'>
          <StoreLogo
            name={order.storefront.name}
            logoUrl={order.storefront.logoUrl}
            className='size-10 rounded-xl'
          />
          <div className='min-w-0'>
            <p className='truncate font-extrabold tracking-tight'>
              {order.storefront.name}
            </p>
            <p className='text-fg-secondary flex items-center gap-1 text-[13px]'>
              <MapPin size={12} aria-hidden />
              {order.outlet.name}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'sf-ticket sf-rise bg-background mt-5 overflow-visible rounded-[28px] border shadow-[0_18px_40px_-28px_rgb(17_20_24/0.55)]',
            !open && !paid && 'opacity-80'
          )}
          style={stagger(1, 80)}
        >
          <div className='relative px-6 pt-6 pb-7'>
            <div className='flex items-center justify-between gap-3'>
              <span
                role='status'
                aria-live='polite'
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold',
                  pill.tone
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'relative size-2 rounded-full bg-current',
                    open && 'sf-live'
                  )}
                />
                {copy(pill.id, pill.en)}
                <span className='sr-only'>
                  {open
                    ? copy(
                        'Tunjukkan kode ini ke kasir dan bayar sebelum ',
                        'Show this code to the cashier and pay before '
                      ) +
                      time(order.expiresAt, language) +
                      '.'
                    : ''}
                </span>
              </span>
              {open && (
                <span className='text-fg-secondary text-[13px] font-medium tabular-nums'>
                  {minutesLeft > 0
                    ? copy(
                        `${minutesLeft} menit lagi`,
                        `${minutesLeft} min left`
                      )
                    : copy('Waktu hampir habis', 'Almost out of time')}
                </span>
              )}
            </div>

            <p className='text-fg-secondary mt-6 text-center text-[13px] font-semibold'>
              {copy('Kode pesanan', 'Order code')}
            </p>
            <h1
              id='order-code'
              aria-label={copy(
                `Kode pesanan ${order.code.split('').join(' ')}`,
                `Order code ${order.code.split('').join(' ')}`
              )}
              className='mt-2 flex justify-center gap-1.5'
            >
              {order.code.split('').map((char, index) => (
                <span
                  key={index}
                  aria-hidden
                  className={cn(
                    'sf-pop bg-surface-subtle flex h-14 w-11 items-center justify-center rounded-xl text-[30px] font-extrabold tabular-nums',
                    !open && !paid && 'text-fg-secondary'
                  )}
                  style={stagger(index, 45, 260)}
                >
                  {char}
                </span>
              ))}
            </h1>

            {open && (
              <>
                <div
                  className='sf-fade mt-6 flex justify-center'
                  style={stagger(8, 45, 260)}
                >
                  <div className='rounded-2xl border bg-white p-3.5'>
                    <QRCodeSVG
                      value={link}
                      size={184}
                      level='M'
                      marginSize={0}
                      title={copy(
                        'Kode QR untuk kasir',
                        'QR code for the cashier'
                      )}
                    />
                  </div>
                </div>
                <p className='mt-4 text-center text-[15px] font-semibold text-balance'>
                  {copy(
                    'Tunjukkan kode ini ke kasir dan bayar sebelum ',
                    'Show this code to the cashier and pay before '
                  )}
                  <span className='tabular-nums'>
                    {time(order.expiresAt, language)}
                  </span>
                  .
                </p>
                <p className='text-fg-muted mt-2 flex items-center justify-center gap-1.5 text-[12px]'>
                  <Sun size={13} aria-hidden />
                  {copy(
                    'Naikkan kecerahan layar agar mudah dipindai.',
                    'Turn up your screen brightness so it scans easily.'
                  )}
                </p>
              </>
            )}

            {paid && (
              <div
                className='pointer-events-none absolute inset-x-0 top-[96px] flex justify-center'
                aria-hidden
              >
                <span className='sf-stamp sf-stamp-in bg-background/80 px-4 py-1.5 text-[28px] font-black tracking-[0.18em] text-[var(--status-success)]'>
                  {copy('LUNAS', 'PAID')}
                </span>
              </div>
            )}
          </div>

          <div className='sf-tear' aria-hidden />

          <div className='px-6 pt-6 pb-6'>
            <ol className='space-y-0'>
              {steps(order, language, copy).map((step, index, all) => (
                <li key={step.label} className='flex gap-3'>
                  <div className='flex flex-col items-center'>
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                        step.state === 'done' &&
                          'border-[var(--status-success)] bg-[var(--status-success)] text-white',
                        step.state === 'current' &&
                          'border-[var(--store-accent-text)] text-[var(--store-accent-text)]',
                        step.state === 'failed' &&
                          'border-[var(--status-danger)] bg-[var(--status-danger)] text-white',
                        step.state === 'next' && 'border-[var(--input)]'
                      )}
                    >
                      {step.state === 'done' && (
                        <Check size={13} className='sf-pop' />
                      )}
                      {step.state === 'failed' && <X size={13} />}
                      {step.state === 'current' && (
                        <span className='sf-live relative size-2 rounded-full bg-current' />
                      )}
                    </span>
                    {index < all.length - 1 && (
                      <span
                        className={cn(
                          'my-1 w-0.5 flex-1 rounded-full',
                          step.state === 'done'
                            ? 'bg-[var(--status-success)]'
                            : 'bg-[var(--input)]'
                        )}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex flex-1 items-baseline justify-between gap-3',
                      index < all.length - 1 && 'pb-5'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[15px] font-semibold',
                        step.state === 'next' && 'text-fg-muted font-medium'
                      )}
                    >
                      {step.label}
                    </span>
                    {step.detail && (
                      <span className='text-fg-secondary text-[13px] tabular-nums'>
                        {step.detail}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <div className='mt-5 flex items-center justify-between rounded-2xl bg-[var(--sf-accent-soft)] px-4 py-3'>
              <span className='text-[14px] font-semibold'>
                {copy('Bayar di kasir', 'Pay at the counter')}
              </span>
              <span className='text-lg font-extrabold tabular-nums'>
                {money(order.totalMinor)}
              </span>
            </div>
          </div>
        </div>

        <section
          className='sf-rise mt-8'
          style={stagger(3, 80)}
          aria-labelledby='order-items'
        >
          <h2
            id='order-items'
            className='text-lg font-extrabold tracking-tight'
          >
            {copy(
              `${order.itemCount} item`,
              `${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'}`
            )}{' '}
            <span className='text-fg-secondary text-[15px] font-medium'>
              {copy(`untuk ${order.customerName}`, `for ${order.customerName}`)}
            </span>
          </h2>
          <ul className='mt-2 divide-y'>
            {order.items.map((item, index) => (
              <li key={index} className='flex gap-3 py-3.5 text-[15px]'>
                <span className='bg-surface-subtle flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 text-[13px] font-bold tabular-nums'>
                  {item.quantity}×
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='font-semibold'>{item.name}</span>
                  {(item.variantName || item.options.length > 0) && (
                    <span className='text-fg-secondary block text-[13px]'>
                      {[item.variantName, ...item.options]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                  {item.notes && (
                    <span className='text-fg-muted block text-[13px] italic'>
                      “{item.notes}”
                    </span>
                  )}
                </span>
                <span className='tabular-nums'>
                  {money(item.subtotalMinor)}
                </span>
              </li>
            ))}
          </ul>
          <dl className='space-y-1.5 border-t pt-3 text-[15px]'>
            <div className='flex justify-between'>
              <dt className='text-fg-secondary'>
                {copy('Subtotal', 'Subtotal')}
              </dt>
              <dd className='tabular-nums'>{money(order.subtotalMinor)}</dd>
            </div>
            {order.taxMinor > 0 && (
              <div className='flex justify-between'>
                <dt className='text-fg-secondary'>
                  {copy(`Pajak ${order.taxRate}%`, `Tax ${order.taxRate}%`)}
                </dt>
                <dd className='tabular-nums'>{money(order.taxMinor)}</dd>
              </div>
            )}
            {order.serviceMinor > 0 && (
              <div className='flex justify-between'>
                <dt className='text-fg-secondary'>
                  {copy(
                    `Layanan ${order.serviceChargeRate}%`,
                    `Service ${order.serviceChargeRate}%`
                  )}
                </dt>
                <dd className='tabular-nums'>{money(order.serviceMinor)}</dd>
              </div>
            )}
            <div className='flex justify-between pt-1 text-lg font-extrabold'>
              <dt>{copy('Total', 'Total')}</dt>
              <dd className='tabular-nums'>{money(order.totalMinor)}</dd>
            </div>
          </dl>
        </section>

        <div className='mt-8 flex flex-wrap gap-3'>
          {open && (
            <Button
              type='button'
              variant='outline'
              onClick={share}
              className='sf-press h-11 rounded-full px-5'
            >
              {copied ? (
                <Check size={16} aria-hidden />
              ) : canShare ? (
                <Share2 size={16} aria-hidden />
              ) : (
                <Copy size={16} aria-hidden />
              )}
              {copied
                ? copy('Tautan disalin', 'Link copied')
                : copy('Simpan tautan pesanan', 'Save order link')}
            </Button>
          )}
          {order.storefront.slug && !open && (
            <Button
              asChild
              variant='outline'
              className='h-11 rounded-full px-5'
            >
              <Link to='/store/$slug' params={{ slug: order.storefront.slug }}>
                {copy('Pesan lagi', 'Order again')}
              </Link>
            </Button>
          )}
        </div>
        {open && (
          <p className='text-fg-muted mt-4 flex items-center gap-1.5 text-xs'>
            <RefreshCw
              size={12}
              className={cn(refreshing && 'animate-spin')}
              aria-hidden
            />
            {copy(
              'Halaman ini diperbarui otomatis.',
              'This page updates on its own.'
            )}
          </p>
        )}
      </article>
    </StorefrontShell>
  )
}
