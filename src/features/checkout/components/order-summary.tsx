import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PLAN_FEATURES } from '@/content/pricing'
import { Logo } from '@/assets/logo'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { ArrowLeft, ChevronDown, Lock } from '@/components/icons'
import type {
  PaymentStatus,
  SubscriptionPlan,
} from '@/features/settings/subscription/subscription.types'
import { formatDate } from '../format'

interface OrderSummaryProps {
  plan: SubscriptionPlan | undefined
  amount: number | undefined
  orderNumber?: string
  status?: PaymentStatus
  paidAt?: string | null
}

/** Left pane: what is being bought, set as the receipt the purchase will become. */
export function OrderSummary({
  plan,
  amount,
  orderNumber,
  status,
  paidAt,
}: OrderSummaryProps) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const start = paidAt ? new Date(paidAt) : new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  const isPaid = status === 'PAID'

  return (
    <div className='flex w-full max-w-[26rem] flex-col gap-8 lg:ml-auto lg:min-h-full'>
      <Link
        to='/settings/subscription'
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring -ml-1 flex w-fit items-center gap-2 rounded-md px-1 text-sm outline-none focus-visible:ring-2'
      >
        <ArrowLeft className='size-4' />
        <Logo className='size-6 rounded-md' />
        <span className='text-foreground font-semibold'>Ansilum</span>
      </Link>

      <div className='space-y-1'>
        <p className='text-muted-foreground text-[15px]'>
          {plan
            ? copy(`Paket ${plan.name}`, `${plan.name} plan`)
            : copy('Memuat paket…', 'Loading plan…')}
        </p>
        <p className='text-[2.5rem] leading-none font-bold tracking-[-0.03em] tabular-nums'>
          {amount !== undefined ? formatMoney(amount) : '—'}
        </p>
        <p className='text-muted-foreground text-[15px]'>
          {copy('untuk 1 bulan', 'for 1 month')}
        </p>
      </div>

      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='focus-visible:ring-ring -mt-4 flex w-fit items-center gap-1 rounded-md text-sm font-medium outline-none focus-visible:ring-2 lg:hidden'
      >
        {open
          ? copy('Sembunyikan rincian', 'Hide details')
          : copy('Lihat rincian', 'Show details')}
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'drop-shadow-[0_1px_1.5px_rgb(17_20_24/0.12)] lg:block',
          open || isPaid ? 'block' : 'hidden'
        )}
      >
        <div className='receipt-edge bg-background relative rounded-t-md px-6 pt-6 text-sm tabular-nums'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='font-semibold'>Ansilum</span>
            <span className='text-muted-foreground text-xs'>
              {formatDate(start)}
            </span>
          </div>
          {orderNumber && (
            <p
              className='text-muted-foreground mt-1 truncate text-xs'
              title={orderNumber}
            >
              {orderNumber}
            </p>
          )}

          <div className='border-border my-5 border-t border-dashed' />

          <div className='flex items-baseline gap-2'>
            <span className='font-medium'>{plan?.name ?? '—'}</span>
            <span
              aria-hidden
              className='border-border min-w-4 flex-1 translate-y-[-3px] border-b border-dotted'
            />
            <span>{amount !== undefined ? formatMoney(amount) : '—'}</span>
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {formatDate(start)} – {formatDate(end)}
          </p>
          {plan && (
            <ul className='text-muted-foreground mt-4 space-y-1.5 text-xs'>
              <li>
                {plan.maxOutlets === -1
                  ? copy('Gerai tanpa batas', 'Unlimited outlets')
                  : copy(
                      `Hingga ${plan.maxOutlets} gerai`,
                      `Up to ${plan.maxOutlets} outlets`
                    )}
              </li>
              {plan.features.map((feature) => (
                <li key={feature}>
                  {PLAN_FEATURES[feature]
                    ? copy(...PLAN_FEATURES[feature])
                    : feature}
                </li>
              ))}
            </ul>
          )}

          <div className='border-border my-5 border-t border-dashed' />

          <div className='flex items-baseline justify-between gap-4'>
            <span className='font-semibold'>
              {copy('Total hari ini', 'Total due today')}
            </span>
            <span className='text-base font-bold'>
              {amount !== undefined ? formatMoney(amount) : '—'}
            </span>
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {copy(
              'Diperpanjang otomatis hanya jika Anda menyimpan kartu.',
              'Renews automatically only if you save a card.'
            )}
          </p>

          {isPaid && (
            <span
              role='img'
              aria-label={copy('Lunas', 'Paid')}
              className='stamp-in border-leaf text-leaf absolute right-5 bottom-10 rounded-md border-[2.5px] px-3 py-1 text-xl font-extrabold tracking-[0.12em] uppercase opacity-90'
            >
              {copy('Lunas', 'Paid')}
            </span>
          )}
        </div>
      </div>

      <p className='text-muted-foreground mt-auto hidden items-center gap-2 text-xs lg:flex'>
        <Lock className='size-3.5' />
        {copy(
          'Pembayaran diproses aman oleh Midtrans.',
          'Payments are processed securely by Midtrans.'
        )}
      </p>
    </div>
  )
}
