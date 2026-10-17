import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listModifierGroupsApi,
  getModifierGroupApi,
  createModifierGroupApi,
  updateModifierGroupApi,
  deleteModifierGroupApi,
} from './modifier-groups.api'
import type {
  CreateModifierGroupRequest,
  UpdateModifierGroupRequest,
  ModifierGroupListParams,
} from './modifier-groups.types'

export const modifierGroupKeys = {
  all: ['modifier-groups'] as const,
  lists: () => [...modifierGroupKeys.all, 'list'] as const,
  list: (params: ModifierGroupListParams) =>
    [...modifierGroupKeys.lists(), params] as const,
  details: () => [...modifierGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...modifierGroupKeys.details(), id] as const,
}

export function useModifierGroupsQuery(params: ModifierGroupListParams = {}) {
  return useQuery({
    queryKey: modifierGroupKeys.list(params),
    queryFn: () => listModifierGroupsApi(params),
  })
}

export function useModifierGroupQuery(id: string) {
  return useQuery({
    queryKey: modifierGroupKeys.detail(id),
    queryFn: () => getModifierGroupApi(id),
    enabled: !!id,
  })
}

export function useCreateModifierGroupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateModifierGroupRequest) =>
      createModifierGroupApi(data),
    onSuccess: (group) => {
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.lists(),
      })
      toast.success('Modifier group created', {
        description: `${group.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create modifier group', {
        description: error.message,
      })
    },
  })
}

export function useUpdateModifierGroupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateModifierGroupRequest
    }) => updateModifierGroupApi(id, data),
    onSuccess: (group) => {
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.detail(group.id),
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Modifier group updated', {
        description: `${group.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update modifier group', {
        description: error.message,
      })
    },
  })
}

export function useDeleteModifierGroupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteModifierGroupApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.lists(),
      })
      toast.success('Modifier group deleted', {
        description: 'The modifier group has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete modifier group', {
        description: error.message,
      })
    },
  })
}
