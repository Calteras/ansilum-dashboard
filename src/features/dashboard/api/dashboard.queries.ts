import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import {
  listDashboardOutletsApi,
  getTransactionSummaryApi,
  listTransactionsApi,
  listStockMovementsApi,
} from './dashboard.api'
import type {
  TransactionSummaryParams,
  TransactionListParams,
} from './dashboard.types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  outlets: () => [...dashboardKeys.all, 'outlets'] as const,
  transactionSummary: (outletId: string, params: TransactionSummaryParams) =>
    [...dashboardKeys.all, 'transaction-summary', outletId, params] as const,
  transactions: (params: TransactionListParams) =>
    [...dashboardKeys.all, 'transactions', params] as const,
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
      !!activeTenant &&
      !!outletId &&
      !!params.startDate &&
      !!params.endDate,
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
