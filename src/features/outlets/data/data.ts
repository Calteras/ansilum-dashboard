import { STATUS_TONE } from '@/lib/status-tone'
import type { OutletStatus } from './schema'

export const outletStatusStyles = new Map<OutletStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
])

export const outletStatuses = [
  { label: 'Active', value: 'active' as OutletStatus },
  { label: 'Inactive', value: 'inactive' as OutletStatus },
] as const
