import { tenantPost, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  CreateStockMovementRequest,
  StockMovementRecord,
} from './stock-movements.types'

interface StockMovementApiResponse {
  data: StockMovementRecord
}

export async function createStockMovementApi(
  data: CreateStockMovementRequest
): Promise<StockMovementRecord> {
  const response = await tenantPost<StockMovementApiResponse>(
    tenantApiPaths.stockMovements.create,
    data
  )
  return response.data
}
