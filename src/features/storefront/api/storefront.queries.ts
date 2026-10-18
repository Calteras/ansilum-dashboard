import { useQuery } from '@tanstack/react-query'
import {
  getOrder,
  getOutletMenu,
  getStorefront,
  StorefrontApiError,
} from './storefront.api'
import type { PublicOrder } from './storefront.types'

export const storefrontKeys = {
  storefront: (slug: string) => ['storefront', slug] as const,
  menu: (slug: string, outletId: string) =>
    ['storefront', slug, 'menu', outletId] as const,
  order: (code: string, token: string | null) =>
    ['storefront-order', code, token] as const,
}

/** A missing store or outlet is an answer, not a failure worth retrying. */
const retry = (count: number, error: Error) =>
  !(
    error instanceof StorefrontApiError &&
    error.status >= 400 &&
    error.status < 500
  ) && count < 2

export function useStorefrontQuery(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.storefront(slug),
    queryFn: () => getStorefront(slug),
    staleTime: 60_000,
    retry,
  })
}

export function useOutletMenuQuery(slug: string, outletId: string) {
  return useQuery({
    queryKey: storefrontKeys.menu(slug, outletId),
    queryFn: () => getOutletMenu(slug, outletId),
    staleTime: 30_000,
    retry,
  })
}

const isOpen = (order?: PublicOrder) => order?.status === 'AWAITING_PAYMENT'

/** Refreshes every 10 s while the order waits for payment, then stops. */
export function useOrderQuery(code: string, token: string | null) {
  return useQuery({
    queryKey: storefrontKeys.order(code, token),
    queryFn: () => getOrder(code, token!),
    enabled: Boolean(token),
    retry,
    refetchInterval: (query) => (isOpen(query.state.data) ? 10_000 : false),
    refetchOnWindowFocus: true,
  })
}
