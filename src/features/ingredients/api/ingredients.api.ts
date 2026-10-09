import {
  tenantGet,
  tenantPost,
  tenantPut,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  Ingredient,
  IngredientsResponse,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  IngredientListParams,
  OutletInventoryResponse,
  LowStockResponse,
  StockValueResponse,
  IngredientOutletResponse,
} from './ingredients.types'

function buildQueryString(params: IngredientListParams): string {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('size', String(params.pageSize))
  if (params.name) searchParams.set('name', params.name)
  if (params.status?.length) searchParams.set('status', params.status.join(','))
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function listIngredientsApi(
  params: IngredientListParams = {}
): Promise<IngredientsResponse> {
  const query = buildQueryString(params)
  return tenantGet<IngredientsResponse>(
    `${tenantApiPaths.ingredients.list}${query}`
  )
}

export async function getIngredientApi(id: string): Promise<Ingredient> {
  return tenantGet<Ingredient>(tenantApiPaths.ingredients.get(id))
}

export async function createIngredientApi(
  data: CreateIngredientRequest
): Promise<Ingredient> {
  return tenantPost<Ingredient>(tenantApiPaths.ingredients.create, data)
}

export async function updateIngredientApi(
  id: string,
  data: UpdateIngredientRequest
): Promise<Ingredient> {
  return tenantPut<Ingredient>(tenantApiPaths.ingredients.update(id), data)
}

export async function deleteIngredientApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.ingredients.delete(id))
}

export async function getOutletInventoryApi(
  outletId: string
): Promise<OutletInventoryResponse> {
  return tenantGet<OutletInventoryResponse>(
    tenantApiPaths.outletInventory.byOutlet(outletId)
  )
}

export async function getLowStockApi(outletId: string): Promise<LowStockResponse> {
  return tenantGet<LowStockResponse>(
    tenantApiPaths.outletInventory.lowStock(outletId)
  )
}

export async function getStockValueApi(outletId: string): Promise<StockValueResponse> {
  return tenantGet<StockValueResponse>(
    tenantApiPaths.outletInventory.stockValue(outletId)
  )
}

export async function getIngredientOutletViewApi(
  ingredientId: string
): Promise<IngredientOutletResponse> {
  return tenantGet<IngredientOutletResponse>(
    tenantApiPaths.outletInventory.byIngredient(ingredientId)
  )
}
