export type IngredientStatus = 'active' | 'inactive'

export interface Ingredient {
  id: string
  tenantId: string
  code: string
  name: string
  description?: string | null
  unit: string
  costPerUnit: number | string
  minimumStock: number | string
  currentStock: number | string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    recipes: number
    stockMovements: number
  }
}

export interface CreateIngredientRequest {
  code: string
  name: string
  description?: string
  unit: string
  costPerUnit: number
  minimumStock: number
  currentStock: number
}

export interface UpdateIngredientRequest {
  code?: string
  name?: string
  description?: string
  unit?: string
  costPerUnit?: number
  minimumStock?: number
  currentStock?: number
  isActive?: boolean
}

export interface IngredientsResponse {
  data: Ingredient[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

export interface IngredientListParams {
  page?: number
  pageSize?: number
  name?: string
  status?: IngredientStatus[]
}

// ── Outlet Inventory (per-outlet stock snapshot) ──────────────────────────

export interface OutletInventoryIngredient {
  id: string
  code: string
  name: string
  unit: string
  minimumStock: string
  isActive: boolean
}

export interface OutletInventory {
  id: string
  outletId: string
  ingredientId: string
  quantityOnHand: string
  avgCostPerUnit: string
  reorderPoint: string
  lastMovementAt: string
  createdAt: string
  updatedAt: string
  ingredient: OutletInventoryIngredient
}

export interface OutletInventoryResponse {
  data: OutletInventory[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

// ── Low Stock (flat structure returned by /low-stock endpoint) ────────────

export interface LowStockItem {
  id: string
  outletId: string
  ingredientId: string
  quantityOnHand: string
  avgCostPerUnit: string
  reorderPoint: string
  lastMovementAt: string
  createdAt: string
  updatedAt: string
  /** Flat fields (not nested under ingredient) */
  code: string
  name: string
  unit: string
}

export interface LowStockResponse {
  data: LowStockItem[]
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

// ── Stock Value ───────────────────────────────────────────────────────────

export interface StockValueItem {
  id: string
  code: string
  name: string
  unit: string
  quantityOnHand: string
  avgCostPerUnit: string
  totalValue: number
}

export interface StockValueData {
  outletId: string
  items: StockValueItem[]
  totalValue: number
  itemCount: number
}

export interface StockValueResponse {
  data: StockValueData
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

// ── Cross-outlet ingredient view ──────────────────────────────────────────

export interface IngredientOutletEntry {
  id: string
  outletId: string
  ingredientId: string
  quantityOnHand: string
  avgCostPerUnit: string
  reorderPoint: string
  lastMovementAt: string
  createdAt: string
  updatedAt: string
  outlet: {
    id: string
    name: string
    code: string
  }
}

export interface IngredientOutletView {
  ingredient: {
    id: string
    code: string
    name: string
    unit: string
    currentStock: string
  }
  outlets: IngredientOutletEntry[]
}

export interface IngredientOutletResponse {
  data: IngredientOutletView
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}
