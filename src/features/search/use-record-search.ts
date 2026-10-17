import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatMoney } from '@/lib/format'
import { listCategoriesApi } from '@/features/categories/api/categories.api'
import { categoryKeys } from '@/features/categories/api/categories.queries'
import { listEmployeesApi } from '@/features/employees/api/employees.api'
import { employeeKeys } from '@/features/employees/api/employees.queries'
import { listIngredientsApi } from '@/features/ingredients/api/ingredients.api'
import { ingredientKeys } from '@/features/ingredients/api/ingredients.queries'
import { listModifierGroupsApi } from '@/features/modifier-groups/api/modifier-groups.api'
import { modifierGroupKeys } from '@/features/modifier-groups/api/modifier-groups.queries'
import { listOutletsApi } from '@/features/outlets/api/outlets.api'
import { outletKeys } from '@/features/outlets/api/outlets.queries'
import { listProductsApi } from '@/features/products/api/products.api'
import { productKeys } from '@/features/products/api/products.queries'
import { rankItems } from './search-scoring'

export type RecordKind =
  | 'product'
  | 'ingredient'
  | 'outlet'
  | 'employee'
  | 'category'
  | 'modifier-group'

export interface RecordResult {
  id: string
  kind: RecordKind
  title: string
  subtitle?: string
  keywords?: string[]
  /** List page that shows the record, filtered to it. */
  to: string
  search: Record<string, string>
}

const PER_KIND = 5
// Records match on names and identifiers; subtitles are context, not search terms.
const RECORD_MATCH = { matchSubtitle: false }

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Records matching `query`. Products search on the server (the catalogue can be
 * large); the other lists are small per business, fetched once while the
 * palette is open and filtered here. Shares cache with the list pages.
 */
export function useRecordSearch(query: string, open: boolean) {
  const q = useDebounced(query.trim(), 200)
  const searching = open && q.length >= 2
  const listOptions = { enabled: open, staleTime: 60_000 }

  const productParams = { search: q, includeInactive: true }
  const products = useQuery({
    queryKey: productKeys.list(productParams),
    queryFn: () => listProductsApi(productParams),
    enabled: searching,
    staleTime: 30_000,
  })
  const outlets = useQuery({
    queryKey: outletKeys.list({}),
    queryFn: () => listOutletsApi({}),
    ...listOptions,
  })
  const employees = useQuery({
    queryKey: employeeKeys.list({}),
    queryFn: () => listEmployeesApi({}),
    ...listOptions,
  })
  const categories = useQuery({
    queryKey: categoryKeys.list({}),
    queryFn: () => listCategoriesApi({}),
    ...listOptions,
  })
  const modifierGroups = useQuery({
    queryKey: modifierGroupKeys.list({}),
    queryFn: () => listModifierGroupsApi({}),
    ...listOptions,
  })
  const ingredients = useQuery({
    queryKey: ingredientKeys.list({ pageSize: 200 }),
    queryFn: () => listIngredientsApi({ pageSize: 200 }),
    ...listOptions,
  })

  const results = useMemo<RecordResult[]>(() => {
    if (!searching) return []
    const productResults: RecordResult[] = (products.data?.data ?? []).map(
      (p) => ({
        id: `product:${p.id}`,
        kind: 'product',
        title: p.name,
        subtitle: [
          p.sku,
          formatMoney(p.basePrice),
          p.category?.name,
          !p.isActive && 'Inactive',
        ]
          .filter(Boolean)
          .join(' · '),
        keywords: [p.sku],
        to: '/products',
        search: { search: p.name },
      })
    )
    const ingredientResults: RecordResult[] = (
      ingredients.data?.data ?? []
    ).map((i) => ({
      id: `ingredient:${i.id}`,
      kind: 'ingredient',
      title: i.name,
      subtitle: `${i.code} · ${i.unit}`,
      keywords: [i.code],
      to: '/ingredients',
      search: { name: i.name },
    }))
    const outletResults: RecordResult[] = (outlets.data?.data ?? []).map(
      (o) => ({
        id: `outlet:${o.id}`,
        kind: 'outlet',
        title: o.name,
        subtitle: [o.code, o.address].filter(Boolean).join(' · '),
        keywords: [o.code],
        to: '/outlets',
        search: { name: o.name },
      })
    )
    const employeeResults: RecordResult[] = (employees.data?.data ?? []).map(
      (e) => ({
        id: `employee:${e.id}`,
        kind: 'employee',
        title: e.name,
        subtitle: [
          e.role.charAt(0) + e.role.slice(1).toLowerCase(),
          e.employeeNo,
          e.email,
        ]
          .filter(Boolean)
          .join(' · '),
        // Match the mailbox name only; a shared company domain matches everyone.
        keywords: [e.employeeNo, e.email?.split('@')[0] ?? '', e.phone ?? ''],
        to: '/employees',
        search: { name: e.name },
      })
    )
    const categoryResults: RecordResult[] = (categories.data?.data ?? []).map(
      (c) => ({
        id: `category:${c.id}`,
        kind: 'category',
        title: c.name,
        subtitle: c.description ?? undefined,
        to: '/categories',
        search: { name: c.name },
      })
    )
    const modifierResults: RecordResult[] = (
      modifierGroups.data?.data ?? []
    ).map((m) => ({
      id: `modifier-group:${m.id}`,
      kind: 'modifier-group',
      title: m.name,
      subtitle: m.isRequired ? 'Required' : 'Optional',
      to: '/modifier-groups',
      search: { name: m.name },
    }))

    return [
      ...rankItems(q, productResults, PER_KIND, RECORD_MATCH),
      ...rankItems(q, ingredientResults, PER_KIND, RECORD_MATCH),
      ...rankItems(q, outletResults, PER_KIND, RECORD_MATCH),
      ...rankItems(q, employeeResults, PER_KIND, RECORD_MATCH),
      ...rankItems(q, categoryResults, PER_KIND, RECORD_MATCH),
      ...rankItems(q, modifierResults, PER_KIND, RECORD_MATCH),
    ]
  }, [
    searching,
    q,
    products.data,
    ingredients.data,
    outlets.data,
    employees.data,
    categories.data,
    modifierGroups.data,
  ])

  const isFetching =
    searching &&
    (q !== query.trim() ||
      [
        products,
        outlets,
        employees,
        categories,
        modifierGroups,
        ingredients,
      ].some((result) => result.isFetching))

  return { results, isFetching, query: q }
}
