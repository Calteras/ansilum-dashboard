import { z } from 'zod'

export const employeeRoleSchema = z.union([
  z.literal('OWNER'),
  z.literal('ADMIN'),
  z.literal('MANAGER'),
  z.literal('SUPERVISOR'),
  z.literal('CASHIER'),
  z.literal('BARISTA'),
  z.literal('KITCHEN'),
])
export type EmployeeRole = z.infer<typeof employeeRoleSchema>

export const employeeStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
])
export type EmployeeStatus = z.infer<typeof employeeStatusSchema>

export const employeeOutletSchema = z.object({
  outlet: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }),
})

export const employeeSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeNo: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: employeeRoleSchema,
  isActive: z.boolean(),
  outlets: z.array(employeeOutletSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Employee = z.infer<typeof employeeSchema>

export const employeeListSchema = z.array(employeeSchema)
