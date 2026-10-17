import { STATUS_TONE } from '@/lib/status-tone'
import type { ProductStatus, ProductType } from '../api/products.types'

export const productStatusStyles = new Map<ProductStatus, string>([
  ['active', STATUS_TONE.success],
  ['inactive', STATUS_TONE.neutral],
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
