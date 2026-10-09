import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  OutletsResponse,
  TransactionSummaryResponse,
  TransactionsListResponse,
  StockMovementsResponse,
  TransactionSummaryParams,
  TransactionListParams,
} from './dashboard.types'

export async function listDashboardOutletsApi(): Promise<OutletsResponse> {
  return tenantGet<OutletsResponse>(tenantApiPaths.outlets.list)
}

export async function getTransactionSummaryApi(
  outletId: string,
  params: TransactionSummaryParams
): Promise<TransactionSummaryResponse> {
  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  })
  return tenantGet<TransactionSummaryResponse>(
    `${tenantApiPaths.transactions.summary(outletId)}?${searchParams}`
  )
}

export async function listTransactionsApi(
  params: TransactionListParams
): Promise<TransactionsListResponse> {
  const searchParams = new URLSearchParams({
    outletId: params.outletId,
    startDate: params.startDate,
    endDate: params.endDate,
  })
  if (params.status) {
    searchParams.set('status', params.status)
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset))
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }
  return tenantGet<TransactionsListResponse>(
    `${tenantApiPaths.transactions.list}?${searchParams}`
  )
}

export async function listStockMovementsApi(): Promise<StockMovementsResponse> {
  return tenantGet<StockMovementsResponse>(tenantApiPaths.stockMovements.list)
}
