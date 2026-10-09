import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  listSubscriptionPlansApi,
  getCurrentSubscriptionApi,
  subscribeApi,
  getSubscriptionOrderApi,
} from './subscription.api'
import type { SubscribeRequest } from './subscription.types'

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  current: (userId?: string) =>
    userId
      ? ([...subscriptionKeys.all, 'current', userId] as const)
      : ([...subscriptionKeys.all, 'current'] as const),
  order: (id: string) => [...subscriptionKeys.all, 'order', id] as const,
}

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

export function useSubscribeMutation() {
  return useMutation({
    mutationFn: (data: SubscribeRequest) => subscribeApi(data),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to subscribe')
    },
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
      return 5000
    },
  })
  const status = query.data?.data.paymentStatus
  useEffect(() => {
    if (status === 'PAID' || status === 'SETTLEMENT') {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.current(),
      })
    }
  }, [status, queryClient])
  return query
}
