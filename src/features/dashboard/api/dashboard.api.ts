import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  Transaction,
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

/**
 * Walks every page of the transactions list. `maxRows` caps the walk; the list is
 * newest-first, so a capped result is missing the oldest rows, never the latest.
 */
export async function listAllTransactionsApi(
  params: Omit<TransactionListParams, 'offset' | 'limit'>,
  { pageSize = 500, maxRows = Number.POSITIVE_INFINITY } = {}
): Promise<{ data: Transaction[]; total: number }> {
  const data: Transaction[] = []
  let total = Number.POSITIVE_INFINITY
  while (data.length < total && data.length < maxRows) {
    const page = await listTransactionsApi({
      ...params,
      offset: data.length,
      limit: Math.min(pageSize, maxRows - data.length),
    })
    data.push(...page.data)
    total = page.meta?.total ?? data.length
    if (page.data.length === 0) break
  }
  return { data, total: Number.isFinite(total) ? total : data.length }
}

export async function listStockMovementsApi(): Promise<StockMovementsResponse> {
  return tenantGet<StockMovementsResponse>(tenantApiPaths.stockMovements.list)
}
