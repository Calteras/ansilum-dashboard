export type OutletStatus = 'active' | 'inactive'

export interface Outlet {
  id: string
  tenantId: string
  name: string
  code: string
  address?: string
  phone?: string
  /** WGS84; both set or both null. */
  latitude?: number | null
  longitude?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOutletRequest {
  name: string
  code: string
  address?: string
  phone?: string
  latitude?: number
  longitude?: number
}

export interface UpdateOutletRequest {
  name?: string
  code?: string
  address?: string
  phone?: string
  /** Null clears the position; send both or neither. */
  latitude?: number | null
  longitude?: number | null
  isActive?: boolean
}

export interface OutletsResponse {
  data: Outlet[]
  total: number
  page: number
  pageSize: number
}

export interface OutletListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: OutletStatus[]
}
