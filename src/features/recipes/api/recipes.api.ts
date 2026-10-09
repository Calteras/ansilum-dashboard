import {
  tenantGet,
  tenantPost,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  ProductRecipeResponse,
  CreateRecipeRequest,
} from './recipes.types'

export async function getProductRecipeApi(
  productId: string
): Promise<ProductRecipeResponse> {
  return tenantGet<ProductRecipeResponse>(
    tenantApiPaths.recipes.getByProduct(productId)
  )
}

export async function createRecipeApi(
  data: CreateRecipeRequest
): Promise<ProductRecipeResponse> {
  return tenantPost<ProductRecipeResponse>(
    tenantApiPaths.recipes.create,
    data
  )
}
