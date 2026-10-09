import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Outlets } from '@/features/outlets'

const outletsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  // Per-column text filter
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/outlets/')({
  validateSearch: outletsSearchSchema,
  component: Outlets,
})
