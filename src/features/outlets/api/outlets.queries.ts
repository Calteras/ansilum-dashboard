import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { subscriptionKeys } from '@/features/settings/subscription/subscription.queries'
import {
  listOutletsApi,
  getOutletApi,
  createOutletApi,
  updateOutletApi,
  deleteOutletApi,
} from './outlets.api'
import type {
  CreateOutletRequest,
  UpdateOutletRequest,
  OutletListParams,
} from './outlets.types'

export const outletKeys = {
  all: ['outlets'] as const,
  lists: () => [...outletKeys.all, 'list'] as const,
  list: (params: OutletListParams) => [...outletKeys.lists(), params] as const,
  details: () => [...outletKeys.all, 'detail'] as const,
  detail: (id: string) => [...outletKeys.details(), id] as const,
}

/**
 * Query hook to list outlets
 */
export function useOutletsQuery(params: OutletListParams = {}) {
  return useQuery({
    queryKey: outletKeys.list(params),
    queryFn: () => listOutletsApi(params),
  })
}

/**
 * Query hook to get a single outlet
 */
export function useOutletQuery(id: string) {
  return useQuery({
    queryKey: outletKeys.detail(id),
    queryFn: () => getOutletApi(id),
    enabled: !!id,
  })
}

/**
 * Mutation hook to create an outlet
 */
export function useCreateOutletMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOutletRequest) => createOutletApi(data),
    onSuccess: (outlet) => {
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() })
      toast.success('Outlet created', {
        description: `${outlet.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create outlet', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to update an outlet
 */
export function useUpdateOutletMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOutletRequest }) =>
      updateOutletApi(id, data),
    onSuccess: (outlet) => {
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() })
      queryClient.invalidateQueries({ queryKey: outletKeys.detail(outlet.id) })
      toast.success('Outlet updated', {
        description: `${outlet.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update outlet', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to delete an outlet
 */
export function useDeleteOutletMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteOutletApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() })
      toast.success('Outlet deleted', {
        description: 'The outlet has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete outlet', {
        description: error.message,
      })
    },
  })
}
