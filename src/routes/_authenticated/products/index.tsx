import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/products'

const productsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  productType: z
    .array(
      z.union([
        z.literal('READY'),
        z.literal('COMPOSED'),
        z.literal('PACKAGE'),
        z.literal('SERVICE'),
      ])
    )
    .optional()
    .catch([]),
  search: z.string().optional().catch(''),
  includeInactive: z.boolean().optional().catch(false),
})

export const Route = createFileRoute('/_authenticated/products/')({
  validateSearch: productsSearchSchema,
  component: Products,
})
