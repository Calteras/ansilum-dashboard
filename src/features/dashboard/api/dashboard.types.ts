import type { StockMovement } from '../components/stock-movements/stock-movements-table'
import type { Transaction } from '../components/transactions/transactions-table'

export type { StockMovement, Transaction }

export interface Outlet {
  id: string
  name: string
  code: string
}

export interface OutletsResponse {
  data: Outlet[]
}

export interface TransactionSummary {
  totalTransactions: number
  totalSales: number
  totalDiscount: number
  totalTax: number
  netSales: number
  paymentBreakdown: Record<string, number>
}

export interface TransactionSummaryResponse {
  data: TransactionSummary
}

export interface TransactionsListResponse {
  data: Transaction[]
  meta: { total: number; limit: number; offset: number }
}

export interface StockMovementsResponse {
  data: StockMovement[]
  meta: { total: number; limit: number; offset: number }
}

export interface TransactionSummaryParams {
  startDate: string
  endDate: string
}

export interface TransactionListParams {
  outletId: string
  startDate: string
  endDate: string
  status?: string
  offset?: number
  limit?: number
}
