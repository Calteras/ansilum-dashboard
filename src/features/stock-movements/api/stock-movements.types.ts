export type StockMovementType =
  | 'PURCHASE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'WASTE'
  | 'SALE'

export interface CreateStockMovementRequest {
  localUuid: string
  outletId: string
  ingredientId: string
  employeeId: string
  movementType: StockMovementType
  quantity: number
  unit: string
  costPerUnit?: number
  notes?: string
}

export interface StockMovementRecord {
  id: string
  localUuid: string
  outletId: string
  ingredientId: string
  employeeId: string
  movementType: StockMovementType
  quantity: string
  unit: string
  costPerUnit: string
  totalCost: string
  referenceType: string | null
  notes: string | null
  movementDate: string
  ingredient: { id: string; code: string; name: string; currentStock: string }
  employee: { id: string; name: string; employeeNo: string }
}
