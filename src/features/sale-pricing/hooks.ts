import { format } from 'date-fns'
import { enUS, id as idLocale } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useCopy } from '@/hooks/use-copy'
import { useCategoriesQuery } from '@/features/categories/api/categories.queries'
import { useOutletsQuery } from '@/features/outlets/api/outlets.queries'
import { useProductsQuery } from '@/features/products/api/products.queries'
import type { TargetOption } from './components/pricing-ui'

/** Dates in the UI language: "25 Okt 2026" / "25 Oct 2026". */
export function usePricingDates() {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'id').startsWith(
    'id'
  )
    ? idLocale
    : enUS
  return {
    date: (iso: string) => format(new Date(iso), 'd MMM yyyy', { locale }),
  }
}

/**
 * Outlets, categories and products to target. Inactive ones stay listed so a
 * stored rule can still show and remove them.
 */
export function useTargetOptions() {
  const copy = useCopy()
  const outlets = useOutletsQuery({ pageSize: 100 })
  const categories = useCategoriesQuery({ pageSize: 100 })
  const products = useProductsQuery({ includeInactive: true })
  const inactive = copy('nonaktif', 'inactive')

  const outletOptions: TargetOption[] = (outlets.data?.data ?? []).map((o) => ({
    id: o.id,
    label: o.name,
    hint: o.isActive ? o.code : inactive,
  }))
  const categoryOptions: TargetOption[] = (categories.data?.data ?? []).map(
    (c) => ({
      id: c.id,
      label: c.name,
      hint: c.isActive ? undefined : inactive,
    })
  )
  const productOptions: TargetOption[] = (products.data?.data ?? []).map(
    (p) => ({
      id: p.id,
      label: p.name,
      hint: p.isActive ? p.category?.name : inactive,
    })
  )
  return {
    outlets: outletOptions,
    categories: categoryOptions,
    products: productOptions,
    activeOutlets: (outlets.data?.data ?? []).filter((o) => o.isActive),
    isLoading: {
      outlets: outlets.isLoading,
      categories: categories.isLoading,
      products: products.isLoading,
    },
  }
}
