export interface CreateTenantRequest {
  name: string
  slug: string
  logo?: string
  metadata?: Record<string, unknown>
}

export interface UpdateTenantRequest {
  name?: string
  logo?: string
  metadata?: Record<string, unknown>
}
