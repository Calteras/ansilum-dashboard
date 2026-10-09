import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getProductRecipeApi, createRecipeApi } from './recipes.api'
import type { CreateRecipeRequest } from './recipes.types'

export const recipeKeys = {
  all: ['recipes'] as const,
  byProduct: (productId: string) =>
    [...recipeKeys.all, 'product', productId] as const,
}

export function useProductRecipeQuery(productId: string) {
  return useQuery({
    queryKey: recipeKeys.byProduct(productId),
    queryFn: () => getProductRecipeApi(productId),
    enabled: !!productId,
  })
}

export function useSaveRecipeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRecipeRequest) => createRecipeApi(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.byProduct(variables.productId),
      })
      toast.success('Recipe saved', {
        description: 'The recipe has been updated successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to save recipe', {
        description: error.message,
      })
    },
  })
}
