import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from './notifications.api'

const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationKeys.all, userId ?? ''] as const,
}

/** Renewal reminders arrive from scheduled jobs, so the list refreshes on its own. */
const REFRESH_MS = 60_000

export function useNotificationsQuery() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => listNotificationsApi(),
    enabled: !!userId,
    refetchInterval: REFRESH_MS,
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
