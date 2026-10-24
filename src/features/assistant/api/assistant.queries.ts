import { useQuery } from '@tanstack/react-query'
import { getActiveTenantId } from '@/lib/tenant-api-client'
import { getAssistantUsageApi } from './assistant.api'

export const assistantKeys = {
  all: ['assistant'] as const,
  usage: (tenantId: string | null) =>
    [...assistantKeys.all, 'usage', tenantId] as const,
}

/** AI units left for the active business's subscription account this period. */
export function useAssistantUsageQuery() {
  const tenantId = getActiveTenantId()
  return useQuery({
    queryKey: assistantKeys.usage(tenantId),
    queryFn: getAssistantUsageApi,
    enabled: !!tenantId,
    staleTime: 30_000,
  })
}
