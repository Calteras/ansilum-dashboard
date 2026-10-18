import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronRight,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  Store,
} from '@/components/icons'
import { StorefrontApiError } from '../api/storefront.api'
import { useStorefrontQuery } from '../api/storefront.queries'
import {
  Awning,
  StoreLogo,
  StoreMessage,
  StorefrontShell,
} from '../components/storefront-shell'
import { cartQuantity, useCartStore } from '../lib/cart'
import { stagger } from '../lib/motion'
import { usePageMeta } from '../lib/page-meta'
import {
  rememberedOrders,
  rememberedOutlet,
  rememberOutlet,
} from '../lib/storefront-session'

/** /store/:slug — who the business is, and where you want to order from. */
export function StorefrontLanding({ slug }: { slug: string }) {
  const copy = useCopy()
  const navigate = useNavigate()
  const store = useStorefrontQuery(slug)
  const cart = useCartStore((s) => s.cart)
  const clearCart = useCartStore((s) => s.clear)
  const [pendingOutlet, setPendingOutlet] = useState<string | null>(null)
  usePageMeta(store.data?.name ?? null, store.data?.description)

  const outlets = store.data?.outlets ?? []
  const lastOutlet = rememberedOutlet(slug)
  const recent = rememberedOrders()
    .filter((o) => o.slug === slug)
    .slice(0, 1)

  const open = (outletId: string) => {
    rememberOutlet(slug, outletId)
    void navigate({
      to: '/store/$slug/$outletId',
      params: { slug, outletId },
    })
  }
  const choose = (outletId: string) => {
    const otherCart =
      cart &&
      cartQuantity(cart) > 0 &&
      (cart.slug !== slug || cart.outletId !== outletId)
    if (otherCart) setPendingOutlet(outletId)
    else open(outletId)
  }

  // One outlet: there is nothing to choose.
  const onlyOutlet = outlets.length === 1 ? outlets[0].id : null
  const cartElsewhere = Boolean(
    cart &&
    cart.slug === slug &&
    cart.outletId !== onlyOutlet &&
    cartQuantity(cart) > 0
  )
  useEffect(() => {
    if (onlyOutlet && !cartElsewhere) {
      rememberOutlet(slug, onlyOutlet)
      void navigate({
        to: '/store/$slug/$outletId',
        params: { slug, outletId: onlyOutlet },
        replace: true,
      })
    }
  }, [onlyOutlet, cartElsewhere, slug, navigate])

  if (store.isPending || (onlyOutlet && !cartElsewhere)) {
    return (
      <StorefrontShell primaryColor={null} footer={false}>
        <div className='mx-auto w-full max-w-xl space-y-4 px-5 py-12' aria-busy>
          <Skeleton className='size-16 rounded-2xl' />
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-72' />
          <Skeleton className='mt-8 h-20 w-full rounded-2xl' />
          <Skeleton className='h-20 w-full rounded-2xl' />
        </div>
      </StorefrontShell>
    )
  }

  if (store.isError) {
    const missing =
      store.error instanceof StorefrontApiError && store.error.status === 404
    return (
      <StorefrontShell primaryColor={null}>
        {missing ? (
          <StoreMessage
            icon={Store}
            title={copy(
              'Toko ini belum menerima pesanan online',
              'This store isn’t taking online orders'
            )}
            description={copy(
              'Periksa alamatnya, atau pesan langsung di kasir.',
              'Check the address, or order at the counter.'
            )}
          />
        ) : (
          <StoreMessage
            icon={RefreshCw}
            title={copy('Toko tidak bisa dimuat', 'The store couldn’t load')}
            description={copy(
              'Periksa koneksi Anda lalu coba lagi.',
              'Check your connection and try again.'
            )}
            action={
              <Button variant='outline' onClick={() => store.refetch()}>
                {copy('Coba lagi', 'Try again')}
              </Button>
            }
          />
        )}
      </StorefrontShell>
    )
  }

  const data = store.data
  return (
    <StorefrontShell primaryColor={data.primaryColor}>
      <Awning />
      <header className='mx-auto w-full max-w-xl px-5 pt-6 pb-8'>
        <div className='sf-pop'>
          <StoreLogo
            name={data.name}
            logoUrl={data.logoUrl}
            className='size-16 text-2xl shadow-[0_6px_20px_-8px_rgb(17_20_24/0.35)]'
          />
        </div>
        <h1
          className='sf-rise mt-5 text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance'
          style={stagger(1, 60)}
        >
          {data.name}
        </h1>
        {data.description && (
          <p
            className='sf-rise text-fg-secondary mt-3 max-w-[38ch] text-[15px] leading-6'
            style={stagger(2, 60)}
          >
            {data.description}
          </p>
        )}
      </header>

      <section
        aria-labelledby='choose-outlet'
        className='mx-auto w-full max-w-xl px-5'
      >
        {recent.map((order) => (
          <Link
            key={order.code}
            to='/o/$code'
            params={{ code: order.code }}
            search={{ t: order.token }}
            className='sf-rise sf-press mb-6 flex items-center gap-3 rounded-2xl bg-[var(--sf-accent-soft)] px-4 py-3.5 focus-visible:ring-[3px] focus-visible:ring-[var(--store-accent-text)]/40 focus-visible:outline-none'
            style={stagger(3, 60)}
          >
            <Receipt
              size={20}
              className='text-[var(--store-accent-text)]'
              aria-hidden
            />
            <span className='min-w-0 flex-1 text-sm'>
              <span className='block font-semibold'>
                {copy('Lihat pesanan terakhir', 'See your last order')}
              </span>
              <span className='text-fg-secondary tracking-[0.12em] tabular-nums'>
                {order.code}
              </span>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        ))}

        <h2
          id='choose-outlet'
          className='sf-rise pb-3 text-lg font-bold tracking-tight'
          style={stagger(4, 60)}
        >
          {copy('Pesan dari outlet mana?', 'Where are you ordering from?')}
        </h2>
        {outlets.length === 0 ? (
          <p className='sf-rise bg-surface-subtle rounded-2xl px-5 py-6 text-[15px]'>
            {copy(
              'Belum ada outlet yang menerima pesanan online. Silakan pesan langsung di kasir.',
              'No outlet is taking online orders right now. Please order at the counter.'
            )}
          </p>
        ) : (
          <ul className='space-y-3'>
            {outlets.map((outlet, index) => {
              const last = outlet.id === lastOutlet
              return (
                <li
                  key={outlet.id}
                  className='sf-rise'
                  style={stagger(index, 55, 300)}
                >
                  <button
                    type='button'
                    onClick={() => choose(outlet.id)}
                    className={cn(
                      'sf-press group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-start transition-colors hover:border-[var(--sf-accent-line)] hover:bg-[var(--sf-accent-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--store-accent-text)]/40 focus-visible:outline-none',
                      last && 'border-[var(--sf-accent-line)]'
                    )}
                  >
                    <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-accent-soft)] text-[var(--store-accent-text)]'>
                      <MapPin size={20} aria-hidden />
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='flex flex-wrap items-center gap-x-2 text-[17px] font-bold'>
                        {outlet.name}
                        {last && (
                          <span className='text-[12px] font-semibold text-[var(--store-accent-text)]'>
                            {copy('Terakhir dipilih', 'Last visited')}
                          </span>
                        )}
                      </span>
                      {outlet.address && (
                        <span className='text-fg-secondary mt-0.5 block text-sm leading-5'>
                          {outlet.address}
                        </span>
                      )}
                      {outlet.phone && (
                        <span className='text-fg-muted mt-1 flex items-center gap-1 text-[13px]'>
                          <Phone size={12} aria-hidden />
                          {outlet.phone}
                        </span>
                      )}
                    </span>
                    <ChevronRight
                      size={20}
                      className='text-fg-muted shrink-0 transition-transform group-hover:translate-x-1'
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p
          className='sf-fade text-fg-muted mt-6 text-center text-[13px]'
          style={stagger(6, 60, 300)}
        >
          {copy(
            'Pesan dari ponsel, ambil dan bayar di kasir.',
            'Order from your phone, then pick up and pay at the counter.'
          )}
        </p>
      </section>

      <AlertDialog
        open={pendingOutlet !== null}
        onOpenChange={(open) => !open && setPendingOutlet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy('Ganti outlet?', 'Change outlet?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy(
                'Mengganti outlet akan mengosongkan keranjang Anda saat ini.',
                'Changing outlet will clear your current cart.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {copy('Simpan keranjang', 'Keep my cart')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearCart()
                if (pendingOutlet) open(pendingOutlet)
              }}
            >
              {copy('Kosongkan dan ganti', 'Clear cart and change')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StorefrontShell>
  )
}
