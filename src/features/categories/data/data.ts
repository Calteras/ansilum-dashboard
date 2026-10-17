import { STATUS_TONE } from '@/lib/status-tone'
import type { CategoryStatus } from '../api/categories.types'

export const categoryStatusStyles = new Map<CategoryStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
])

export const categoryStatuses = [
  { label: 'Active', value: 'active' as CategoryStatus },
  { label: 'Inactive', value: 'inactive' as CategoryStatus },
] as const
