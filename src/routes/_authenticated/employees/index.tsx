import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Employees } from '@/features/employees'

const employeesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Facet filters
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  role: z
    .array(z.union([
      z.literal('OWNER'),
      z.literal('ADMIN'),
      z.literal('MANAGER'),
      z.literal('SUPERVISOR'),
      z.literal('CASHIER'),
      z.literal('BARISTA'),
      z.literal('KITCHEN'),
    ]))
    .optional()
    .catch([]),
  // Per-column text filter
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/employees/')({
  validateSearch: employeesSearchSchema,
  component: Employees,
})
