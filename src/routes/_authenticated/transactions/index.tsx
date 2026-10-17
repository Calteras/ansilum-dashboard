import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { TransactionsReport } from '@/features/transactions'

const transactionsSearchSchema = z.object({
  // Prefills the table search, e.g. a receipt number from global search.
  q: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/transactions/')({
  validateSearch: transactionsSearchSchema,
  component: TransactionsReport,
})
