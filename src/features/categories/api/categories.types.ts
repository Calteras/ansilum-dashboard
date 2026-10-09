export type CategoryStatus = 'active' | 'inactive'

export interface Category {
  id: string
  tenantId: string
  name: string
  description?: string | null
  sortOrder: number
  color: string
  icon?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  sortOrder?: number
  color: string
  icon?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  sortOrder?: number
  color?: string
  icon?: string
  isActive?: boolean
}

export interface CategoriesResponse {
  data: Category[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

export interface CategoryListParams {
  page?: number
  pageSize?: number
  name?: string
  status?: CategoryStatus[]
}
