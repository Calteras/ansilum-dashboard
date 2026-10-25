import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Customers } from '@/features/loyalty/customers'

const customersSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z.enum(['active', 'inactive', 'banned']).optional().catch(undefined),
  sort: z
    .enum(['newest', 'name', 'spent', 'points', 'visits', 'lastVisit'])
    .optional()
    .catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
  pageSize: z.number().int().min(1).max(50).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/customers/')({
  validateSearch: customersSearchSchema,
  component: Customers,
})
