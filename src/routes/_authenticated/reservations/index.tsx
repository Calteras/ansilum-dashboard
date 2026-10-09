import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Reservations } from '@/features/reservations'

const reservationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(
      z.union([
        z.literal('RESERVED'),
        z.literal('OPEN'),
        z.literal('CLOSED'),
        z.literal('VOIDED'),
      ])
    )
    .optional()
    .catch([]),
  customerName: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/reservations/')({
  validateSearch: reservationsSearchSchema,
  component: Reservations,
})
