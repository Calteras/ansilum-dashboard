import {
  tenantGet,
  tenantPost,
  tenantPatch,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  ModifierGroup,
  ModifierGroupsResponse,
  CreateModifierGroupRequest,
  UpdateModifierGroupRequest,
  ModifierGroupListParams,
} from './modifier-groups.types'

function buildQueryString(params: ModifierGroupListParams): string {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('size', String(params.pageSize))
  if (params.name) searchParams.set('name', params.name)
  if (params.status?.length) searchParams.set('status', params.status.join(','))
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function listModifierGroupsApi(
  params: ModifierGroupListParams = {}
): Promise<ModifierGroupsResponse> {
  const query = buildQueryString(params)
  return tenantGet<ModifierGroupsResponse>(
    `${tenantApiPaths.modifierGroups.list}${query}`
  )
}

export async function getModifierGroupApi(
  id: string
): Promise<ModifierGroup> {
  return tenantGet<ModifierGroup>(tenantApiPaths.modifierGroups.get(id))
}

export async function createModifierGroupApi(
  data: CreateModifierGroupRequest
): Promise<ModifierGroup> {
  return tenantPost<ModifierGroup>(
    tenantApiPaths.modifierGroups.create,
    data
  )
}

export async function updateModifierGroupApi(
  id: string,
  data: UpdateModifierGroupRequest
): Promise<ModifierGroup> {
  return tenantPatch<ModifierGroup>(
    tenantApiPaths.modifierGroups.update(id),
    data
  )
}

export async function deleteModifierGroupApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.modifierGroups.delete(id))
}
