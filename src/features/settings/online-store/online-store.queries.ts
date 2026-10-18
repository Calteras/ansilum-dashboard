import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productKeys } from '@/features/products/api/products.queries'
import {
  getStorefrontSettingsApi,
  setOutletStorefrontApi,
  setProductStorefrontApi,
  updateStorefrontSettingsApi,
  type StorefrontOverview,
  type StorefrontSettings,
} from './online-store.api'

export const onlineStoreKeys = {
  all: ['online-store'] as const,
  detail: (tenantId: string) => [...onlineStoreKeys.all, tenantId] as const,
}

export function useOnlineStoreQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: onlineStoreKeys.detail(tenantId ?? ''),
    queryFn: getStorefrontSettingsApi,
    enabled: !!tenantId,
  })
}

export function useSaveOnlineStoreMutation(
  tenantId: string | undefined,
  messages: { saved: string; failed: string }
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: StorefrontSettings) =>
      updateStorefrontSettingsApi(settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(onlineStoreKeys.detail(tenantId ?? ''), saved)
      toast.success(messages.saved)
    },
    onError: (error: Error) =>
      toast.error(messages.failed, { description: error.message }),
  })
}

export function useOutletStorefrontMutation(
  tenantId: string | undefined,
  failed: string
) {
  const queryClient = useQueryClient()
  const key = onlineStoreKeys.detail(tenantId ?? '')
  return useMutation({
    mutationFn: ({
      outletId,
      enabled,
    }: {
      outletId: string
      enabled: boolean
    }) => setOutletStorefrontApi(outletId, enabled),
    onMutate: ({ outletId, enabled }) => {
      const previous = queryClient.getQueryData<StorefrontOverview>(key)
      if (previous) {
        queryClient.setQueryData<StorefrontOverview>(key, {
          ...previous,
          outlets: previous.outlets.map((o) =>
            o.id === outletId ? { ...o, storefrontEnabled: enabled } : o
          ),
        })
      }
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(failed, { description: error.message })
    },
  })
}

export function useProductStorefrontMutation(
  tenantId: string | undefined,
  failed: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      visible,
    }: {
      productId: string
      visible: boolean
    }) => setProductStorefrontApi(productId, visible),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: onlineStoreKeys.detail(tenantId ?? ''),
      })
    },
    onError: (error: Error) =>
      toast.error(failed, { description: error.message }),
  })
}
