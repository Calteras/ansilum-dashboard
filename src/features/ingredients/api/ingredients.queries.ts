import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listIngredientsApi,
  getIngredientApi,
  createIngredientApi,
  updateIngredientApi,
  deleteIngredientApi,
  getOutletInventoryApi,
  getLowStockApi,
  getStockValueApi,
} from './ingredients.api'
import type {
  CreateIngredientRequest,
  UpdateIngredientRequest,
  IngredientListParams,
} from './ingredients.types'

export const ingredientKeys = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientKeys.all, 'list'] as const,
  list: (params: IngredientListParams) =>
    [...ingredientKeys.lists(), params] as const,
  details: () => [...ingredientKeys.all, 'detail'] as const,
  detail: (id: string) => [...ingredientKeys.details(), id] as const,
}

export function useIngredientsQuery(params: IngredientListParams = {}) {
  return useQuery({
    queryKey: ingredientKeys.list(params),
    queryFn: () => listIngredientsApi(params),
  })
}

export function useIngredientQuery(id: string) {
  return useQuery({
    queryKey: ingredientKeys.detail(id),
    queryFn: () => getIngredientApi(id),
    enabled: !!id,
  })
}

export function useCreateIngredientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIngredientRequest) => createIngredientApi(data),
    onSuccess: (ingredient) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() })
      toast.success('Ingredient created', {
        description: `${ingredient.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create ingredient', {
        description: error.message,
      })
    },
  })
}

export function useUpdateIngredientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateIngredientRequest
    }) => updateIngredientApi(id, data),
    onSuccess: (ingredient) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: ingredientKeys.detail(ingredient.id),
      })
      toast.success('Ingredient updated', {
        description: `${ingredient.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update ingredient', {
        description: error.message,
      })
    },
  })
}

export const outletInventoryKeys = {
  all: ['outlet-inventory'] as const,
  byOutlet: (outletId: string) =>
    [...outletInventoryKeys.all, outletId] as const,
  lowStock: (outletId: string) =>
    [...outletInventoryKeys.all, outletId, 'low-stock'] as const,
  stockValue: (outletId: string) =>
    [...outletInventoryKeys.all, outletId, 'stock-value'] as const,
}

export function useOutletInventoryQuery(outletId: string) {
  return useQuery({
    queryKey: outletInventoryKeys.byOutlet(outletId),
    queryFn: () => getOutletInventoryApi(outletId),
    enabled: !!outletId,
  })
}

/** Fetch low-stock + stock-value for ALL supplied outlet IDs in parallel. */
export function useAllOutletsDashboardQueries(outletIds: string[]) {
  const lowStockQueries = useQueries({
    queries: outletIds.map((id) => ({
      queryKey: outletInventoryKeys.lowStock(id),
      queryFn: () => getLowStockApi(id),
      enabled: outletIds.length > 0,
    })),
  })

  const stockValueQueries = useQueries({
    queries: outletIds.map((id) => ({
      queryKey: outletInventoryKeys.stockValue(id),
      queryFn: () => getStockValueApi(id),
      enabled: outletIds.length > 0,
    })),
  })

  const isLoading =
    lowStockQueries.some((q) => q.isLoading) ||
    stockValueQueries.some((q) => q.isLoading)

  return { lowStockQueries, stockValueQueries, isLoading }
}

export function useDeleteIngredientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIngredientApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() })
      toast.success('Ingredient deleted', {
        description: 'The ingredient has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete ingredient', {
        description: error.message,
      })
    },
  })
}
