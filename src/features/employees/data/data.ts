import {
  Shield,
  UserCheck,
  CreditCard,
  Coffee,
  ChefHat,
  Eye,
  Crown,
} from '@/components/icons'
import type { EmployeeStatus, EmployeeRole } from './schema'

export const employeeStatusStyles = new Map<EmployeeStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const employeeRoles = [
  {
    label: 'Owner',
    value: 'OWNER' as EmployeeRole,
    icon: Crown,
  },
  {
    label: 'Admin',
    value: 'ADMIN' as EmployeeRole,
    icon: Shield,
  },
  {
    label: 'Manager',
    value: 'MANAGER' as EmployeeRole,
    icon: UserCheck,
  },
  {
    label: 'Supervisor',
    value: 'SUPERVISOR' as EmployeeRole,
    icon: Eye,
  },
  {
    label: 'Cashier',
    value: 'CASHIER' as EmployeeRole,
    icon: CreditCard,
  },
  {
    label: 'Barista',
    value: 'BARISTA' as EmployeeRole,
    icon: Coffee,
  },
  {
    label: 'Kitchen',
    value: 'KITCHEN' as EmployeeRole,
    icon: ChefHat,
  },
] as const

export const employeeStatuses = [
  { label: 'Active', value: 'active' as EmployeeStatus },
  { label: 'Inactive', value: 'inactive' as EmployeeStatus },
] as const
