import { STATUS_TONE } from '@/lib/status-tone'
import { Shield, UserCheck, Users, CreditCard } from '@/components/icons'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
  ['invited', STATUS_TONE.info],
  [
    'suspended',
    STATUS_TONE.danger,
  ],
])

export const roles = [
  {
    label: 'Superadmin',
    value: 'superadmin',
    icon: Shield,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: Users,
  },
  {
    label: 'Cashier',
    value: 'cashier',
    icon: CreditCard,
  },
] as const
