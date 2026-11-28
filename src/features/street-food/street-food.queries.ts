import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  connectApi,
  disconnectApi,
  getFeesApi,
  getOverviewApi,
  listOrdersApi,
  reconnectApi,
  rotateSecretApi,
  saveHoursApi,
  saveSettingsApi,
  setPublicationApi,
} from './street-food.api'
import { connectionState, refreshInterval } from './street-food.logic'
import type {
  HoursInterval,
  OrderView,
  OutletSettingsInput,
  StreetFoodOverview,
} from './street-food.types'

const streetFoodKeys = {
  all: ['street-food'] as const,
  overview: (tenantId: string) =>
    [...streetFoodKeys.all, 'overview', tenantId] as const,
  fees: (tenantId: string) =>
    [...streetFoodKeys.all, 'fees', tenantId] as const,
  orders: (tenantId: string, outletId: string, view: OrderView) =>
    [...streetFoodKeys.all, 'orders', tenantId, outletId, view] as const,
}

/**
 * Link, delivery health and outlets. While a new connection is still settling (waiting for the
 * platform operator, say) it looks again every few seconds, so the screen turns green by itself.
 */
export function useOverviewQuery(
  tenantId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: streetFoodKeys.overview(tenantId ?? ''),
    queryFn: getOverviewApi,
    enabled: !!tenantId && enabled,
    refetchInterval: (query) =>
      query.state.data
        ? refreshInterval(connectionState(query.state.data))
        : false,
  })
}

/** What the business owes the platform. Asks the platform, so only once it is connected. */
export function useFeesQuery(tenantId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: streetFoodKeys.fees(tenantId ?? ''),
    queryFn: getFeesApi,
    enabled: !!tenantId && enabled,
    retry: false,
  })
}

interface Messages {
  failed: string
  saved?: string
}

function useRefresh(tenantId: string | undefined) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      queryKey: streetFoodKeys.overview(tenantId ?? ''),
    })
}

export function useConnectMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: (platformUrl: string) => connectApi(platformUrl),
    onSuccess: () => void refresh(),
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

/** Gives the platform this POS's current key again; deliveries that were refused go out at once. */
export function useReconnectMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: () => reconnectApi(),
    onSuccess: () => {
      void refresh()
      if (messages.saved) toast.success(messages.saved)
    },
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

export function useRotateSecretMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: () => rotateSecretApi(),
    onSuccess: () => void refresh(),
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

export function useDisconnectMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: () => disconnectApi(),
    onSuccess: () => {
      void refresh()
      if (messages.saved) toast.success(messages.saved)
    },
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

/** Showing or hiding an outlet answers at once and rolls back if the POS refuses. */
export function usePublicationMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const queryClient = useQueryClient()
  const key = streetFoodKeys.overview(tenantId ?? '')
  return useMutation({
    mutationFn: ({
      outletId,
      enabled,
    }: {
      outletId: string
      enabled: boolean
    }) => setPublicationApi(outletId, enabled),
    onMutate: ({ outletId, enabled }) => {
      const previous = queryClient.getQueryData<StreetFoodOverview>(key)
      if (previous)
        queryClient.setQueryData<StreetFoodOverview>(key, {
          ...previous,
          outlets: previous.outlets.map((o) =>
            o.outletId === outletId ? { ...o, enabled } : o
          ),
        })
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(messages.failed, { description: error.message })
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useSettingsMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: ({
      outletId,
      settings,
    }: {
      outletId: string
      settings: OutletSettingsInput
    }) => saveSettingsApi(outletId, settings),
    onSuccess: () => {
      void refresh()
      if (messages.saved) toast.success(messages.saved)
    },
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

export function useHoursMutation(
  tenantId: string | undefined,
  messages: Messages
) {
  const refresh = useRefresh(tenantId)
  return useMutation({
    mutationFn: ({
      outletId,
      intervals,
    }: {
      outletId: string
      intervals: HoursInterval[]
    }) => saveHoursApi(outletId, intervals),
    onSuccess: () => {
      void refresh()
      if (messages.saved) toast.success(messages.saved)
    },
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

/** An outlet's StreetFood orders, looked at again every 15 seconds while the panel is open. */
export function useOrdersQuery(
  tenantId: string | undefined,
  outletId: string | undefined,
  view: OrderView
) {
  return useQuery({
    queryKey: streetFoodKeys.orders(tenantId ?? '', outletId ?? '', view),
    queryFn: () => listOrdersApi(outletId ?? '', view),
    enabled: !!tenantId && !!outletId,
    refetchInterval: 15_000,
  })
}
