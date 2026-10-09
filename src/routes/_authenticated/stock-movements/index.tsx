import { createFileRoute } from '@tanstack/react-router'
import { StockMovementsReport } from '@/features/stock-movements'

export const Route = createFileRoute('/_authenticated/stock-movements/')({
  component: StockMovementsReport,
})
