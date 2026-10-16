import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getReceiptSettingsApi,
  updateReceiptSettingsApi,
  type ReceiptSettings,
} from './receipt-settings.api'

export const receiptSettingsKeys = {
  all: ['receipt-settings'] as const,
  detail: (tenantId: string) => [...receiptSettingsKeys.all, tenantId] as const,
}

export function useReceiptSettingsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: receiptSettingsKeys.detail(tenantId ?? ''),
    queryFn: () => getReceiptSettingsApi(tenantId!),
    enabled: !!tenantId,
  })
}

export function useUpdateReceiptSettingsMutation(
  tenantId: string | undefined,
  messages: { saved: string; failed: string }
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: ReceiptSettings) =>
      updateReceiptSettingsApi(tenantId!, settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        receiptSettingsKeys.detail(tenantId ?? ''),
        saved
      )
      toast.success(messages.saved)
    },
    onError: (error: Error) => {
      toast.error(messages.failed, { description: error.message })
    },
  })
}
