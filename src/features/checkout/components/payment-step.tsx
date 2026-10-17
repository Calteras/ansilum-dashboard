import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  XCircle,
} from '@/components/icons'
import type { SubscriptionOrder } from '@/features/settings/subscription/subscription.types'
import { formatDate, formatDateTime } from '../format'
import { findPaymentMethod } from '../payment-methods'
import { CardPayment } from './card-payment'
import { PaymentLogo } from './payment-logo'

function useTimeLeft(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const ms = new Date(expiresAt).getTime() - now
  return Number.isFinite(ms) ? Math.max(0, ms) : 0
}

function formatClock(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function CopyField({ label, value }: { label: string; value: string }) {
  const copy = useCopy()
  return (
    <div className='space-y-1.5'>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <div className='flex items-center gap-2'>
        <output className='bg-muted min-w-0 flex-1 rounded-md px-4 py-3 text-xl font-semibold tracking-[0.06em] break-all tabular-nums'>
          {value}
        </output>
        <Button
          variant='outline'
          size='lg'
          aria-label={copy(`Salin ${label}`, `Copy ${label}`)}
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success(copy('Disalin', 'Copied')))
              .catch(() =>
                toast.error(
                  copy(
                    'Tidak bisa menyalin. Pilih dan salin manual.',
                    'Couldn’t copy. Select the number and copy it manually.'
                  )
                )
              )
          }
        >
          <Copy className='size-4' />
          {copy('Salin', 'Copy')}
        </Button>
      </div>
    </div>
  )
}

function PaymentDetails({
  order,
  onCheck,
}: {
  order: SubscriptionOrder
  onCheck: () => void
}) {
  const copy = useCopy()
  const preparing = (
    <p className='text-muted-foreground flex items-center gap-2 text-sm'>
      <Loader2 className='size-4 animate-spin' />
      {copy('Menyiapkan detail pembayaran…', 'Preparing payment details…')}
    </p>
  )

  if (order.paymentType === 'CREDIT_CARD') {
    if (!order.card) return preparing
    return (
      <CardPayment
        orderId={order.id}
        amount={order.amount}
        card={order.card}
        onCheck={onCheck}
      />
    )
  }
  if (order.paymentType === 'BANK_TRANSFER_MANDIRI') {
    if (!order.billerCode || !order.billKey) return preparing
    return (
      <div className='space-y-4'>
        <CopyField
          label={copy('Kode perusahaan', 'Biller code')}
          value={order.billerCode}
        />
        <CopyField
          label={copy('Kode tagihan', 'Bill key')}
          value={order.billKey}
        />
      </div>
    )
  }
  if (order.paymentType.startsWith('BANK_TRANSFER')) {
    if (!order.vaNumber) return preparing
    return (
      <CopyField
        label={copy('Nomor virtual account', 'Virtual account number')}
        value={order.vaNumber}
      />
    )
  }

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad/i.test(navigator.userAgent)
  return (
    <div className='space-y-4'>
      {order.paymentType === 'GOPAY' && order.deeplinkUrl && isMobile && (
        <Button asChild size='lg' className='w-full'>
          <a href={order.deeplinkUrl}>
            <ExternalLink className='size-4' />
            {copy('Buka GoPay', 'Open GoPay')}
          </a>
        </Button>
      )}
      {order.qrCodeUrl ? (
        <div className='w-fit rounded-lg border bg-white p-3'>
          <img
            src={order.qrCodeUrl}
            alt={copy('Kode QR pembayaran', 'Payment QR code')}
            className='size-56'
            width={224}
            height={224}
          />
        </div>
      ) : (
        preparing
      )}
    </div>
  )
}

interface PaymentStepProps {
  order: SubscriptionOrder
  planName: string
  isChecking: boolean
  checkFailed: boolean
  onCheck: () => void
  isClosing: boolean
  closeError: string
  onChangeMethod: () => void
  onRetry: () => void
  /** Card orders get one charge; retrying opens a fresh card order straight away. */
  onRetryCard?: () => void
  isRetrying?: boolean
  retryError?: string
}

export function PaymentStep({
  order,
  planName,
  isChecking,
  checkFailed,
  onCheck,
  isClosing,
  closeError,
  onChangeMethod,
  onRetry,
  onRetryCard,
  isRetrying = false,
  retryError = '',
}: PaymentStepProps) {
  const copy = useCopy()
  const method = findPaymentMethod(order.paymentType)
  const timeLeft = useTimeLeft(order.expiresAt)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const lapsed = order.paymentStatus === 'PENDING' && timeLeft === 0

  // Ask once more when the timer runs out, in case the payment landed in the last seconds.
  useEffect(() => {
    if (lapsed) onCheck()
  }, [lapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  if (order.paymentStatus === 'PAID') {
    return (
      <section
        className='space-y-6'
        aria-labelledby='result-heading'
        aria-live='polite'
      >
        <CheckCircle2 className='text-leaf size-10' />
        <div className='space-y-2'>
          <h1 id='result-heading' className='text-xl font-semibold tracking-[-0.02em]'>
            {copy(
              `Paket ${planName} sudah aktif`,
              `Your ${planName} plan is active`
            )}
          </h1>
          <p className='text-muted-foreground'>
            {copy(
              `Kami menerima ${formatMoney(order.amount)}${order.paidAt ? ` pada ${formatDate(order.paidAt)}` : ''}. Fitur baru sudah bisa dipakai di semua usaha Anda.`,
              `We received ${formatMoney(order.amount)}${order.paidAt ? ` on ${formatDate(order.paidAt)}` : ''}. The new features are ready in every business you own.`
            )}
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <Button asChild size='lg' className='flex-1'>
            <Link to='/'>{copy('Buka dasbor', 'Go to dashboard')}</Link>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <Link to='/settings/subscription'>
              {copy('Lihat langganan', 'View subscription')}
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  if (order.paymentStatus !== 'PENDING' || lapsed) {
    const refunded = order.paymentStatus === 'REFUNDED'
    const failed = order.paymentStatus === 'FAILED'
    const cardRetry =
      order.paymentType === 'CREDIT_CARD' && !refunded ? onRetryCard : undefined
    return (
      <section
        className='space-y-6'
        aria-labelledby='result-heading'
        aria-live='polite'
      >
        <XCircle className='text-muted-foreground size-10' />
        <div className='space-y-2'>
          <h1 id='result-heading' className='text-xl font-semibold tracking-[-0.02em]'>
            {refunded
              ? copy(
                  'Pembayaran ini sudah dikembalikan',
                  'This payment was refunded'
                )
              : failed
                ? copy(
                    'Pembayaran tidak berhasil',
                    'This payment didn’t go through'
                  )
                : copy('Waktu pembayaran habis', 'This payment has expired')}
          </h1>
          <p className='text-muted-foreground'>
            {refunded
              ? copy(
                  'Dana sudah dikembalikan ke rekening Anda. Paket Anda tidak berubah.',
                  'The money went back to your account. Your plan has not changed.'
                )
              : cardRetry
                ? copy(
                    'Kartu Anda tidak ditagih. Coba kartu lain atau pilih cara bayar lain.',
                    'Your card wasn’t charged. Try another card or choose a different way to pay.'
                  )
                : copy(
                    'Tidak ada dana yang ditarik. Pilih cara bayar untuk mencoba lagi.',
                    'Nothing was charged. Choose a payment method to try again.'
                  )}
          </p>
        </div>
        {retryError && (
          <p role='alert' className='text-destructive flex gap-2 text-sm'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            {retryError}
          </p>
        )}
        {lapsed && isChecking ? (
          <p className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Loader2 className='size-4 animate-spin' />
            {copy(
              'Memastikan status terakhir…',
              'Confirming the final status…'
            )}
          </p>
        ) : (
          <div className='flex flex-col gap-2 sm:flex-row'>
            {cardRetry ? (
              <>
                <Button
                  size='lg'
                  className='flex-1'
                  onClick={cardRetry}
                  disabled={isRetrying}
                >
                  {isRetrying && <Loader2 className='size-4 animate-spin' />}
                  {copy('Coba kartu lain', 'Try another card')}
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={onRetry}
                  disabled={isRetrying}
                >
                  {copy('Cara bayar lain', 'Other payment methods')}
                </Button>
              </>
            ) : (
              <>
                <Button size='lg' className='flex-1' onClick={onRetry}>
                  {copy('Pilih cara bayar', 'Choose a payment method')}
                </Button>
                <Button asChild size='lg' variant='outline'>
                  <Link to='/settings/subscription'>
                    {copy('Kembali ke langganan', 'Back to subscription')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className='space-y-8' aria-labelledby='pay-heading'>
      <div className='space-y-1.5'>
        {method && <PaymentLogo method={method} className='mb-4' />}
        <h1 id='pay-heading' className='text-xl font-semibold tracking-[-0.02em]'>
          {method
            ? copy(...method.title)
            : copy('Selesaikan pembayaran', 'Complete your payment')}
        </h1>
        <p className='text-muted-foreground'>
          {order.paymentType === 'CREDIT_CARD'
            ? copy(
                `Kartu Anda akan ditagih ${formatMoney(order.amount)}. Selesaikan sebelum ${formatDateTime(order.expiresAt)}.`,
                `${formatMoney(order.amount)} will be charged to your card. Finish before ${formatDateTime(order.expiresAt)}.`
              )
            : copy(
                `Bayar tepat ${formatMoney(order.amount)} sebelum ${formatDateTime(order.expiresAt)}.`,
                `Pay exactly ${formatMoney(order.amount)} before ${formatDateTime(order.expiresAt)}.`
              )}
        </p>
      </div>

      <PaymentDetails order={order} onCheck={onCheck} />

      <div
        className='flex flex-wrap items-center justify-between gap-3 border-y py-4'
        aria-live='polite'
      >
        <p className='flex items-center gap-2.5 text-sm'>
          <span className='relative flex size-2.5'>
            <span className='bg-brand absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping' />
            <span className='bg-brand relative size-2.5 rounded-full' />
          </span>
          {copy('Menunggu pembayaran', 'Waiting for your payment')}
        </p>
        <p className='text-muted-foreground text-sm tabular-nums'>
          {copy('Sisa waktu', 'Time left')}{' '}
          <span className='text-foreground font-semibold'>
            {formatClock(timeLeft)}
          </span>
        </p>
      </div>

      {method && method.steps.length > 0 && (
        <ol className='text-muted-foreground marker:text-foreground list-decimal space-y-2 pl-5 text-sm marker:font-semibold'>
          {method.steps.map((step) => (
            <li key={step[1]} className='pl-1'>
              {copy(...step)}
            </li>
          ))}
        </ol>
      )}

      <div className='space-y-3 text-sm'>
        <p className='text-muted-foreground'>
          {copy(
            'Halaman ini diperbarui sendiri setelah pembayaran masuk. Anda boleh menutupnya dan kembali lewat Pengaturan.',
            'This page updates on its own once the payment arrives. You can close it and come back from Settings.'
          )}
        </p>
        {checkFailed && (
          <p role='alert' className='text-destructive flex gap-2'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            {copy(
              'Status belum bisa diperiksa. Jangan bayar dua kali; periksa koneksi lalu coba lagi.',
              'We couldn’t check the status. Don’t pay twice; check your connection and try again.'
            )}
          </p>
        )}
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={onCheck} disabled={isChecking}>
            {isChecking && <Loader2 className='size-4 animate-spin' />}
            {copy('Periksa sekarang', 'Check now')}
          </Button>
          {!confirmingClose && (
            <Button variant='ghost' onClick={() => setConfirmingClose(true)}>
              {copy('Ganti cara bayar', 'Change payment method')}
            </Button>
          )}
        </div>
      </div>

      {confirmingClose && (
        <div
          role='group'
          aria-labelledby='close-heading'
          className='bg-muted/60 space-y-3 rounded-lg p-4 text-sm'
        >
          <p id='close-heading' className='font-semibold'>
            {copy('Tutup pembayaran ini?', 'Close this payment?')}
          </p>
          <p className='text-muted-foreground'>
            {copy(
              'Detail pembayaran di atas akan berhenti berlaku. Jika Anda sudah membayar, kami akan mendeteksinya dan mengaktifkan paket Anda.',
              'The payment details above will stop working. If you already paid, we’ll detect it and activate your plan instead.'
            )}
          </p>
          {closeError && (
            <p role='alert' className='text-destructive'>
              {closeError}
            </p>
          )}
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='destructive'
              onClick={onChangeMethod}
              disabled={isClosing}
            >
              {isClosing && <Loader2 className='size-4 animate-spin' />}
              {copy('Tutup dan pilih lagi', 'Close and choose again')}
            </Button>
            <Button
              variant='ghost'
              onClick={() => setConfirmingClose(false)}
              disabled={isClosing}
            >
              {copy('Lanjutkan pembayaran ini', 'Keep this payment')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
