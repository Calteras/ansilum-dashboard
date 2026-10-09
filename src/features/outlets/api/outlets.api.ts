import {
  tenantGet,
  tenantPost,
  tenantPatch,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  Outlet,
  OutletsResponse,
  CreateOutletRequest,
  UpdateOutletRequest,
  OutletListParams,
} from './outlets.types'

/**
 * Build query string from params
 */
function buildQueryString(params: OutletListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.search) searchParams.set('search', params.search)
  if (params.status?.length) searchParams.set('status', params.status.join(','))

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * List outlets with pagination and filters
 */
export async function listOutletsApi(
  params: OutletListParams = {}
): Promise<OutletsResponse> {
  const query = buildQueryString(params)
  return tenantGet<OutletsResponse>(`${tenantApiPaths.outlets.list}${query}`)
}

/**
 * Get a single outlet by ID
 */
export async function getOutletApi(id: string): Promise<Outlet> {
  return tenantGet<Outlet>(tenantApiPaths.outlets.get(id))
}

/**
 * Create a new outlet
 */
export async function createOutletApi(
  data: CreateOutletRequest
): Promise<Outlet> {
  return tenantPost<Outlet>(tenantApiPaths.outlets.create, data)
}

/**
 * Update an existing outlet
 */
export async function updateOutletApi(
  id: string,
  data: UpdateOutletRequest
): Promise<Outlet> {
  return tenantPatch<Outlet>(tenantApiPaths.outlets.update(id), data)
}

/**
 * Delete an outlet
 */
export async function deleteOutletApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.outlets.delete(id))
}
