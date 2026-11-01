import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { subscriptionKeys } from '@/features/settings/subscription/subscription.queries'
import {
  activateTrialApi,
  confirmPhoneCodeApi,
  getTrialEligibilityApi,
  getTrialUsageApi,
  requestPhoneCodeApi,
  requestTrialReviewApi,
} from './trial.api'

const trialKeys = {
  all: (userId?: string) => ['trial', userId ?? ''] as const,
  eligibility: (userId?: string) =>
    [...trialKeys.all(userId), 'eligibility'] as const,
  usage: (userId?: string) => [...trialKeys.all(userId), 'usage'] as const,
}

function useUserId() {
  return useAuthStore((s) => s.user?.id)
}

export function useTrialEligibilityQuery() {
  const userId = useUserId()
  return useQuery({
    queryKey: trialKeys.eligibility(userId),
    queryFn: getTrialEligibilityApi,
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  })
}

export function useTrialUsageQuery(enabled: boolean) {
  const userId = useUserId()
  return useQuery({
    queryKey: trialKeys.usage(userId),
    queryFn: getTrialUsageApi,
    enabled: !!userId && enabled,
  })
}

/** Trial and plan state move together: refresh both after any change. */
function useRefresh() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return () => {
    void queryClient.invalidateQueries({ queryKey: trialKeys.all(userId) })
    void queryClient.invalidateQueries({
      queryKey: subscriptionKeys.current(userId),
    })
  }
}

export function useActivateTrialMutation() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: activateTrialApi, onSettled: refresh })
}

export function useTrialReviewMutation() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (message?: string) => requestTrialReviewApi(message),
    onSettled: refresh,
  })
}

export function useRequestPhoneCodeMutation() {
  return useMutation({ mutationFn: requestPhoneCodeApi })
}

export function useConfirmPhoneCodeMutation() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: confirmPhoneCodeApi, onSuccess: refresh })
}
