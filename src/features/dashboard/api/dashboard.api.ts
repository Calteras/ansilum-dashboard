import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  Transaction,
  OutletsResponse,
  TransactionSummaryResponse,
  TransactionsListResponse,
  StockMovementsResponse,
  StockMovementListParams,
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

interface PageWalk {
  pageSize?: number
  maxRows?: number
}

/**
 * Walks every page of a newest-first list. `maxRows` caps the walk, so a capped
 * result is missing the oldest rows, never the latest.
 */
async function walkPages<T>(
  fetchPage: (
    offset: number,
    limit: number
  ) => Promise<{ data: T[]; meta?: { total: number } }>,
  { pageSize = 500, maxRows = Number.POSITIVE_INFINITY }: PageWalk
): Promise<{ data: T[]; total: number }> {
  const data: T[] = []
  let total = Number.POSITIVE_INFINITY
  while (data.length < total && data.length < maxRows) {
    const page = await fetchPage(
      data.length,
      Math.min(pageSize, maxRows - data.length)
    )
    data.push(...page.data)
    total = page.meta?.total ?? data.length
    if (page.data.length === 0) break
  }
  return { data, total: Number.isFinite(total) ? total : data.length }
}

export function listAllTransactionsApi(
  params: Omit<TransactionListParams, 'offset' | 'limit'>,
  walk: PageWalk = {}
): Promise<{ data: Transaction[]; total: number }> {
  return walkPages(
    (offset, limit) => listTransactionsApi({ ...params, offset, limit }),
    walk
  )
}

export async function listStockMovementsApi(
  params: StockMovementListParams = {}
): Promise<StockMovementsResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '')
      searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return tenantGet<StockMovementsResponse>(
    `${tenantApiPaths.stockMovements.list}${query ? `?${query}` : ''}`
  )
}

/** Every movement in the range, filtered by the server rather than the latest page. */
export function listAllStockMovementsApi(
  params: Omit<StockMovementListParams, 'offset' | 'limit'>,
  walk: PageWalk = {}
) {
  return walkPages(
    (offset, limit) => listStockMovementsApi({ ...params, offset, limit }),
    walk
  )
}
