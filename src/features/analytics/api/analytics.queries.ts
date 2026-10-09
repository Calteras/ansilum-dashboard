import { useQuery } from '@tanstack/react-query'
import { getAnalyticsSummaryApi, getAnalyticsStockApi } from './analytics.api'
import type { AnalyticsSummaryParams, AnalyticsStockParams } from './analytics.types'

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (params: AnalyticsSummaryParams) =>
    [...analyticsKeys.all, 'summary', params] as const,
  stock: (params: AnalyticsStockParams) =>
    [...analyticsKeys.all, 'stock', params] as const,
}

export function useAnalyticsSummaryQuery(params: AnalyticsSummaryParams) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => getAnalyticsSummaryApi(params),
    enabled: !!params.startDate && !!params.endDate,
  })
}

export function useAnalyticsStockQuery(params: AnalyticsStockParams) {
  return useQuery({
    queryKey: analyticsKeys.stock(params),
    queryFn: () => getAnalyticsStockApi(params),
    enabled: !!params.startDate && !!params.endDate,
  })
}
