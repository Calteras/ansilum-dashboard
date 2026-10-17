import { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatSpan, toApiDateTime, type DateSpan } from '@/lib/date-range'
import { formatCompactMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import type {
  AnalyticsSummaryKpis,
  AnalyticsTopProduct,
} from '@/features/analytics/api/analytics.types'
import { listAllTransactionsApi } from '../api/dashboard.api'
import type { Outlet, TransactionSummary } from '../api/dashboard.types'
import { buildDashboardPdf } from '../utils/pdf-report'
import { buildTransactionsCsv, downloadFile } from '../utils/transactions-csv'

interface SalesExportScope {
  outlet: Outlet | undefined
  span: DateSpan
  /** The transactions table's status filter; exports list the same rows. */
  statusFilter: string
  summary: TransactionSummary | null
  analyticsKpis: AnalyticsSummaryKpis | null
  topProducts: AnalyticsTopProduct[]
}

export type ExportFormat = 'pdf' | 'csv'

export function useSalesExport(scope: SalesExportScope) {
  const { t } = useTranslation()
  const copy = useCopy()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const fetchTransactions = async () => {
    const { data } = await listAllTransactionsApi({
      outletId: scope.outlet!.id,
      startDate: toApiDateTime(scope.span.from),
      endDate: toApiDateTime(scope.span.to),
      status: scope.statusFilter !== 'all' ? scope.statusFilter : undefined,
    })
    return data
  }

  const exportPdf = async () => {
    const statusLabels: Record<string, string> = {
      all: t('dashboard.transactionsTable.allStatus'),
      OPEN: t('dashboard.transactionsTable.statusOpen'),
      PENDING: t('dashboard.transactionsTable.statusPending'),
      CLOSED: t('dashboard.transactionsTable.statusClosed'),
      VOIDED: t('dashboard.transactionsTable.statusVoided'),
    }
    const kpis = scope.analyticsKpis
    const fmt = formatCompactMoney

    buildDashboardPdf({
      outletName: scope.outlet!.name,
      dateRangeLabel: formatSpan(scope.span),
      statusLabel: statusLabels[scope.statusFilter] ?? scope.statusFilter,
      summary: scope.summary,
      transactions: await fetchTransactions(),
      itemsCogs: kpis
        ? {
            totalRevenue: fmt(kpis.totalRevenue),
            transactions: `${kpis.totalTransactions} transactions`,
            grossProfit: fmt(kpis.grossProfit),
            cogs: fmt(kpis.totalCOGS),
            profitMargin: `${kpis.profitMargin.toFixed(1)}%`,
            profitMarginNote: 'of total revenue',
            itemsSold: `${kpis.itemsSold.toLocaleString('id-ID')} items`,
            ordersNote: `across ${kpis.totalTransactions} orders`,
            uniqueCustomers: kpis.totalUniqueCustomers.toLocaleString('id-ID'),
            returned: `${kpis.repeatCustomers.toLocaleString('id-ID')} returned`,
            repeatRate: `${kpis.repeatRate.toFixed(1)}%`,
            pendingOrders: `${kpis.pendingOrders} pending orders`,
            topProducts: scope.topProducts.map((p) => ({
              name: p.name,
              revenue: fmt(p.revenue),
              sold: `${p.quantity} sold`,
            })),
          }
        : undefined,
      generatedAt: new Date(),
    })
  }

  const exportCsv = async () => {
    const outlet = scope.outlet!
    const fileName = `transactions-${outlet.code || outlet.id}-${format(scope.span.from, 'yyyyMMdd')}-${format(scope.span.to, 'yyyyMMdd')}.csv`
    downloadFile(
      fileName,
      buildTransactionsCsv(await fetchTransactions()),
      'text/csv;charset=utf-8'
    )
  }

  const run = async (kind: ExportFormat) => {
    if (!scope.outlet || exporting) return
    setExporting(kind)
    try {
      await (kind === 'pdf' ? exportPdf() : exportCsv())
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to export ${kind}`, err)
      toast.error(
        copy('Ekspor gagal. Coba lagi.', 'Export failed. Please try again.')
      )
    } finally {
      setExporting(null)
    }
  }

  return { exporting, run, canExport: Boolean(scope.outlet) }
}
