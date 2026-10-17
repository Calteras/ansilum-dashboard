import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  listDashboardOutletsApi,
  getTransactionSummaryApi,
  listTransactionsApi,
  listAllTransactionsApi,
  listStockMovementsApi,
} from './dashboard.api'
import type {
  TransactionSummaryParams,
  TransactionListParams,
} from './dashboard.types'

type ClosedTransactionsParams = Pick<
  TransactionListParams,
  'outletId' | 'startDate' | 'endDate'
>

/** Upper bound for the trend chart's client-side aggregation. */
export const SALES_SERIES_ROW_LIMIT = 5000

export const dashboardKeys = {
  all: ['dashboard'] as const,
  outlets: () => [...dashboardKeys.all, 'outlets'] as const,
  transactionSummary: (outletId: string, params: TransactionSummaryParams) =>
    [...dashboardKeys.all, 'transaction-summary', outletId, params] as const,
  transactions: (params: TransactionListParams) =>
    [...dashboardKeys.all, 'transactions', params] as const,
  closedTransactions: (params: ClosedTransactionsParams) =>
    [...dashboardKeys.all, 'closed-transactions', params] as const,
  stockMovements: () => [...dashboardKeys.all, 'stock-movements'] as const,
}

export function useDashboardOutletsQuery() {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: dashboardKeys.outlets(),
    queryFn: listDashboardOutletsApi,
    enabled: !!activeTenant,
  })
}

export function useTransactionSummaryQuery(
  outletId: string,
  params: TransactionSummaryParams
) {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: dashboardKeys.transactionSummary(outletId, params),
    queryFn: () => getTransactionSummaryApi(outletId, params),
    enabled:
      !!activeTenant && !!outletId && !!params.startDate && !!params.endDate,
    placeholderData: keepPreviousData,
  })
}

/**
 * Every CLOSED transaction in the range, the same set the summary endpoint
 * counts, so the trend chart reconciles with the headline totals.
 */
export function useClosedTransactionsQuery(
  params: ClosedTransactionsParams,
  enabled = true
) {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: dashboardKeys.closedTransactions(params),
    queryFn: () =>
      listAllTransactionsApi(
        { ...params, status: 'CLOSED' },
        { maxRows: SALES_SERIES_ROW_LIMIT }
      ),
    enabled:
      enabled &&
      !!activeTenant &&
      !!params.outletId &&
      !!params.startDate &&
      !!params.endDate,
    placeholderData: keepPreviousData,
  })
}

export function useTransactionsQuery(params: TransactionListParams) {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: dashboardKeys.transactions(params),
    queryFn: () => listTransactionsApi(params),
    enabled:
      !!activeTenant &&
      !!params.outletId &&
      !!params.startDate &&
      !!params.endDate,
  })
}

export function useStockMovementsQuery(enabled: boolean) {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: dashboardKeys.stockMovements(),
    queryFn: listStockMovementsApi,
    enabled: enabled && !!activeTenant,
  })
}
