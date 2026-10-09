// ─── Period COGS ─────────────────────────────────────────────────────────────

export interface PeriodCogsParams {
  startDate: string
  endDate: string
  outletId?: string
  productIds?: string[]
}

export interface ByProductCogs {
  productId: string
  productName: string
  quantitySold: number
  cogs: number
  revenue: number
  grossMargin: number
  grossMarginPct: number
}

export interface PeriodCogsData {
  outletId: string | null
  periodStart: string
  periodEnd: string
  beginningInventoryValue: number
  purchasesValue: number
  endingInventoryValue: number
  materialCogs: number
  directMethodCogs: number
  byProduct: ByProductCogs[]
}

export interface PeriodCogsResponse {
  message: string
  code: number
  data: PeriodCogsData
}

// ─── Product Unit Cost ────────────────────────────────────────────────────────

export interface ProductCostParams {
  outletId: string
  quantity?: number
}

export interface CostBreakdownItem {
  ingredientId: string
  ingredientName: string
  quantityUsed: number
  unitCost: number
  lineCost: number
  costingMethod: 'WEIGHTED_AVERAGE' | 'FIFO' | 'LIFO'
}

export interface ProductCostData {
  productId: string
  productName: string
  basePrice: number
  quantityEstimated: number
  materialCost: number
  overheadCost: number
  totalUnitCost: number
  totalCogs: number
  grossMargin: number
  grossMarginPct: number
  breakdown: CostBreakdownItem[]
}

export interface ProductCostResponse {
  message: string
  code: number
  data: ProductCostData
}

// ─── Margin Forecast ──────────────────────────────────────────────────────────

export interface MarginForecastParams {
  productId: string
  outletId: string
  simulatedMaterialIncreasePct: number
}

export interface IngredientForecast {
  ingredientId: string
  ingredientName: string
  currentCost: number
  simulatedCost: number
}

export interface MarginForecastData {
  productId: string
  productName: string
  basePrice: number
  simulatedMaterialIncreasePct: number
  currentUnitCost: number
  simulatedUnitCost: number
  currentGrossProfit: number
  simulatedGrossProfit: number
  currentMarginPct: number
  simulatedMarginPct: number
  ingredientBreakdown: IngredientForecast[]
}

export interface MarginForecastResponse {
  message: string
  code: number
  data: MarginForecastData
}

// ─── Overhead Costs ───────────────────────────────────────────────────────────

export type OverheadCostType = 'LABOR' | 'MACHINE_RUNTIME' | 'RENT' | 'OTHER'

export interface OverheadCost {
  id: string
  productId: string
  tenantId: string
  name: string
  costType: OverheadCostType
  ratePerHour: string
  hoursRequired: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OverheadListResponse {
  message: string
  code: number
  data: OverheadCost[]
}

export interface AddOverheadRequest {
  name: string
  costType: OverheadCostType
  ratePerHour: string
  hoursRequired: string
}

export interface AddOverheadResponse {
  message: string
  code: number
  data: OverheadCost
}
