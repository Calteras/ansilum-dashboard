import { useCallback, useId, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Store,
  Trash2,
} from '@/components/icons'
import { TurnstileChallenge } from '@/features/auth/components/turnstile-challenge'
import {
  getOutletMenu,
  placeOrder,
  StorefrontApiError,
} from '../api/storefront.api'
import { storefrontKeys } from '../api/storefront.queries'
import type { OutletMenu } from '../api/storefront.types'
import { accentButton } from '../lib/brand'
import {
  cartQuantity,
  cartSubtotalMinor,
  estimateTotals,
  MAX_LINE_QUANTITY,
  useCartStore,
  type Cart,
} from '../lib/cart'
import {
  rememberedName,
  rememberName,
  rememberOrder,
} from '../lib/storefront-session'
import { QuantityStepper } from './product-sheet'

const money = (minor: number) => formatMoney(minor / 100)

/**
 * Cart, contact details and "Place order". As a panel (desktop) everything
 * is on one scroll; as a sheet (phone) the order and the details are two
 * short steps with the action pinned to the bottom.
 */
export function CartCheckout({
  slug,
  storeName,
  cart,
  menu,
  layout = 'panel',
  onPlaced,
}: {
  slug: string
  storeName: string
  cart: Cart | null
  menu: OutletMenu
  layout?: 'panel' | 'sheet'
  onPlaced?: () => void
}) {
  const copy = useCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setQuantity, remove, reprice, clear } = useCartStore()
  const nameId = useId()
  const phoneId = useId()
  const notesId = useId()
  const [step, setStep] = useState<'cart' | 'details'>('cart')
  const [name, setName] = useState(rememberedName)
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsCheck, setNeedsCheck] = useState(false)
  const [challenge, setChallenge] = useState<string | null>(null)
  const onToken = useCallback((token: string | null) => setChallenge(token), [])

  const lines = cart?.lines ?? []
  const count = cartQuantity(cart)
  const totals = estimateTotals(cartSubtotalMinor(cart), menu.pricing)
  const hasUnavailable = lines.some((l) => l.unavailable)
  const sheet = layout === 'sheet'
  const showCart = !sheet || step === 'cart'
  const showDetails = !sheet || step === 'details'

  if (!lines.length) {
    return (
      <div className='sf-fade flex flex-col items-center px-5 py-10 text-center'>
        <span className='bg-surface-subtle mb-3 flex size-14 items-center justify-center rounded-2xl'>
          <ShoppingBag size={24} className='text-fg-secondary' />
        </span>
        <p className='font-bold'>
          {copy('Keranjang masih kosong', 'Your cart is empty')}
        </p>
        <p className='text-fg-secondary mt-1 max-w-[26ch] text-sm'>
          {copy(
            'Pilih menu untuk mulai memesan.',
            'Pick something from the menu to start your order.'
          )}
        </p>
      </div>
    )
  }

  const refreshMenu = async (unavailableLines: number[] = []) => {
    const fresh = await getOutletMenu(slug, menu.outlet.id).catch(() => null)
    if (fresh) {
      queryClient.setQueryData(storefrontKeys.menu(slug, menu.outlet.id), fresh)
      reprice(fresh, unavailableLines)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!cart || submitting || hasUnavailable) return
    if (!name.trim()) {
      setError(
        copy(
          'Tulis nama Anda agar kasir bisa memanggil.',
          'Add your name so the cashier can call you.'
        )
      )
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = await placeOrder(
        slug,
        {
          clientSubmissionId: cart.submissionId,
          outletId: cart.outletId,
          customer: {
            name: name.trim(),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
          },
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          items: lines.map((l) => ({
            productId: l.productId,
            ...(l.variantId ? { variantId: l.variantId } : {}),
            modifierIds: l.modifierIds,
            quantity: l.quantity,
            ...(l.notes ? { notes: l.notes } : {}),
          })),
          expectedTotalMinor: totals.totalMinor,
        },
        challenge
      )
      rememberOrder({
        code: order.code,
        token: order.accessToken!,
        slug,
        storeName,
        placedAt: order.placedAt,
      })
      rememberName(name.trim())
      clear()
      onPlaced?.()
      void navigate({
        to: '/o/$code',
        params: { code: order.code },
        search: { t: order.accessToken! },
      })
    } catch (caught) {
      const e =
        caught instanceof StorefrontApiError
          ? caught
          : new StorefrontApiError(0, 'NETWORK')
      setChallenge(null)
      switch (e.code) {
        case 'PRICE_CHANGED':
          await refreshMenu()
          setStep('cart')
          setError(
            copy(
              'Harga berubah sejak menu dibuka. Periksa total baru lalu pesan lagi.',
              'Prices changed since you opened the menu. Check the new total and place your order again.'
            )
          )
          break
        case 'ORDER_INVALID':
          await refreshMenu(e.problems.map((p) => p.line))
          setStep('cart')
          setError(
            copy(
              'Beberapa item sudah tidak tersedia seperti yang dipilih. Hapus item yang ditandai.',
              'Some items are no longer available as chosen. Remove the marked items.'
            )
          )
          break
        case 'CHALLENGE_REQUIRED':
          setNeedsCheck(true)
          setError(
            copy(
              'Selesaikan pemeriksaan keamanan, lalu pesan lagi.',
              'Complete the security check, then place your order again.'
            )
          )
          break
        case 'TOO_MANY_REQUESTS':
          setError(
            copy(
              'Terlalu banyak pesanan dari perangkat ini. Coba lagi beberapa menit lagi.',
              'Too many orders from this device. Try again in a few minutes.'
            )
          )
          break
        case 'OUTLET_UNAVAILABLE':
        case 'STORE_UNAVAILABLE':
        case 'ORDERING_UNAVAILABLE':
          setError(
            copy(
              'Outlet ini sedang tidak menerima pesanan online. Silakan pesan di kasir.',
              'This outlet isn’t taking online orders right now. Please order at the counter.'
            )
          )
          break
        case 'ORDER_TOO_LARGE':
          setError(
            copy(
              'Pesanan online maksimal 100 item.',
              'An online order can have at most 100 items.'
            )
          )
          break
        case 'IDEMPOTENCY_CONFLICT':
          useCartStore.getState().renewSubmission()
          setError(
            copy(
              'Keranjang berubah. Tekan Pesan sekali lagi.',
              'Your cart changed. Tap Place order once more.'
            )
          )
          break
        case 'NETWORK':
          setError(
            copy(
              'Tidak bisa terhubung. Periksa koneksi lalu tekan Pesan lagi; pesanan tidak akan tercatat dua kali.',
              'Couldn’t connect. Check your connection and tap Place order again; it won’t be placed twice.'
            )
          )
          break
        default:
          setError(
            copy(
              'Pesanan belum terkirim. Periksa isian lalu coba lagi.',
              'Your order wasn’t sent. Check the details and try again.'
            )
          )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const errorBanner = error && (
    <p
      role='alert'
      className='sf-fade flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--status-danger)_10%,var(--background))] px-3.5 py-3 text-sm text-[var(--status-danger)]'
    >
      <AlertCircle size={18} className='mt-px shrink-0' aria-hidden />
      <span>{error}</span>
    </p>
  )

  const placeButton = (
    <Button
      type='submit'
      size='lg'
      disabled={submitting || hasUnavailable || (needsCheck && !challenge)}
      className={cn(
        'sf-press h-[52px] w-full justify-between rounded-full px-5 text-[15px] font-bold',
        accentButton
      )}
    >
      <span className='flex items-center gap-2'>
        {submitting && <Loader2 size={18} className='animate-spin' />}
        {submitting
          ? copy('Mengirim pesanan…', 'Placing order…')
          : copy('Pesan, bayar di kasir', 'Place order, pay at counter')}
      </span>
      <span className='tabular-nums'>{money(totals.totalMinor)}</span>
    </Button>
  )

  return (
    <form onSubmit={submit} className='flex min-h-0 flex-1 flex-col' noValidate>
      <div className={cn(sheet && 'min-h-0 flex-1 overflow-y-auto')}>
        {showCart && (
          <div key='cart' className={cn(sheet && 'sf-fade')}>
            <ul className='divide-y px-5'>
              {lines.map((line) => (
                <li key={line.key} className='flex gap-3 py-4'>
                  <div className='min-w-0 flex-1'>
                    <p
                      className={cn(
                        'font-bold',
                        line.unavailable && 'line-through opacity-60'
                      )}
                    >
                      {line.name}
                    </p>
                    {(line.variantName || line.optionNames.length > 0) && (
                      <p className='text-fg-secondary text-[13px] leading-5'>
                        {[line.variantName, ...line.optionNames]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {line.notes && (
                      <p className='text-fg-muted text-[13px] italic'>
                        “{line.notes}”
                      </p>
                    )}
                    {line.unavailable && (
                      <p className='text-status-danger mt-1 text-[13px] font-semibold'>
                        {copy('Tidak tersedia lagi', 'No longer available')}
                      </p>
                    )}
                    <div className='mt-2.5 flex items-center gap-2'>
                      <QuantityStepper
                        size='sm'
                        value={line.quantity}
                        max={MAX_LINE_QUANTITY}
                        label={line.name}
                        onChange={(q) => setQuantity(line.key, q)}
                      />
                      <button
                        type='button'
                        onClick={() => remove(line.key)}
                        className='sf-press text-fg-secondary hover:bg-surface-hover focus-visible:ring-ring/50 flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium focus-visible:ring-[3px] focus-visible:outline-none'
                      >
                        <Trash2 size={14} aria-hidden />
                        {copy('Hapus', 'Remove')}
                      </button>
                    </div>
                  </div>
                  <p
                    key={line.unitPriceMinor * line.quantity}
                    className='sf-fade font-bold tabular-nums'
                  >
                    {money(line.unitPriceMinor * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className='mx-5 space-y-1.5 border-t py-4 text-[15px]'>
              <div className='flex justify-between'>
                <dt className='text-fg-secondary'>
                  {copy('Subtotal', 'Subtotal')}
                </dt>
                <dd className='tabular-nums'>{money(totals.subtotalMinor)}</dd>
              </div>
              {totals.taxMinor > 0 && (
                <div className='flex justify-between'>
                  <dt className='text-fg-secondary'>
                    {copy(
                      `Pajak ${menu.pricing?.taxRate}%`,
                      `Tax ${menu.pricing?.taxRate}%`
                    )}
                  </dt>
                  <dd className='tabular-nums'>{money(totals.taxMinor)}</dd>
                </div>
              )}
              {totals.serviceMinor > 0 && (
                <div className='flex justify-between'>
                  <dt className='text-fg-secondary'>
                    {copy(
                      `Layanan ${menu.pricing?.serviceChargeRate}%`,
                      `Service ${menu.pricing?.serviceChargeRate}%`
                    )}
                  </dt>
                  <dd className='tabular-nums'>{money(totals.serviceMinor)}</dd>
                </div>
              )}
              <div className='flex justify-between pt-1.5 text-lg font-extrabold'>
                <dt>{copy('Total', 'Total')}</dt>
                <dd key={totals.totalMinor} className='sf-fade tabular-nums'>
                  {money(totals.totalMinor)}
                </dd>
              </div>
            </dl>
            {sheet && error && <div className='px-5 pb-4'>{errorBanner}</div>}
          </div>
        )}

        {showDetails && (
          <div
            key='details'
            className={cn('space-y-4 px-5 pt-1 pb-5', sheet && 'sf-fade')}
          >
            {sheet && (
              <button
                type='button'
                onClick={() => setStep('cart')}
                className='text-fg-secondary -ms-1 flex items-center gap-1 text-sm font-medium hover:underline'
              >
                <ArrowLeft size={16} aria-hidden />
                {copy(`Pesanan (${count})`, `Order (${count})`)}
              </button>
            )}
            <div className='flex gap-3 rounded-2xl bg-[var(--sf-accent-soft)] px-4 py-3.5'>
              <Store
                size={20}
                className='mt-0.5 shrink-0 text-[var(--store-accent-text)]'
                aria-hidden
              />
              <p className='text-[14px] leading-5'>
                <span className='block font-bold'>
                  {copy('Ambil di ', 'Pick up at ')}
                  {menu.outlet.name}
                </span>
                <span className='text-fg-secondary'>
                  {copy(
                    'Bayar di kasir saat Anda tiba. Belum ada yang dibayar sekarang.',
                    'Pay at the counter when you arrive. Nothing is charged now.'
                  )}
                </span>
              </p>
            </div>
            <div className='space-y-1.5'>
              <label htmlFor={nameId} className='text-sm font-bold'>
                {copy('Nama', 'Name')}
              </label>
              <Input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoComplete='given-name'
                required
                className='h-12 rounded-xl text-base'
              />
              <p className='text-fg-muted text-xs'>
                {copy(
                  'Kasir memanggil nama ini.',
                  'The cashier calls this name.'
                )}
              </p>
            </div>
            <div className='space-y-1.5'>
              <label htmlFor={phoneId} className='text-sm font-bold'>
                {copy('Nomor HP', 'Phone')}{' '}
                <span className='text-fg-muted font-normal'>
                  {copy('opsional', 'optional')}
                </span>
              </label>
              <Input
                id={phoneId}
                type='tel'
                inputMode='tel'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={24}
                autoComplete='tel'
                className='h-12 rounded-xl text-base'
              />
            </div>
            <div className='space-y-1.5'>
              <label htmlFor={notesId} className='text-sm font-bold'>
                {copy('Catatan pesanan', 'Order note')}{' '}
                <span className='text-fg-muted font-normal'>
                  {copy('opsional', 'optional')}
                </span>
              </label>
              <Textarea
                id={notesId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={2}
                className='resize-none rounded-xl text-base'
              />
            </div>
            {needsCheck && <TurnstileChallenge onToken={onToken} />}
            {(!sheet || step === 'details') && errorBanner}
            {!sheet && (
              <div className='space-y-2 pt-1'>
                {placeButton}
                <p className='text-fg-muted text-center text-xs'>
                  {copy(
                    'Total final dihitung oleh toko saat pesanan diterima.',
                    'The store confirms the final total when it receives your order.'
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {sheet && (
        <div className='bg-background border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'>
          {step === 'cart' ? (
            <Button
              type='button'
              size='lg'
              disabled={hasUnavailable}
              onClick={() => {
                setError(null)
                setStep('details')
              }}
              className={cn(
                'sf-press h-[52px] w-full justify-between rounded-full px-5 text-[15px] font-bold',
                accentButton
              )}
            >
              <span>{copy('Lanjut', 'Continue')}</span>
              <span className='tabular-nums'>{money(totals.totalMinor)}</span>
            </Button>
          ) : (
            placeButton
          )}
        </div>
      )}
    </form>
  )
}
