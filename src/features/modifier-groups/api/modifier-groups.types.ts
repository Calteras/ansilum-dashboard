export type ModifierGroupStatus = 'active' | 'inactive'

export interface Modifier {
  id?: string
  modifierGroupId?: string
  name: string
  priceAdjustment: number | string
  isDefault?: boolean
  isActive?: boolean
  sortOrder: number
}

export interface ModifierGroup {
  id: string
  tenantId: string
  name: string
  description?: string | null
  isRequired: boolean
  minSelection: number
  maxSelection: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  modifiers: Modifier[]
  _count?: {
    productModifiers: number
  }
}

export interface CreateModifierGroupRequest {
  name: string
  description?: string
  isRequired?: boolean
  minSelection?: number
  maxSelection?: number
  modifiers?: Omit<
    Modifier,
    'id' | 'modifierGroupId' | 'isDefault' | 'isActive'
  >[]
}

export interface UpdateModifierGroupRequest {
  name?: string
  description?: string
  isRequired?: boolean
  minSelection?: number
  maxSelection?: number
  isActive?: boolean
  modifiers?: Omit<Modifier, 'modifierGroupId' | 'isDefault' | 'isActive'>[]
}

export interface ModifierGroupsResponse {
  data: ModifierGroup[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

export interface ModifierGroupListParams {
  page?: number
  pageSize?: number
  name?: string
  status?: ModifierGroupStatus[]
}
