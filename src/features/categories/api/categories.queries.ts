import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listCategoriesApi,
  getCategoryApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from './categories.api'
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryListParams,
} from './categories.types'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

export function useCategoriesQuery(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => listCategoriesApi(params),
  })
}

export function useCategoryQuery(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryApi(id),
    enabled: !!id,
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategoryApi(data),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Category created', {
        description: `${category.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', {
        description: error.message,
      })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategoryApi(id, data),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(category.id),
      })
      toast.success('Category updated', {
        description: `${category.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', {
        description: error.message,
      })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategoryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Category deleted', {
        description: 'The category has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', {
        description: error.message,
      })
    },
  })
}
