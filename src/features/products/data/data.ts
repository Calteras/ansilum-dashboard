import type { ProductStatus, ProductType } from '../api/products.types'

export const productStatusStyles = new Map<ProductStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const productStatuses = [
  { label: 'Active', value: 'active' as ProductStatus },
  { label: 'Inactive', value: 'inactive' as ProductStatus },
] as const

export const productTypes = [
  { label: 'Ready', value: 'READY' as ProductType },
  { label: 'Composed', value: 'COMPOSED' as ProductType },
  { label: 'Package', value: 'PACKAGE' as ProductType },
  { label: 'Service', value: 'SERVICE' as ProductType },
] as const

export const productTypeLabels: Record<ProductType, string> = {
  READY: 'Ready',
  COMPOSED: 'Composed',
  PACKAGE: 'Package',
  SERVICE: 'Service',
}
