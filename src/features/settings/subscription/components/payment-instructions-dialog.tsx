import { UiText } from '@/components/ui-text'
import { formatMoney } from '@/lib/format'
import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Loader2, XCircle } from '@/components/icons'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useSubscriptionOrderQuery } from '../subscription.queries'

const formatPrice = formatMoney

function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) return

    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now()
      if (!Number.isFinite(diff)) {
        setTimeLeft('Unavailable')
        return
      }
      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return timeLeft
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Could not copy. Please select and copy the number manually.')
  }
}

function VAPaymentSection({ vaNumber }: { vaNumber: string | null }) {
  if (!vaNumber)
    return (
      <p className='text-sm'><UiText id="Menyiapkan virtual account. Periksa status pembayaran untuk memuat ulang." en="Preparing your virtual account. Check payment status to refresh." /></p>
    )
  return (
    <>
      <Separator />
      <div className='space-y-1'>
        <span className='text-muted-foreground text-sm'><UiText id="Nomor virtual account" en="Virtual Account Number" /></span>
        <div className='flex items-center gap-2'>
          <code className='bg-muted min-w-0 flex-1 rounded px-3 py-2 font-sans tabular-nums text-lg font-semibold tracking-wider break-all'>
            {vaNumber}
          </code>
          <Button
            variant='outline'
            size='icon'
            aria-label='Copy payment number'
            onClick={() => copyToClipboard(vaNumber)}
          >
            <Copy className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </>
  )
}

function MandiriPaymentSection({
  billKey,
  billerCode,
}: {
  billKey: string | null
  billerCode: string | null
}) {
  if (!billKey || !billerCode)
    return (
      <p className='text-sm'><UiText id="Menyiapkan petunjuk pembayaran. Periksa status pembayaran untuk memuat ulang." en="Preparing your bill payment details. Check payment status to refresh." /></p>
    )
  return (
    <>
      <Separator />
      <div className='space-y-3'>
        <div className='space-y-1'>
          <span className='text-muted-foreground text-sm'><UiText id="Kode perusahaan" en="Biller Code" /></span>
          <div className='flex items-center gap-2'>
            <code className='bg-muted min-w-0 flex-1 rounded px-3 py-2 font-sans tabular-nums text-lg font-semibold tracking-wider break-all'>
              {billerCode}
            </code>
            <Button
              variant='outline'
              size='icon'
              aria-label='Copy payment number'
              onClick={() => copyToClipboard(billerCode)}
            >
              <Copy className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='space-y-1'>
          <span className='text-muted-foreground text-sm'><UiText id="Kode tagihan" en="Bill Key" /></span>
          <div className='flex items-center gap-2'>
            <code className='bg-muted min-w-0 flex-1 rounded px-3 py-2 font-sans tabular-nums text-lg font-semibold tracking-wider break-all'>
              {billKey}
            </code>
            <Button
              variant='outline'
              size='icon'
              aria-label='Copy payment number'
              onClick={() => copyToClipboard(billKey)}
            >
              <Copy className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function QRISPaymentSection({ qrCodeUrl }: { qrCodeUrl: string | null }) {
  if (!qrCodeUrl)
    return (
      <p className='text-sm'><UiText id="Menyiapkan kode QR. Periksa status pembayaran untuk memuat ulang." en="Preparing your QR code. Check payment status to refresh." /></p>
    )
  return (
    <>
      <Separator />
      <div className='space-y-2'>
        <span className='text-muted-foreground text-sm'><UiText id="Pindai dengan aplikasi pembayaran (GoPay, OVO, Dana, ShopeePay)" en="Scan with any e-wallet app (GoPay, OVO, Dana, ShopeePay)" /></span>
        <div className='flex justify-center rounded-lg bg-white p-4'>
          <img src={qrCodeUrl} alt='QRIS QR Code' className='h-48 w-48' />
        </div>
      </div>
    </>
  )
}

function GopayPaymentSection({
  qrCodeUrl,
  deeplinkUrl,
}: {
  qrCodeUrl: string | null
  deeplinkUrl: string | null
}) {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

  if (isMobile && deeplinkUrl) {
    return (
      <>
        <Separator />
        <div className='space-y-3'>
          <span className='text-muted-foreground text-sm'><UiText id="Buka GoPay untuk menyelesaikan pembayaran" en="Open GoPay to complete payment" /></span>
          <Button
            className='w-full'
            onClick={() => {
              window.location.href = deeplinkUrl
            }}
          >
            <ExternalLink className='mr-2 h-4 w-4' /><UiText id="Buka GoPay" en="Open GoPay App" /></Button>
        </div>
      </>
    )
  }

  if (qrCodeUrl) {
    return (
      <>
        <Separator />
        <div className='space-y-2'>
          <span className='text-muted-foreground text-sm'><UiText id="Pindai dengan GoPay" en="Scan with GoPay app" /></span>
          <div className='flex justify-center rounded-lg bg-white p-4'>
            <img src={qrCodeUrl} alt='GoPay QR Code' className='h-48 w-48' />
          </div>
        </div>
      </>
    )
  }

  return null
}

interface PaymentInstructionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
  initialPaymentType: string
  initialVaNumber: string | null
  initialBillKey: string | null
  initialBillerCode: string | null
  initialQrCodeUrl: string | null
  initialDeeplinkUrl: string | null
  initialAmount: number
  initialOrderNumber: string
  initialExpiresAt: string
}

export function PaymentInstructionsDialog({
  open,
  onOpenChange,
  orderId,
  initialPaymentType,
  initialVaNumber,
  initialBillKey,
  initialBillerCode,
  initialQrCodeUrl,
  initialDeeplinkUrl,
  initialAmount,
  initialOrderNumber,
  initialExpiresAt,
}: PaymentInstructionsDialogProps) {
  const {
    data: orderData,
    isError,
    isFetching,
    refetch,
  } = useSubscriptionOrderQuery(open ? orderId : null)

  const order = orderData?.data
  const paymentType = order?.paymentType ?? initialPaymentType
  const vaNumber = order?.vaNumber ?? initialVaNumber
  const billKey = order?.billKey ?? initialBillKey
  const billerCode = order?.billerCode ?? initialBillerCode
  const qrCodeUrl = order?.qrCodeUrl ?? initialQrCodeUrl
  const deeplinkUrl = order?.deeplinkUrl ?? initialDeeplinkUrl
  const amount = order?.amount ?? initialAmount
  const orderNumber = order?.orderNumber ?? initialOrderNumber
  const expiresAt = order?.expiresAt ?? initialExpiresAt
  const status = order?.paymentStatus ?? 'PENDING'

  const countdown = useCountdown(expiresAt)
  const isSettled = status === 'PAID' || status === 'SETTLEMENT'
  const isExpiredOrCancelled =
    ['EXPIRED', 'FAILED', 'REFUNDED', 'EXPIRE', 'CANCEL'].includes(
      status ?? ''
    ) ||
    (!isSettled && countdown === 'Expired')

  function renderPaymentDetails() {
    if (paymentType === 'BANK_TRANSFER_MANDIRI') {
      return <MandiriPaymentSection billKey={billKey} billerCode={billerCode} />
    }
    if (paymentType?.startsWith('BANK_TRANSFER')) {
      return <VAPaymentSection vaNumber={vaNumber} />
    }
    if (paymentType === 'QRIS') {
      return <QRISPaymentSection qrCodeUrl={qrCodeUrl} />
    }
    if (paymentType === 'GOPAY') {
      return (
        <GopayPaymentSection qrCodeUrl={qrCodeUrl} deeplinkUrl={deeplinkUrl} />
      )
    }
    return (
      <p className='text-muted-foreground text-sm'><UiText id="Petunjuk pembayaran sedang disiapkan. Pilih Periksa status pembayaran untuk memuat ulang." en="Payment details are being prepared. Use Check payment status to refresh." /></p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isSettled
              ? 'Payment Successful'
              : isExpiredOrCancelled
                ? 'Payment not completed'
                : 'Payment Instructions'}
          </DialogTitle>
          <DialogDescription>
            {isSettled
              ? 'Your payment is confirmed. We’re refreshing your plan.'
              : isExpiredOrCancelled
                ? `Payment status: ${countdown === 'Expired' && status === 'PENDING' ? 'expired' : status.toLowerCase()}. No further payment is needed for this order.`
                : 'Complete your payment using the details below.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isSettled ? (
            <div className='flex flex-col items-center gap-3 py-4'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-leaf-soft '>
                <Check className='h-8 w-8 text-leaf ' />
              </div>
              <p className='text-muted-foreground text-center text-sm'><UiText id="Pembayaran dikonfirmasi. Paket baru Anda akan tampil setelah akun dimuat ulang." en="Your payment has been confirmed. Your updated plan will appear after the account refresh." /></p>
            </div>
          ) : isExpiredOrCancelled ? (
            <div className='flex flex-col items-center gap-3 py-4'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                <XCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
              </div>
              <p className='text-muted-foreground text-center text-sm'><UiText id="Silakan pilih paket lagi." en="Please try subscribing again." /></p>
            </div>
          ) : (
            <>
              <div className='space-y-3 rounded-lg border p-4'>
                <div className='flex flex-col justify-between gap-1.5 text-xs'>
                  <span className='text-muted-foreground font-semibold'><UiText id="Pesanan" en="Order" /></span>
                  <span className='font-sans tabular-nums'>{orderNumber}</span>
                </div>
                <div className='flex flex-col justify-between gap-1.5 text-xs'>
                  <span className='text-muted-foreground font-semibold'><UiText id="Jumlah" en="Amount" /></span>
                  <span className='font-extrabold'>{formatPrice(amount)}</span>
                </div>
                {renderPaymentDetails()}
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'>
                <div className='space-y-1'>
                  <span className='text-muted-foreground text-xs'><UiText id="Sisa waktu" en="Time Remaining" /></span>
                  <div className='font-sans tabular-nums text-xl font-bold tabular-nums'>
                    {countdown || 'Checking…'}
                  </div>
                </div>
                <Badge variant='outline' className='gap-1.5'>
                  <Loader2 className='h-3 w-3 animate-spin' /><UiText id="Menunggu pembayaran" en="Waiting for payment" /></Badge>
              </div>
            </>
          )}
        </div>

        {isError && (
          <p role='alert' className='text-destructive text-sm'><UiText id="Status pembayaran belum bisa diperiksa. Cek koneksi Anda dan coba lagi sebelum membayar ulang." en="We couldn’t check payment status. Check your connection and try again before making another payment." /></p>
        )}
        {!isSettled && !isExpiredOrCancelled && (
          <p className='text-muted-foreground text-sm'><UiText id="Status diperbarui otomatis. Anda dapat menutup jendela ini dan membukanya lagi lewat Lihat pembayaran." en="Status updates automatically. You can close this window and return using View payment." /></p>
        )}

        <DialogFooter className='flex w-full flex-col gap-2 sm:flex-col'>
          {!isSettled && (
            <Button
              variant='outline'
              disabled={isFetching}
              onClick={() => void refetch()}
              className='w-full'
            >
              {isFetching ? 'Checking…' : 'Check payment status'}
            </Button>
          )}

          <Button
            variant={isSettled ? 'default' : 'outline'}
            onClick={() => onOpenChange(false)}
            className='w-full'
          >
            {isSettled ? 'Done' : 'Close for now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
