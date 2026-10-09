import type { IngredientStatus } from '../api/ingredients.types'

export const ingredientStatusStyles = new Map<IngredientStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const ingredientStatuses = [
  { label: 'Active', value: 'active' as IngredientStatus },
  { label: 'Inactive', value: 'inactive' as IngredientStatus },
] as const
