import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createStockMovementApi } from './stock-movements.api'
import type { CreateStockMovementRequest } from './stock-movements.types'
import {
  ingredientKeys,
  outletInventoryKeys,
} from '@/features/ingredients/api/ingredients.queries'

export function useCreateStockMovementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStockMovementRequest) =>
      createStockMovementApi(data),
    onSuccess: (movement) => {
      // currentStock is denormalized — refetch ingredients list
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() })
      // Refetch outlet-specific inventory views
      queryClient.invalidateQueries({
        queryKey: outletInventoryKeys.byOutlet(movement.outletId),
      })
      queryClient.invalidateQueries({
        queryKey: outletInventoryKeys.stockValue(movement.outletId),
      })
      queryClient.invalidateQueries({
        queryKey: outletInventoryKeys.lowStock(movement.outletId),
      })
      // Refetch dashboard & report stock-movements lists
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stock-movements'],
      })

      const qty = Number(movement.quantity).toLocaleString()
      toast.success('Stock movement recorded', {
        description: `${movement.movementType} · ${qty} ${movement.unit} of ${movement.ingredient.name}`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to record stock movement', {
        description: error.message,
      })
    },
  })
}
