import { createFileRoute } from '@tanstack/react-router'
import { TransactionsReport } from '@/features/transactions'

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: TransactionsReport,
})
