import { STATUS_TONE } from '@/lib/status-tone'
import type { ModifierGroupStatus } from '../api/modifier-groups.types'

export const modifierGroupStatusStyles = new Map<ModifierGroupStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
])

export const modifierGroupStatuses = [
  { label: 'Active', value: 'active' as ModifierGroupStatus },
  { label: 'Inactive', value: 'inactive' as ModifierGroupStatus },
] as const
