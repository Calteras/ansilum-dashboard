import { useEffect } from 'react'
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  listSubscriptionPlansApi,
  getCurrentSubscriptionApi,
  subscribeApi,
  getSubscriptionOrderApi,
  getPendingOrderApi,
  cancelSubscriptionOrderApi,
  chargeCardApi,
  getBillingOverviewApi,
  listPaymentsApi,
  saveCardApi,
  removeCardApi,
  setAutoRenewApi,
  cancelSubscriptionApi,
  resumeSubscriptionApi,
} from './subscription.api'
import type { SaveCardRequest, SubscribeRequest } from './subscription.types'

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  current: (userId?: string) =>
    userId
      ? ([...subscriptionKeys.all, 'current', userId] as const)
      : ([...subscriptionKeys.all, 'current'] as const),
  pending: (userId?: string) =>
    userId
      ? ([...subscriptionKeys.all, 'pending', userId] as const)
      : ([...subscriptionKeys.all, 'pending'] as const),
  order: (id: string) => [...subscriptionKeys.all, 'order', id] as const,
  billing: (userId?: string) =>
    [...subscriptionKeys.all, 'billing', userId ?? ''] as const,
  payments: (userId?: string, page?: number) =>
    page === undefined
      ? ([...subscriptionKeys.all, 'payments', userId ?? ''] as const)
      : ([...subscriptionKeys.all, 'payments', userId ?? '', page] as const),
}

/** Plan, card and history all change together when billing changes. */
function refreshBilling(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: [...subscriptionKeys.all, 'billing'],
    }),
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() }),
    queryClient.invalidateQueries({
      queryKey: [...subscriptionKeys.all, 'payments'],
    }),
  ])
}

/** How often an open payment is re-checked; the backend also asks Midtrans directly. */
const PAYMENT_POLL_MS = 4000

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: listSubscriptionPlansApi,
  })
}

export function useCurrentSubscriptionQuery() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: subscriptionKeys.current(userId),
    queryFn: getCurrentSubscriptionApi,
    enabled: !!userId,
  })
}

/** The account's open payment, from the server, so it resumes on any device or tab. */
export function usePendingOrderQuery() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: subscriptionKeys.pending(userId),
    queryFn: getPendingOrderApi,
    enabled: !!userId,
  })
}

export function useSubscribeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubscribeRequest) => subscribeApi(data),
    onSuccess: (response) => {
      queryClient.setQueryData(
        subscriptionKeys.order(response.data.id),
        response
      )
    },
    // A conflict means another tab or device already opened a payment: surface it.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.pending() }),
  })
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelSubscriptionOrderApi(orderId),
    onSuccess: (response) => {
      queryClient.setQueryData(
        subscriptionKeys.order(response.data.id),
        response
      )
    },
    onSettled: (_data, _error, orderId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.pending() }),
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.order(orderId),
        }),
      ]),
  })
}

export function useChargeCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      tokenId,
      saveCard,
    }: {
      orderId: string
      tokenId: string
      saveCard?: boolean
    }) => chargeCardApi(orderId, tokenId, saveCard),
    onSuccess: (response) => {
      queryClient.setQueryData(
        subscriptionKeys.order(response.data.id),
        response
      )
    },
    // A failed charge ends the order server-side; show that state.
    onError: (_error, { orderId }) =>
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.order(orderId),
      }),
  })
}

export function useSubscriptionOrderQuery(orderId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: subscriptionKeys.order(orderId!),
    queryFn: () => getSubscriptionOrderApi(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.paymentStatus
      if (status && status !== 'PENDING') return false
      return PAYMENT_POLL_MS
    },
    refetchIntervalInBackground: true,
  })
  const status = query.data?.data.paymentStatus
  useEffect(() => {
    if (!status || status === 'PENDING') return
    void queryClient.invalidateQueries({ queryKey: subscriptionKeys.pending() })
    void refreshBilling(queryClient)
  }, [status, queryClient])
  return query
}

export function useBillingOverviewQuery() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: subscriptionKeys.billing(userId),
    queryFn: getBillingOverviewApi,
    enabled: !!userId,
  })
}

export function usePaymentHistoryQuery(page: number) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: subscriptionKeys.payments(userId, page),
    queryFn: () => listPaymentsApi(page),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  })
}

function useBillingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => refreshBilling(queryClient),
  })
}

export function useSaveCardMutation() {
  return useBillingMutation((card: SaveCardRequest) => saveCardApi(card))
}

export function useRemoveCardMutation() {
  return useBillingMutation<void, unknown>(() => removeCardApi())
}

export function useAutoRenewMutation() {
  return useBillingMutation((enabled: boolean) => setAutoRenewApi(enabled))
}

export function useCancelSubscriptionMutation() {
  return useBillingMutation((reason?: string) => cancelSubscriptionApi(reason))
}

export function useResumeSubscriptionMutation() {
  return useBillingMutation<void, unknown>(() => resumeSubscriptionApi())
}
