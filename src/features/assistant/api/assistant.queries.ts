import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { getActiveTenantId } from '@/lib/tenant-api-client'
import {
  deleteConversationApi,
  getAssistantUsageApi,
  listConversationsApi,
  renameConversationApi,
} from './assistant.api'

export const assistantKeys = {
  all: ['assistant'] as const,
  usage: (tenantId: string | null) =>
    [...assistantKeys.all, 'usage', tenantId] as const,
  conversations: (tenantId: string | null) =>
    [...assistantKeys.all, 'conversations', tenantId] as const,
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

/** The user's own conversations in the active business, newest first, page by page. */
export function useConversationsQuery() {
  const tenantId = getActiveTenantId()
  return useInfiniteQuery({
    queryKey: assistantKeys.conversations(tenantId),
    queryFn: ({ pageParam }) =>
      listConversationsApi({ limit: 30, before: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next_cursor,
    enabled: !!tenantId,
    staleTime: 15_000,
  })
}

export function useRenameConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameConversationApi(id, title),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...assistantKeys.all, 'conversations'],
      }),
  })
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConversationApi(id),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...assistantKeys.all, 'conversations'],
      }),
  })
}
