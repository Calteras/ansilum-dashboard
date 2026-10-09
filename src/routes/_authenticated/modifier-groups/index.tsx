import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ModifierGroups } from '@/features/modifier-groups'

const modifierGroupsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.union([z.literal('active'), z.literal('inactive')]))
    .optional()
    .catch([]),
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/modifier-groups/')({
  validateSearch: modifierGroupsSearchSchema,
  component: ModifierGroups,
})
