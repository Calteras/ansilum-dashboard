import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  PeriodCogsParams,
  ProductCostParams,
  MarginForecastParams,
  AddOverheadRequest,
} from './cogs.types'
import {
  calculatePeriodCogsApi,
  getProductCostApi,
  getMarginForecastApi,
  getProductOverheadApi,
  addProductOverheadApi,
  deleteOverheadApi,
} from './cogs.api'

export const cogsKeys = {
  all: ['cogs'] as const,
  periodReport: (params: PeriodCogsParams) =>
    [...cogsKeys.all, 'period', params] as const,
  productCost: (productId: string, params: ProductCostParams) =>
    [...cogsKeys.all, 'product-cost', productId, params] as const,
  marginForecast: (params: MarginForecastParams) =>
    [...cogsKeys.all, 'forecast', params] as const,
  overhead: (productId: string) =>
    [...cogsKeys.all, 'overhead', productId] as const,
}

export function useCalculatePeriodCogsMutation() {
  return useMutation({
    mutationFn: (params: PeriodCogsParams) => calculatePeriodCogsApi(params),
    onError: (error: Error) => {
      toast.error('Failed to calculate COGS', { description: error.message })
    },
  })
}

export function useProductCostQuery(
  productId: string,
  params: ProductCostParams
) {
  return useQuery({
    queryKey: cogsKeys.productCost(productId, params),
    queryFn: () => getProductCostApi(productId, params),
    enabled: !!productId && !!params.outletId,
  })
}

export function useMarginForecastQuery(params: MarginForecastParams) {
  return useQuery({
    queryKey: cogsKeys.marginForecast(params),
    queryFn: () => getMarginForecastApi(params),
    enabled: !!params.productId && !!params.outletId,
  })
}

export function useProductOverheadQuery(productId: string) {
  return useQuery({
    queryKey: cogsKeys.overhead(productId),
    queryFn: () => getProductOverheadApi(productId),
    enabled: !!productId,
  })
}

export function useAddOverheadMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddOverheadRequest) =>
      addProductOverheadApi(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cogsKeys.overhead(productId) })
      toast.success('Overhead cost added')
    },
    onError: (error: Error) => {
      toast.error('Failed to add overhead', { description: error.message })
    },
  })
}

export function useDeleteOverheadMutation(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (overheadId: string) => deleteOverheadApi(overheadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cogsKeys.overhead(productId) })
      toast.success('Overhead cost removed')
    },
    onError: (error: Error) => {
      toast.error('Failed to remove overhead', { description: error.message })
    },
  })
}
