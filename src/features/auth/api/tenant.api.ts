import { API_BASE_URL } from '@/config/api.config'
import { deleteImage, uploadImage } from '@/lib/image-upload'
import type { Tenant, TenantMembership } from './auth.types'

/**
 * Helper for API requests with credentials (cookies)
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }

  return data
}

/**
 * Raw tenant item from the API (no response wrapper for auth routes)
 */
interface TenantApiItem {
  id: string
  name: string
  slug: string
  code: string
  logo: string | null
  metadata: Record<string, unknown>
  businessType?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  memberSince: string
}

/**
 * List all tenants the current user has access to
 */
export async function listTenantsApi(): Promise<TenantMembership[]> {
  const result = await authFetch<TenantApiItem[]>('/auth/tenants', {
    method: 'GET',
  })

  const items = Array.isArray(result) ? result : (result as any).data ?? []

  return items.map((item: TenantApiItem) => ({
    id: item.id,
    tenant: {
      id: item.id,
      name: item.name,
      slug: item.slug,
      code: item.code,
      logo: item.logo || undefined,
      isActive: item.isActive,
      createdAt: item.createdAt,
    },
    role: item.role,
    memberSince: item.memberSince,
  }))
}

/**
 * Create a new tenant
 */
export async function createTenantApi(data: {
  name: string
  slug: string
  logo?: string
  metadata?: Record<string, unknown>
}): Promise<Tenant> {
  const result = await authFetch<any>('/auth/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  const item = result.data ?? result

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    code: item.code,
    logo: item.logo || undefined,
    isActive: item.isActive,
    createdAt: item.createdAt,
  }
}

/**
 * Set the active tenant for the current session
 */
export async function setActiveTenantApi(
  tenantId: string
): Promise<{ activeTenantId: string; tenant: Tenant }> {
  const result = await authFetch<any>('/auth/tenants/active', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  })

  const item = result.data ?? result

  return {
    activeTenantId: item.activeTenantId,
    tenant: {
      id: item.tenant.id,
      name: item.tenant.name,
      slug: item.tenant.slug,
      code: item.tenant.code,
      logo: item.tenant.logo || undefined,
      isActive: item.tenant.isActive,
      createdAt: item.tenant.createdAt,
    },
  }
}

/**
 * Get the active tenant for the current session
 */
export async function getActiveTenantApi(): Promise<Tenant | null> {
  try {
    const result = await authFetch<any>('/auth/tenants/active', {
      method: 'GET',
    })

    const item = result.data ?? result

    if (!item || !item.id) {
      return null
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      code: item.code,
      logo: item.logo || undefined,
      isActive: item.isActive,
      createdAt: item.createdAt,
    }
  } catch {
    return null
  }
}

/**
 * Raw tenant row returned by the logo endpoints (unwrapped auth route)
 */
type TenantRow = Omit<TenantApiItem, 'role' | 'memberSince'>

function toTenant(item: TenantRow): Tenant {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    code: item.code,
    logo: item.logo || undefined,
    isActive: item.isActive,
    createdAt: item.createdAt,
  }
}

/**
 * Upload or replace a tenant's logo. Requires OWNER or ADMIN membership.
 */
export async function uploadTenantLogoApi(
  tenantId: string,
  file: File
): Promise<Tenant> {
  const row = await uploadImage<TenantRow>(
    `/auth/tenants/${tenantId}/logo`,
    'logo',
    file
  )
  return toTenant(row)
}

/**
 * Remove a tenant's logo. Requires OWNER or ADMIN membership.
 */
export async function deleteTenantLogoApi(tenantId: string): Promise<Tenant> {
  const row = await deleteImage<TenantRow>(`/auth/tenants/${tenantId}/logo`)
  return toTenant(row)
}
