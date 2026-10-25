import { z } from 'zod'

export const outletStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
])
export type OutletStatus = z.infer<typeof outletStatusSchema>

export const outletSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  code: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Outlet = z.infer<typeof outletSchema>

export const outletListSchema = z.array(outletSchema)
