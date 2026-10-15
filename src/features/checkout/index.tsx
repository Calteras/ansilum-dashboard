import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { TIER_HIERARCHY } from '@/lib/subscription-access'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@/components/icons'
import { useSessionRestore } from '@/features/auth/hooks/use-session-restore'
import {
  useCancelOrderMutation,
  useCurrentSubscriptionQuery,
  usePendingOrderQuery,
  useSubscribeMutation,
  useSubscriptionOrderQuery,
  useSubscriptionPlansQuery,
} from '@/features/settings/subscription/subscription.queries'
import type {
  PaidTier,
  PaymentType,
} from '@/features/settings/subscription/subscription.types'
import { CheckoutSteps, type StepId } from './components/checkout-steps'
import { MethodStep } from './components/method-step'
import { OrderSummary } from './components/order-summary'
import { PaymentStep } from './components/payment-step'
import { PlanStep } from './components/plan-step'

export interface CheckoutSearch {
  plan?: PaidTier
  order?: string
  renew?: boolean
}

/** Full-screen checkout. Authenticated, but outside the app shell so nothing competes with paying. */
export function Checkout({ search }: { search: CheckoutSearch }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { isPending } = useSessionRestore()

  if (isPending)
    return (
      <div
        role='status'
        aria-label='Loading session'
        className='flex h-svh items-center justify-center'
      >
        <Loader2 className='text-muted-foreground size-8 animate-spin' />
      </div>
    )
  if (!isAuthenticated) return <Navigate to='/sign-in-2' />
  return <CheckoutFlow search={search} />
}

function CheckoutFlow({ search }: { search: CheckoutSearch }) {
  const copy = useCopy()
  const navigate = useNavigate()
  const tenantId = useAuthStore((state) => state.activeTenant?.id)
  const isOwner = useAuthStore((state) =>
    state.tenants.some(
      (member) => member.tenant.id === tenantId && member.role === 'OWNER'
    )
  )

  const plansQuery = useSubscriptionPlansQuery()
  const currentQuery = useCurrentSubscriptionQuery()
  const pendingQuery = usePendingOrderQuery()
  const subscribe = useSubscribeMutation()
  const cancelOrder = useCancelOrderMutation()

  const currentTier = currentQuery.data?.data.tier ?? 'BASIC'
  const plans = (plansQuery.data?.data ?? [])
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  // Renewing offers the current plan; otherwise only upgrades can be bought.
  const renewing = !!search.renew && search.plan === currentTier
  const upgrades = plans.filter((plan) =>
    renewing
      ? plan.tier === currentTier
      : TIER_HIERARCHY[plan.tier] > TIER_HIERARCHY[currentTier]
  )

  // A payment opened elsewhere (another tab or device) takes over until it is settled or closed.
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null)
  const pendingId = pendingQuery.data?.data?.id
  const orderId =
    search.order ??
    (pendingId && pendingId !== dismissedOrderId ? pendingId : null)
  const orderQuery = useSubscriptionOrderQuery(orderId)
  const order = orderQuery.data?.data

  const [tier, setTier] = useState<PaidTier | null>(search.plan ?? null)
  const [stepChoice, setStep] = useState<Exclude<StepId, 'pay'> | null>(
    search.plan ? 'method' : null
  )
  const [checkoutError, setCheckoutError] = useState('')
  const [closeError, setCloseError] = useState('')
  const submitting = useRef(false)

  // A preselected plan the account can't buy (already on it, or higher) is ignored, and
  // with a single possible upgrade there is nothing to choose.
  const onlyUpgrade =
    upgrades.length === 1 ? (upgrades[0].tier as PaidTier) : null
  const selectedTier =
    tier && upgrades.some((plan) => plan.tier === tier) ? tier : onlyUpgrade
  const step = selectedTier
    ? (stepChoice ?? (onlyUpgrade ? 'method' : 'plan'))
    : 'plan'

  const summaryTier = order?.tier ?? selectedTier
  const summaryPlan = plans.find((plan) => plan.tier === summaryTier)
  const summaryAmount = order
    ? Number(order.amount)
    : summaryPlan
      ? Number(summaryPlan.monthlyPrice)
      : undefined

  function startPayment(
    payTier: PaidTier,
    paymentType: PaymentType,
    onError: (message: string) => void
  ) {
    if (submitting.current) return
    submitting.current = true
    subscribe.mutate(
      { tier: payTier, billingCycle: 'MONTHLY', paymentType },
      {
        onSuccess: (response) => {
          void navigate({
            to: '/checkout',
            search: { order: response.data.id },
            replace: true,
          })
        },
        onError: (error) =>
          onError(
            error.message ||
              copy(
                'Pembayaran belum bisa disiapkan. Coba lagi.',
                'Couldn’t prepare the payment. Try again.'
              )
          ),
        onSettled: () => {
          submitting.current = false
        },
      }
    )
  }

  function handleSubmit(paymentType: PaymentType) {
    if (!selectedTier) return
    setCheckoutError('')
    startPayment(selectedTier, paymentType, setCheckoutError)
  }

  function retryCard() {
    if (!order?.tier || order.tier === 'BASIC') return
    setCheckoutError('')
    startPayment(order.tier, 'CREDIT_CARD', setCheckoutError)
  }

  function returnToMethods(fromOrderId: string) {
    setDismissedOrderId(fromOrderId)
    if (order?.tier && order.tier !== 'BASIC') setTier(order.tier)
    setStep('method')
    setCheckoutError('')
    void navigate({
      to: '/checkout',
      search:
        order?.tier && order.tier !== 'BASIC'
          ? {
              plan: order.tier,
              ...(order.tier === currentTier && { renew: true }),
            }
          : {},
      replace: true,
    })
  }

  function handleChangeMethod() {
    if (!order) return
    setCloseError('')
    cancelOrder.mutate(order.id, {
      onSuccess: (response) => {
        if (response.data.paymentStatus !== 'PAID')
          returnToMethods(response.data.id)
      },
      onError: (error) => {
        setCloseError(error.message)
        void orderQuery.refetch()
      },
    })
  }

  let content: React.ReactNode
  let currentStep: StepId = orderId ? 'pay' : step
  const ready =
    plansQuery.isSuccess && currentQuery.isSuccess && pendingQuery.isSuccess

  if (orderId) {
    content = order ? (
      <PaymentStep
        order={order}
        planName={summaryPlan?.name ?? order.tier ?? ''}
        isChecking={orderQuery.isFetching}
        checkFailed={orderQuery.isError}
        onCheck={() => void orderQuery.refetch()}
        isClosing={cancelOrder.isPending}
        closeError={closeError}
        onChangeMethod={handleChangeMethod}
        onRetry={() => returnToMethods(order.id)}
        onRetryCard={retryCard}
        isRetrying={subscribe.isPending}
        retryError={checkoutError}
      />
    ) : orderQuery.isError ? (
      <Notice
        title={copy(
          'Pembayaran tidak ditemukan',
          'We couldn’t open this payment'
        )}
        body={copy(
          'Periksa koneksi Anda lalu coba lagi. Jangan membayar ulang sebelum statusnya terlihat.',
          'Check your connection and try again. Don’t pay again until you can see its status.'
        )}
        action={
          <Button onClick={() => void orderQuery.refetch()}>
            {copy('Coba lagi', 'Try again')}
          </Button>
        }
      />
    ) : (
      <Loading />
    )
  } else if (!ready) {
    content =
      plansQuery.isError || currentQuery.isError || pendingQuery.isError ? (
        <Notice
          title={copy('Checkout belum bisa dibuka', 'Checkout couldn’t load')}
          body={copy(
            'Paket Anda belum berubah. Periksa koneksi lalu coba lagi.',
            'Your plan hasn’t changed. Check your connection and try again.'
          )}
          action={
            <Button
              onClick={() => {
                void plansQuery.refetch()
                void currentQuery.refetch()
                void pendingQuery.refetch()
              }}
            >
              {copy('Coba lagi', 'Try again')}
            </Button>
          }
        />
      ) : (
        <Loading />
      )
  } else if (!isOwner) {
    content = (
      <Notice
        title={copy(
          'Hanya pemilik usaha yang bisa membeli paket',
          'Only a business owner can upgrade'
        )}
        body={copy(
          'Pilih usaha milik Anda dari pengalih usaha, atau minta pemiliknya untuk upgrade.',
          'Switch to a business you own, or ask its owner to upgrade.'
        )}
        action={<BackToSettings />}
      />
    )
  } else if (upgrades.length === 0) {
    currentStep = 'plan'
    content = (
      <Notice
        title={copy(
          'Anda sudah di paket tertinggi',
          'You’re on the highest plan'
        )}
        body={copy(
          'Semua fitur Ansilum sudah tersedia untuk usaha Anda.',
          'Every Ansilum feature is already available to your businesses.'
        )}
        action={<BackToSettings />}
      />
    )
  } else if (step === 'plan') {
    content = (
      <PlanStep
        plans={upgrades}
        value={selectedTier}
        onChange={setTier}
        onContinue={() => setStep('method')}
      />
    )
  } else {
    content = (
      <MethodStep
        isSubmitting={subscribe.isPending}
        error={checkoutError}
        onBack={onlyUpgrade ? undefined : () => setStep('plan')}
        onSubmit={handleSubmit}
      />
    )
  }

  return (
    <div className='bg-background grid min-h-svh lg:grid-cols-2'>
      <aside className='bg-muted px-6 pt-6 pb-8 sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-svh lg:overflow-y-auto lg:border-r lg:py-14 lg:pr-16 xl:pr-24'>
        <OrderSummary
          plan={summaryPlan}
          amount={summaryAmount}
          orderNumber={order?.orderNumber}
          status={order?.paymentStatus}
          paidAt={order?.paidAt}
        />
      </aside>
      <main
        id='content'
        className='px-6 py-10 sm:px-10 lg:py-14 lg:pl-16 xl:pl-24'
      >
        <div className='w-full max-w-[28rem] space-y-10'>
          <CheckoutSteps
            current={currentStep}
            done={order?.paymentStatus === 'PAID'}
            onSelect={(target) => target !== 'pay' && setStep(target)}
          />
          {content}
        </div>
      </main>
    </div>
  )
}

function Loading() {
  return (
    <div
      role='status'
      className='text-muted-foreground flex items-center gap-2 py-10 text-sm'
    >
      <Loader2 className='size-4 animate-spin' />
      <span className='sr-only'>Loading</span>
    </div>
  )
}

function Notice({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <section role='alert' className='space-y-4'>
      <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
      <p className='text-muted-foreground'>{body}</p>
      {action}
    </section>
  )
}

function BackToSettings() {
  const copy = useCopy()
  return (
    <Button asChild variant='outline'>
      <Link to='/settings/subscription'>
        {copy('Kembali ke langganan', 'Back to subscription')}
      </Link>
    </Button>
  )
}
