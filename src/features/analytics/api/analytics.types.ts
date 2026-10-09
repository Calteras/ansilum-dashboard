export interface AnalyticsSummaryKpis {
  totalRevenue: number
  totalCOGS: number
  grossProfit: number
  profitMargin: number
  itemsSold: number
  totalTransactions: number
  repeatRate: number
  repeatCustomers: number
  totalUniqueCustomers: number
  pendingOrders: number
  lowStockAlerts: number
}

export interface AnalyticsTopProduct {
  productId: string
  name: string
  revenue: number
  quantity: number
}

export interface AnalyticsPeakHour {
  hour: number
  orderCount: number
}

export interface AnalyticsSummaryData {
  period: {
    startDate: string
    endDate: string
  }
  outletId: string | null
  kpis: AnalyticsSummaryKpis
  topProducts: AnalyticsTopProduct[]
  peakHours: AnalyticsPeakHour[]
  lowStockDetails: unknown[]
}

export interface AnalyticsSummaryResponse {
  data: AnalyticsSummaryData
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}

export interface AnalyticsSummaryParams {
  startDate: string
  endDate: string
  outletId?: string
}

// ─── Stock Analytics ──────────────────────────────────────────────────────────

export interface AnalyticsStockKpis {
  stockValuation: number
  cogsThisPeriod: number
  cogsVsLastPeriod: number | null
  wacIngredients: number
  transfersActive: number
  transfersByStatus: {
    PENDING: number
    APPROVED: number
    IN_TRANSIT: number
    COMPLETED: number
  }
  belowReorder: number
  belowReorderCritical: number
  belowReorderWarning: number
}

export interface AnalyticsStockCostItem {
  ingredientId: string
  name: string
  code: string
  unit: string
  totalCost: number
  pct: number
}

export interface AnalyticsIngredientDayEntry {
  ingredientId: string
  name: string
  quantity: number
}

export interface AnalyticsIngredientUsageByDay {
  day: string
  dayIndex: number
  ingredients: AnalyticsIngredientDayEntry[]
}

export interface AnalyticsTopConsumed {
  rank: number
  ingredientId: string
  name: string
  code: string
  unit: string
  totalQuantity: number
  totalCOGS: number
  trendPct: number | null
}

export interface AnalyticsMovementBreakdown {
  type: string
  count: number
  totalQuantity: number
}

export interface AnalyticsPerOutletInventory {
  outletId: string
  outletCode: string
  outletName: string
  itemCount: number
  totalValue: number
  utilizationPct: number
}

export interface AnalyticsTransferEntry {
  id: string
  [key: string]: unknown
}

export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED'

export interface AnalyticsTransferPipeline {
  PENDING: { count: number; transfers: AnalyticsTransferEntry[] }
  APPROVED: { count: number; transfers: AnalyticsTransferEntry[] }
  IN_TRANSIT: { count: number; transfers: AnalyticsTransferEntry[] }
  COMPLETED: { count: number; transfers: AnalyticsTransferEntry[] }
}

export interface AnalyticsStockData {
  period: { startDate: string; endDate: string }
  outletId: string | null
  kpis: AnalyticsStockKpis
  costBreakdown: {
    totalCost: number
    items: AnalyticsStockCostItem[]
  }
  ingredientUsageByDay: AnalyticsIngredientUsageByDay[]
  topConsumed: AnalyticsTopConsumed[]
  movementBreakdown: AnalyticsMovementBreakdown[]
  lowStockAlerts: {
    critical: number
    warning: number
    items: unknown[]
  }
  perOutletInventory: AnalyticsPerOutletInventory[]
  transferPipeline: AnalyticsTransferPipeline
}

export interface AnalyticsStockResponse {
  data: AnalyticsStockData
  meta: { page: number; size: number; totalData: number; totalPages: number }
}

export interface AnalyticsStockParams {
  startDate: string
  endDate: string
  outletId?: string
}
