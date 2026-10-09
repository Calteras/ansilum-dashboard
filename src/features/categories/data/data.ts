import type { CategoryStatus } from '../api/categories.types'

export const categoryStatusStyles = new Map<CategoryStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const categoryStatuses = [
  { label: 'Active', value: 'active' as CategoryStatus },
  { label: 'Inactive', value: 'inactive' as CategoryStatus },
] as const
