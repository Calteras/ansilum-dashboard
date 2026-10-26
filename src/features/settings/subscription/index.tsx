import { Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from '@/components/icons'
import { formatDateTime } from '@/features/checkout/format'
import { CancelPlanSection } from './components/cancel-plan-section'
import { PaymentHistory } from './components/payment-history'
import { PaymentMethodSection } from './components/payment-method-section'
import { PlanSection } from './components/plan-section'
import {
  useBillingOverviewQuery,
  usePendingOrderQuery,
} from './subscription.queries'

/** Billing in the style of Claude's: plan, payment method, history, then cancellation. */
export function SettingsSubscription() {
  const copy = useCopy()
  const billing = useBillingOverviewQuery()
  const pendingQuery = usePendingOrderQuery()
  const pendingOrder = pendingQuery.data?.data ?? null
  const tenantId = useAuthStore((state) => state.activeTenant?.id)
  const isOwner = useAuthStore((state) =>
    state.tenants.some(
      (member) => member.tenant.id === tenantId && member.role === 'OWNER'
    )
  )
  const overview = billing.data?.data
  const renewal = overview?.renewal

  return (
    <div className='flex min-w-0 flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>
          {copy('Langganan & tagihan', 'Subscription & billing')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {copy(
            'Kelola paket, kartu, dan invoice Anda.',
            'Manage your plan, payment method and invoices.'
          )}
        </p>
      </div>
      <Separator className='my-4 flex-none' />

      <div className='max-w-3xl space-y-10 pb-12'>
        {pendingOrder && (
          <div className='border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'>
            <div>
              <p className='font-medium'>
                {copy('Pembayaran Anda menunggu', 'Your payment is waiting')}
              </p>
              <p className='text-muted-foreground text-sm'>
                {copy(
                  `Bayar ${formatMoney(pendingOrder.amount)} sebelum ${formatDateTime(pendingOrder.expiresAt)}, atau ganti cara bayar.`,
                  `Pay ${formatMoney(pendingOrder.amount)} before ${formatDateTime(pendingOrder.expiresAt)}, or change the payment method.`
                )}
              </p>
            </div>
            <Button asChild>
              <Link to='/checkout' search={{ order: pendingOrder.id }}>
                {copy('Lanjutkan pembayaran', 'Continue payment')}
              </Link>
            </Button>
          </div>
        )}

        {/* The last days of a plan that won't renew by itself. */}
        {renewal?.mode === 'manual' && renewal.canRenewNow && (
          <div
            role='status'
            className='flex gap-3 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4 text-sm'
          >
            <AlertTriangle className='mt-0.5 size-4 shrink-0 text-status-warning' />
            <p>
              {copy(
                'Paket Anda segera berakhir dan tidak diperpanjang otomatis. Perpanjang sekarang, atau simpan kartu untuk perpanjangan otomatis.',
                'Your plan ends soon and won’t renew by itself. Renew now, or save a card to renew automatically.'
              )}
            </p>
          </div>
        )}

        {billing.isPending ? (
          <div className='flex gap-4' aria-label={copy('Memuat', 'Loading')}>
            <Skeleton className='size-14 rounded-lg' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='h-4 w-64' />
            </div>
          </div>
        ) : billing.isError || !overview ? (
          <div role='alert' className='bg-card shadow-surface rounded-lg border p-4 text-sm'>
            {copy(
              'Info tagihan belum bisa dimuat. Paket Anda tidak berubah.',
              'Billing couldn’t be loaded. Your plan hasn’t changed.'
            )}{' '}
            <Button
              variant='link'
              className='h-auto p-0'
              onClick={() => void billing.refetch()}
            >
              {copy('Coba lagi', 'Try again')}
            </Button>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              <PlanSection
                overview={overview}
                canCheckout={isOwner && !pendingOrder}
              />
              {!isOwner && (
                <p className='text-muted-foreground text-sm'>
                  {tenantId
                    ? copy(
                        'Hanya pemilik usaha yang dipilih yang bisa mengubah atau memperpanjang paket.',
                        'Only the owner of the selected business can change or renew the plan.'
                      )
                    : copy(
                        'Pilih usaha milik Anda dari pengalih usaha untuk mengubah paket.',
                        'Select a business you own from the business switcher to change the plan.'
                      )}
                </p>
              )}
            </div>
            <PaymentMethodSection overview={overview} />
          </>
        )}

        <PaymentHistory />

        {overview?.subscription && !overview.subscription.cancelAtPeriodEnd && (
          <CancelPlanSection subscription={overview.subscription} />
        )}
      </div>
    </div>
  )
}
