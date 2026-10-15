import { deleteImage, unwrapEntity, uploadImage } from '@/lib/image-upload'
import {
  tenantGet,
  tenantPost,
  tenantPut,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  OutletRef,
  Product,
  ProductsResponse,
  CreateProductRequest,
  UpdateProductRequest,
  SetProductOutletsRequest,
  ProductListParams,
} from './products.types'

function buildQueryString(params: ProductListParams): string {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.categoryId) searchParams.set('categoryId', params.categoryId)
  if (params.productType?.length)
    searchParams.set('productType', params.productType.join(','))
  if (params.includeInactive) searchParams.set('includeInactive', 'true')
  if (params.outletId) searchParams.set('outletId', params.outletId)
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function listProductsApi(
  params: ProductListParams = {}
): Promise<ProductsResponse> {
  const query = buildQueryString(params)
  return tenantGet<ProductsResponse>(`${tenantApiPaths.products.list}${query}`)
}

export async function getProductApi(id: string): Promise<Product> {
  return tenantGet<Product>(tenantApiPaths.products.get(id))
}

export async function createProductApi(
  data: CreateProductRequest
): Promise<Product> {
  const { photo, ...productData } = data
  const path = tenantApiPaths.products.create
  // The photo is stored before the product row is written, so a failed upload
  // creates nothing and the request can simply be retried.
  if (photo) {
    return uploadImage<Product>(path, 'photo', photo, {
      method: 'POST',
      data: productData,
    })
  }
  return unwrapEntity<Product>(path, await tenantPost(path, productData))
}

export async function updateProductApi(
  id: string,
  data: UpdateProductRequest
): Promise<Product> {
  return tenantPut<Product>(tenantApiPaths.products.update(id), data)
}

export async function softDeleteProductApi(id: string): Promise<Product> {
  return tenantDelete<Product>(tenantApiPaths.products.softDelete(id))
}

export async function deleteProductApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.products.delete(id))
}

export async function uploadProductPhotoApi(
  id: string,
  photo: File
): Promise<Product> {
  return uploadImage<Product>(tenantApiPaths.products.uploadPhoto(id), 'photo', photo)
}

export async function deleteProductPhotoApi(id: string): Promise<Product> {
  return deleteImage<Product>(tenantApiPaths.products.deletePhoto(id))
}

export async function getProductOutletsApi(id: string): Promise<OutletRef[]> {
  const res = await tenantGet<{ data: OutletRef[] }>(
    tenantApiPaths.products.getOutlets(id)
  )
  return res.data
}

export async function setProductOutletsApi(
  id: string,
  data: SetProductOutletsRequest
): Promise<OutletRef[]> {
  const res = await tenantPut<{ data: OutletRef[] }>(
    tenantApiPaths.products.setOutlets(id),
    data
  )
  return res.data
}
