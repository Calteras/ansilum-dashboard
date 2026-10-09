import {
  tenantGet,
  tenantPost,
  tenantPatch,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  Category,
  CategoriesResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryListParams,
} from './categories.types'

function buildQueryString(params: CategoryListParams): string {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('size', String(params.pageSize))
  if (params.name) searchParams.set('name', params.name)
  if (params.status?.length) searchParams.set('status', params.status.join(','))
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function listCategoriesApi(
  params: CategoryListParams = {}
): Promise<CategoriesResponse> {
  const query = buildQueryString(params)
  return tenantGet<CategoriesResponse>(
    `${tenantApiPaths.categories.list}${query}`
  )
}

export async function getCategoryApi(id: string): Promise<Category> {
  return tenantGet<Category>(tenantApiPaths.categories.get(id))
}

export async function createCategoryApi(
  data: CreateCategoryRequest
): Promise<Category> {
  return tenantPost<Category>(tenantApiPaths.categories.create, data)
}

export async function updateCategoryApi(
  id: string,
  data: UpdateCategoryRequest
): Promise<Category> {
  return tenantPatch<Category>(tenantApiPaths.categories.update(id), data)
}

export async function deleteCategoryApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.categories.delete(id))
}
