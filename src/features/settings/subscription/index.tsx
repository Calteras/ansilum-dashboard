import { UiText } from '@/components/ui-text'
import { PRICING, PLAN_FEATURES } from '@/content/pricing'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { useRef, useState } from 'react'
import {
  Check,
  Zap,
  Building2,
  Sparkles,
} from '@/components/icons'
import { useAuthStore } from '@/stores/auth-store'
import { TIER_HIERARCHY } from '@/lib/subscription-access'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PaymentInstructionsDialog } from './components/payment-instructions-dialog'
import { PaymentMethodDialog } from './components/payment-method-dialog'
import {
  useSubscriptionPlansQuery,
  useCurrentSubscriptionQuery,
  useSubscribeMutation,
  useSubscriptionOrderQuery,
} from './subscription.queries'
import type { SubscriptionPlan, SubscriptionTier } from './subscription.types'


const TIER_CONFIG: Record<
  SubscriptionTier,
  {
    icon: React.ElementType
    color: string
    bgGradient: string
    badgeClass: string
    popular?: boolean
  }
> = {
  BASIC: {
    icon: Zap,
    color: 'text-muted-foreground',
    bgGradient: '',
    badgeClass: '',
  },
  STANDARD: {
    icon: Sparkles,
    color: 'text-brand-ink',
    bgGradient: 'bg-muted/40',
    badgeClass: 'bg-brand-soft text-brand-ink',
    popular: true,
  },
  FULL: {
    icon: Building2,
    color: 'text-foreground',
    bgGradient: '',
    badgeClass:
      'bg-muted text-foreground',
  },
}

const formatPrice = formatMoney

export function SettingsSubscription() {
  const copy = useCopy()
  const isYearly = false
  const { data, isLoading, isError, refetch, isFetching } =
    useSubscriptionPlansQuery()
  const currentQuery = useCurrentSubscriptionQuery()
  const currentSub = currentQuery.data
  const subscribeMutation = useSubscribeMutation()
  const userId = useAuthStore((state) => state.user?.id)
  const tenantId = useAuthStore((state) => state.activeTenant?.id)
  const memberships = useAuthStore((state) => state.tenants)
  const isOwner = memberships.some(
    (member) => member.tenant.id === tenantId && member.role === 'OWNER'
  )
  const plans = [...(data?.data ?? [])]
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const storageKey = `subscription-payment:${userId}`
  const [savedOrder, setSavedOrder] = useState<{
    userId: string | undefined
    id: string | null
  }>(() => {
    try {
      return { userId, id: localStorage.getItem(storageKey) }
    } catch {
      return { userId, id: null }
    }
  })
  const pendingId = savedOrder.userId === userId ? savedOrder.id : null
  const pendingQuery = useSubscriptionOrderQuery(pendingId)
  const pendingStatus = pendingQuery.data?.data.paymentStatus
  const hasPendingPayment =
    !!pendingId && (!pendingStatus || pendingStatus === 'PENDING')
  const submitting = useRef(false)
  const [checkoutError, setCheckoutError] = useState('')
  const checkoutBlocked =
    !isOwner ||
    !currentQuery.isSuccess ||
    currentQuery.isError ||
    hasPendingPayment

  const currentTier: SubscriptionTier = currentSub?.data?.tier ?? 'BASIC'
  const currentTierConfig = TIER_CONFIG[currentTier] ?? TIER_CONFIG.BASIC
  const CurrentIcon = currentTierConfig.icon

  // Dialog state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  )
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false)
  const [orderData, setOrderData] = useState<
    import('./subscription.types').SubscribeResponse['data'] | null
  >(null)

  function handleUpgradeClick(plan: SubscriptionPlan) {
    if (
      checkoutBlocked ||
      TIER_HIERARCHY[plan.tier] <= TIER_HIERARCHY[currentTier]
    )
      return
    setCheckoutError('')
    setSelectedPlan(plan)
    setPaymentDialogOpen(true)
  }

  function handlePaymentSubmit(paymentType: string) {
    if (!selectedPlan || checkoutBlocked || submitting.current) return
    submitting.current = true
    setCheckoutError('')
    subscribeMutation.mutate(
      {
        tier: selectedPlan.tier,
        billingCycle: isYearly ? 'YEARLY' : 'MONTHLY',
        paymentType,
      },
      {
        onSuccess: (response) => {
          setSavedOrder({ userId, id: response.data.orderId })
          try {
            localStorage.setItem(storageKey, response.data.orderId)
          } catch {
            /* Payment remains available in this tab. */
          }
          setOrderData(response.data)
          setPaymentDialogOpen(false)
          setInstructionsDialogOpen(true)
        },
        onError: (error) =>
          setCheckoutError(
            error.message || 'Could not prepare payment. Please try again.'
          ),
        onSettled: () => {
          submitting.current = false
        },
      }
    )
  }

  return (
    <div className='flex min-w-0 flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{copy('Paket langganan', 'Subscription & billing')}</h3>
        <p className='text-muted-foreground text-sm'>
          {copy('Pilih paket untuk usaha Anda. Periksa totalnya sebelum membayar.', 'Choose the right plan for your business. Review the total before you pay.')}
        </p>
      </div>
      <Separator className='my-4 flex-none' />

      <div className='space-y-8 pb-12'>
        {/* Current Plan Banner */}
        <Card className='border-primary/20 bg-primary/5 py-0'>
          <CardContent className='flex flex-wrap items-center justify-between gap-4 p-5'>
            <div className='flex items-center gap-4'>
              <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl'>
                <CurrentIcon className='text-primary h-6 w-6' />
              </div>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-lg font-semibold'>
                    {currentQuery.isSuccess
                      ? `${currentTier.charAt(0) + currentTier.slice(1).toLowerCase()} Plan`
                      : copy('Memeriksa paket Anda…', 'Checking your plan…')}
                  </span>
                  <Badge variant='outline' className='text-xs'>
                    {copy('Paket saat ini', 'Current Plan')}
                  </Badge>
                </div>
                <p className='text-muted-foreground text-sm'>
                  {!currentQuery.isSuccess
                    ? copy('Memeriksa paket sebelum melanjutkan pembayaran.', 'Your current plan must be confirmed before checkout.')
                    : currentTier === 'BASIC'
                      ? copy('Anda menggunakan Basic. Pilih paket lain saat usaha Anda membutuhkannya.', 'You are on the Basic plan. Upgrade when your business needs more.')
                      : copy('Paket Anda aktif.', 'Your subscription is active.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentQuery.isError && (
          <div role='alert' className='rounded-lg border p-4 text-sm'><UiText id="Paket Anda belum bisa diperiksa." en="We couldn’t confirm your current plan." />{' '}
            <Button
              variant='outline'
              onClick={() => void currentQuery.refetch()}
            >
              {copy('Coba lagi', 'Retry current plan')}
            </Button>
          </div>
        )}
        {!isOwner && (
          <p className='text-muted-foreground rounded-lg border p-4 text-sm'>
            {tenantId
              ? 'Only the owner of the selected business can purchase an upgrade. Select a business you own or contact its owner.'
              : 'Select a business you own from the business switcher to upgrade.'}
          </p>
        )}
        {pendingId && (
          <div className='border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'>
            <div>
              <p className='font-medium'>
                {hasPendingPayment
                  ? 'Your payment is waiting'
                  : 'Your latest payment'}
              </p>
              <p className='text-muted-foreground text-sm'><UiText id="Lihat status dan petunjuk pembayaran pesanan Anda." en="Open your order to check its status and payment details." /></p>
            </div>
            <Button onClick={() => setInstructionsDialogOpen(true)}>
              {copy('Lihat pembayaran', 'View payment')}
            </Button>
          </div>
        )}
        <p className='text-muted-foreground text-sm'>{copy('Tagihan bulanan. Harga tahunan belum tersedia.', 'Monthly billing. Annual pricing is not available yet.')}</p>
        {/* Plan Cards */}
        {isLoading ? (
          <div className='text-muted-foreground flex justify-center py-12'>
            {copy('Memuat paket…', 'Loading plans...')}
          </div>
        ) : isError || plans.length === 0 ? (
          <div
            role='alert'
            className='space-y-3 rounded-xl border p-8 text-center'
          >
            <h4 className='font-semibold'>
              {isError
                ? 'Plans couldn’t be loaded'
                : 'Plans are temporarily unavailable'}
            </h4>
            <p className='text-muted-foreground text-sm'><UiText id="Silakan coba lagi. Paket Anda belum berubah." en="Please try again. Your current plan has not changed." /></p>
            <Button
              variant='outline'
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? 'Checking…' : 'Retry plans'}
            </Button>
          </div>
        ) : (
          <div className='grid overflow-hidden rounded-xl border @3xl/content:grid-cols-3'>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                isCurrent={currentQuery.isSuccess && plan.tier === currentTier}
                canUpgrade={
                  !checkoutBlocked &&
                  TIER_HIERARCHY[plan.tier] > TIER_HIERARCHY[currentTier]
                }
                isLower={
                  TIER_HIERARCHY[plan.tier] < TIER_HIERARCHY[currentTier]
                }
                onUpgrade={handleUpgradeClick}
              />
            ))}
          </div>
        )}

        {/* Feature Comparison */}
        {plans.length > 0 && (
          <>
            <Separator />
            <FeatureComparison plans={plans} />
          </>
        )}
      </div>

      {/* Payment Method Dialog */}
      {selectedPlan && paymentDialogOpen && (
        <PaymentMethodDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          plan={selectedPlan}
          isYearly={isYearly}
          isLoading={subscribeMutation.isPending}
          onSubmit={handlePaymentSubmit}
          error={checkoutError}
        />
      )}

      {/* Payment Instructions Dialog */}
      <PaymentInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
        orderId={pendingId}
        initialPaymentType={orderData?.paymentType ?? ''}
        initialVaNumber={orderData?.vaNumber ?? null}
        initialBillKey={orderData?.billKey ?? null}
        initialBillerCode={orderData?.billerCode ?? null}
        initialQrCodeUrl={orderData?.qrCodeUrl ?? null}
        initialDeeplinkUrl={orderData?.deeplinkUrl ?? null}
        initialAmount={Number(
          pendingQuery.data?.data.amount ?? orderData?.amount ?? 0
        )}
        initialOrderNumber={
          pendingQuery.data?.data.orderNumber ?? orderData?.orderNumber ?? ''
        }
        initialExpiresAt={
          pendingQuery.data?.data.expiresAt ?? orderData?.expiresAt ?? ''
        }
      />
    </div>
  )
}

function PlanCard({ plan, isCurrent, canUpgrade, isLower, onUpgrade }: {
  plan: SubscriptionPlan; isYearly: boolean; isCurrent: boolean; canUpgrade: boolean; isLower: boolean; onUpgrade: (plan: SubscriptionPlan) => void
}) {
  const copy = useCopy()
  const details = PRICING.find((item) => item.tier === plan.tier)
  return (
    <section className={cn('flex min-w-0 flex-col gap-5 border-b p-6 last:border-0 @3xl/content:border-r @3xl/content:border-b-0', plan.tier === 'STANDARD' && 'bg-muted/40')}>
      <div className='flex flex-wrap items-center justify-between gap-2'><h4 className='text-xl font-bold'>{plan.name}</h4>{plan.tier === 'STANDARD' && <Badge variant='upcoming'>{copy('Rekomendasi', 'Recommended')}</Badge>}</div>
      <p className='text-muted-foreground min-h-10 text-sm'>{details ? copy(details.description[0], details.description[1]) : plan.description}</p>
      <div><p className='text-[28px] font-bold tracking-tight tabular-nums'>{formatPrice(plan.monthlyPrice)}</p><p className='text-muted-foreground text-sm'>{copy('per bulan', 'per month')}</p></div>
      {isCurrent ? <Button variant='outline' disabled>{copy('Paket saat ini', 'Current Plan')}</Button> : isLower || plan.tier === 'BASIC' ? <Button variant='outline' disabled>{copy('Termasuk dalam paket Anda', 'Included in your plan')}</Button> : <Button variant={plan.tier === 'STANDARD' ? 'default' : 'outline'} disabled={!canUpgrade} onClick={() => onUpgrade(plan)}>{copy('Pilih', 'Upgrade to')} {plan.name}</Button>}
      <div className='space-y-3 border-t pt-5'>
        <p className='text-muted-foreground text-sm'>{plan.maxTenants} {copy('usaha', plan.maxTenants === 1 ? 'business included' : 'businesses included')}</p>
        <p className='text-sm font-semibold'>{plan.maxOutlets === -1 ? copy('Gerai tanpa batas', 'Unlimited outlets') : `${plan.maxOutlets} ${copy('gerai', 'outlets')}`}</p>
        <ul className='space-y-3'>{plan.features.map((feature) => <li key={feature} className='flex items-start gap-2 text-sm'><Check className='text-leaf size-5 shrink-0' /><span>{PLAN_FEATURES[feature] ? copy(...PLAN_FEATURES[feature]) : feature}</span></li>)}</ul>
      </div>
    </section>
  )
}

function FeatureComparison({ plans }: { plans: SubscriptionPlan[] }) {
  const copy = useCopy()
  const allFeatures = Array.from(new Set(plans.flatMap((p) => p.features)))

  return (
    <div className='space-y-4'>
      <h4 className='text-lg font-semibold'>{copy('Bandingkan paket', 'Compare Plans')}</h4>
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='bg-muted/50 border-b'>
              <th className='px-4 py-3 text-left font-medium'><UiText id="Fitur" en="Feature" /></th>
              {plans.map((plan) => (
                <th key={plan.id} className='px-4 py-3 text-center font-medium'>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className='border-b'>
              <td className='px-4 py-3 font-medium'><UiText id="Jumlah gerai" en="Max Outlets" /></td>
              {plans.map((plan) => (
                <td key={plan.id} className='px-4 py-3 text-center'>
                  {plan.maxOutlets === -1 ? (
                    <span aria-label={copy('Tanpa batas', 'Unlimited')}>∞</span>
                  ) : (
                    plan.maxOutlets
                  )}
                </td>
              ))}
            </tr>
            {allFeatures.map((feature) => (
              <tr key={feature} className='border-b last:border-0'>
                <td className='px-4 py-3'>
                  {PLAN_FEATURES[feature] ? copy(...PLAN_FEATURES[feature]) : feature}
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className='px-4 py-3 text-center'>
                    {plan.features.includes(feature) ? (
                      <Check
                        size={16}
                        className='inline text-leaf '
                      />
                    ) : (
                      <span className='text-muted-foreground'>&mdash;</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
