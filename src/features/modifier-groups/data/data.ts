import type { ModifierGroupStatus } from '../api/modifier-groups.types'

export const modifierGroupStatusStyles = new Map<ModifierGroupStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const modifierGroupStatuses = [
  { label: 'Active', value: 'active' as ModifierGroupStatus },
  { label: 'Inactive', value: 'inactive' as ModifierGroupStatus },
] as const
