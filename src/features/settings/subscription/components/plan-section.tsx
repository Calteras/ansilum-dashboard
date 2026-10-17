import { Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, Sparkles, Zap } from '@/components/icons'
import { formatDate } from '@/features/checkout/format'
import { cycleLabel } from '../billing-labels'
import { useResumeSubscriptionMutation } from '../subscription.queries'
import type { BillingOverview, SubscriptionTier } from '../subscription.types'

const TIER_ICONS: Record<SubscriptionTier, React.ElementType> = {
  BASIC: Zap,
  STANDARD: Sparkles,
  FULL: Building2,
}

export function PlanSection({
  overview,
  canCheckout,
}: {
  overview: BillingOverview
  /** The selected business is owned and no other payment is open. */
  canCheckout: boolean
}) {
  const copy = useCopy()
  const resume = useResumeSubscriptionMutation()
  const { subscription, renewal } = overview
  const tier = subscription?.tier ?? 'BASIC'
  const Icon = TIER_ICONS[tier]
  const end = subscription ? formatDate(subscription.currentPeriodEnd) : ''

  const status = !subscription
    ? copy(
        'Paket gratis. Upgrade saat usaha Anda membutuhkan lebih banyak.',
        'Free plan. Upgrade when your business needs more.'
      )
    : renewal?.mode === 'auto'
      ? copy(
          `Langganan Anda diperpanjang otomatis pada ${end}.`,
          `Your subscription will auto renew on ${end}.`
        )
      : renewal?.mode === 'ending'
        ? copy(
            `Paket Anda berakhir pada ${end}. Setelah itu akun Anda kembali ke Basic.`,
            `Your plan ends on ${end}. After that your account moves to Basic.`
          )
        : copy(
            `Paket Anda aktif hingga ${end}. Perpanjang sebelum tanggal itu agar tidak terputus.`,
            `Your plan is active until ${end}. Renew before then to keep it.`
          )

  return (
    <section
      aria-labelledby='billing-plan'
      className='flex flex-wrap items-start justify-between gap-x-6 gap-y-4'
    >
      <div className='flex min-w-0 flex-1 gap-4'>
        <div className='bg-muted flex size-14 shrink-0 items-center justify-center rounded-lg'>
          <Icon className='text-foreground size-7' />
        </div>
        <div className='min-w-0 space-y-0.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <h4 id='billing-plan' className='font-semibold'>
              {subscription
                ? copy(
                    `Paket ${subscription.planName}`,
                    `${subscription.planName} plan`
                  )
                : copy('Paket Basic', 'Basic plan')}
            </h4>
            {renewal?.mode === 'ending' && (
              <Badge variant='secondary'>
                {copy('Dibatalkan', 'Cancelled')}
              </Badge>
            )}
          </div>
          {subscription && (
            <p className='text-sm'>
              {cycleLabel(copy, subscription.billingCycle)}
              {renewal?.amount
                ? ` · ${formatMoney(renewal.amount)} / ${copy('bulan', 'month')}`
                : ''}
            </p>
          )}
          <p className='text-muted-foreground text-sm'>{status}</p>
          {resume.isError && (
            <p role='alert' className='text-destructive text-sm'>
              {resume.error.message}
            </p>
          )}
        </div>
      </div>
      <div className='flex shrink-0 flex-wrap gap-2'>
        {renewal?.mode === 'ending' ? (
          <Button onClick={() => resume.mutate()} disabled={resume.isPending}>
            {resume.isPending && <Loader2 className='size-4 animate-spin' />}
            {copy('Lanjutkan langganan', 'Resume subscription')}
          </Button>
        ) : (
          subscription &&
          renewal?.mode === 'manual' &&
          renewal.canRenewNow &&
          canCheckout && (
            <Button asChild>
              <Link
                to='/checkout'
                search={{
                  plan: subscription.tier as Exclude<SubscriptionTier, 'BASIC'>,
                  renew: true,
                }}
              >
                {copy('Perpanjang sekarang', 'Renew now')}
              </Link>
            </Button>
          )
        )}
        {canCheckout ? (
          <Button asChild variant='outline'>
            <Link to='/checkout'>{copy('Ubah paket', 'Adjust plan')}</Link>
          </Button>
        ) : (
          <Button variant='outline' disabled>
            {copy('Ubah paket', 'Adjust plan')}
          </Button>
        )}
      </div>
    </section>
  )
}
