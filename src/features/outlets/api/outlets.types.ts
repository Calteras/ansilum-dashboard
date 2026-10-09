export type OutletStatus = 'active' | 'inactive'

export interface Outlet {
  id: string
  tenantId: string
  name: string
  code: string
  address?: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOutletRequest {
  name: string
  code: string
  address?: string
  phone?: string
}

export interface UpdateOutletRequest {
  name?: string
  code?: string
  address?: string
  phone?: string
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
