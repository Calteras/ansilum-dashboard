import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listProductsApi,
  getProductApi,
  createProductApi,
  updateProductApi,
  softDeleteProductApi,
  deleteProductApi,
  uploadProductPhotoApi,
  deleteProductPhotoApi,
  getProductOutletsApi,
  setProductOutletsApi,
} from './products.api'
import type {
  CreateProductRequest,
  UpdateProductRequest,
  SetProductOutletsRequest,
  ProductListParams,
} from './products.types'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  outlets: (id: string) => [...productKeys.all, 'outlets', id] as const,
}

export function useProductsQuery(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProductsApi(params),
  })
}

export function useProductQuery(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductApi(id),
    enabled: !!id,
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProductApi(data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product created', {
        description: `${product.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create product', { description: error.message })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      updateProductApi(id, data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.id),
      })
      toast.success('Product updated', {
        description: `${product.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update product', { description: error.message })
    },
  })
}

export function useSoftDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeleteProductApi(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product deactivated', {
        description: `${product.name} has been deactivated.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to deactivate product', {
        description: error.message,
      })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product deleted', {
        description: 'The product has been permanently removed.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete product', { description: error.message })
    },
  })
}

export function useUploadProductPhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, photo }: { id: string; photo: File }) =>
      uploadProductPhotoApi(id, photo),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.id),
      })
      toast.success('Photo updated', {
        description: `${product.name} photo has been updated.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to upload photo', { description: error.message })
    },
  })
}

export function useDeleteProductPhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProductPhotoApi(id),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.id),
      })
      toast.success('Photo removed', {
        description: `${product.name} photo has been removed.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to remove photo', { description: error.message })
    },
  })
}

export function useProductOutletsQuery(id: string) {
  return useQuery({
    queryKey: productKeys.outlets(id),
    queryFn: () => getProductOutletsApi(id),
    enabled: !!id,
  })
}

export function useSetProductOutletsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetProductOutletsRequest }) =>
      setProductOutletsApi(id, data),
    onSuccess: (_outlets, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.outlets(id) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      toast.success('Outlet assignments updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to update outlet assignments', {
        description: error.message,
      })
    },
  })
}
