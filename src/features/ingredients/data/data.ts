import { STATUS_TONE } from '@/lib/status-tone'
import type { IngredientStatus } from '../api/ingredients.types'

export const ingredientStatusStyles = new Map<IngredientStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
])

export const ingredientStatuses = [
  { label: 'Active', value: 'active' as IngredientStatus },
  { label: 'Inactive', value: 'inactive' as IngredientStatus },
] as const
