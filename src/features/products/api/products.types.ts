export type ProductStatus = 'active' | 'inactive'

export type ProductType = 'READY' | 'COMPOSED' | 'PACKAGE' | 'SERVICE'

export type ProductScope = 'GLOBAL' | 'OUTLET_SPECIFIC'

export interface OutletRef {
  id: string
  name: string
  code: string
  isActive?: boolean
}

export interface ProductCategory {
  id: string
  name: string
  color: string
  sortOrder?: number
}

export interface ProductRecipe {
  id?: string
  ingredientId: string
  quantity: number | string
  unit: string
  notes?: string
  ingredient?: {
    id: string
    name: string
    unit: string
  }
}

export interface ProductVariant {
  id?: string
  name: string
  priceDelta: number
  sku?: string
  isActive?: boolean
  sortOrder: number
  recipes?: ProductRecipe[]
}

export interface ProductModifierGroup {
  /** Junction record id */
  id: string
  sortOrder?: number
  /** The actual modifier group (nested from API response) */
  modifierGroup: {
    id: string
    name: string
    isRequired: boolean
    minSelection: number
    maxSelection: number
  }
}

export interface ProductOutletVisibility {
  id?: string
  productId?: string
  outletId: string
  createdAt?: string
}

export interface Product {
  id: string
  tenantId: string
  sku: string
  name: string
  description?: string
  basePrice: number
  costPrice?: number
  productType: ProductType
  scope: ProductScope
  isActive: boolean
  imageUrl?: string
  sortOrder?: number
  version?: number
  category: ProductCategory
  variants: ProductVariant[]
  modifierGroups?: ProductModifierGroup[]
  recipes?: ProductRecipe[]
  outletVisibilities?: ProductOutletVisibility[]
  createdAt: string
  updatedAt: string
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateVariantRequest {
  name: string
  priceDelta: number
  sku?: string
  sortOrder: number
  recipes?: Omit<ProductRecipe, 'id' | 'ingredient'>[]
}

export interface CreateProductRequest {
  categoryId: string
  sku: string
  name: string
  description?: string
  basePrice: number
  costPrice?: number
  productType?: ProductType
  scope?: ProductScope
  outletIds?: string[]
  sortOrder?: number
  isActive?: boolean
  variants?: CreateVariantRequest[]
  modifierGroupIds?: string[]
  recipes?: Omit<ProductRecipe, 'id' | 'ingredient'>[]
  photo?: File
}

export interface UpdateProductRequest {
  categoryId?: string
  name?: string
  description?: string
  basePrice?: number
  costPrice?: number
  productType?: ProductType
  scope?: ProductScope
  outletIds?: string[]
  sortOrder?: number
  isActive?: boolean
  variants?: Omit<CreateVariantRequest, never>[]
  modifierGroupIds?: string[]
  recipes?: Omit<ProductRecipe, 'id' | 'ingredient'>[]
  photo?: File
}

export interface SetProductOutletsRequest {
  outletIds: string[]
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ProductsResponse {
  data: Product[]
  meta?: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ProductListParams {
  search?: string
  categoryId?: string
  productType?: ProductType[]
  includeInactive?: boolean
  outletId?: string
}
