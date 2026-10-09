import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  AnalyticsSummaryParams,
  AnalyticsSummaryResponse,
  AnalyticsStockParams,
  AnalyticsStockResponse,
} from './analytics.types'

export async function getAnalyticsSummaryApi(
  params: AnalyticsSummaryParams
): Promise<AnalyticsSummaryResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('startDate', params.startDate)
  searchParams.set('endDate', params.endDate)
  if (params.outletId) searchParams.set('outletId', params.outletId)
  return tenantGet<AnalyticsSummaryResponse>(
    `${tenantApiPaths.analytics.summary}?${searchParams.toString()}`
  )
}

export async function getAnalyticsStockApi(
  params: AnalyticsStockParams
): Promise<AnalyticsStockResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('startDate', params.startDate)
  searchParams.set('endDate', params.endDate)
  if (params.outletId) searchParams.set('outletId', params.outletId)
  return tenantGet<AnalyticsStockResponse>(
    `${tenantApiPaths.analytics.stock}?${searchParams.toString()}`
  )
}
