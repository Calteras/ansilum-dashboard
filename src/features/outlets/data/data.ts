import type { OutletStatus } from './schema'

export const outletStatusStyles = new Map<OutletStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const outletStatuses = [
  { label: 'Active', value: 'active' as OutletStatus },
  { label: 'Inactive', value: 'inactive' as OutletStatus },
] as const
