import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { hasRouteAccess } from '@/lib/subscription-access'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import type { NavGroup, NavItem, NavLink } from '../types'
import { sidebarData } from './sidebar-data'

export type ResolvedNavLink = NavLink & { url: string; locked: boolean }
export type ResolvedNavItem =
  | ResolvedNavLink
  | (Omit<NavItem, 'items' | 'url'> & {
      items: ResolvedNavLink[]
      url?: never
      locked: boolean
    })
export type ResolvedNavGroup = Omit<NavGroup, 'items'> & {
  items: ResolvedNavItem[]
}

/** A navigable page with the section it lives in, for search and recents. */
export interface NavPage extends ResolvedNavLink {
  section?: string
}

/** Exact match, or a nested route under the item (except the root). */
export function isPathActive(pathname: string, url: string) {
  if (url === '/') return pathname === '/'
  return pathname === url || pathname.startsWith(`${url}/`)
}

/** Navigation with translated titles and plan locks resolved once. */
export function useNavigation() {
  const { t, i18n } = useTranslation()
  const { data } = useCurrentSubscriptionQuery()
  const tier = data?.data?.tier ?? 'BASIC'

  return useMemo(() => {
    const tr = (key: string) => t(key as never) as string
    const link = (item: NavLink): ResolvedNavLink => ({
      ...item,
      title: tr(item.title),
      url: item.url as string,
      locked: !!item.requiredTier && !hasRouteAccess(tier, item.url as string),
    })

    const groups: ResolvedNavGroup[] = sidebarData.navGroups.map((group) => ({
      ...group,
      title: group.title ? tr(group.title) : undefined,
      items: group.items.map((item): ResolvedNavItem => {
        if (!item.items) return link(item)
        const items = item.items.map((sub) => link(sub as NavLink))
        return {
          ...item,
          title: tr(item.title),
          items,
          locked: items.every((sub) => sub.locked),
        }
      }),
    }))
    const footer = sidebarData.footer.map(link)

    const pages: NavPage[] = [
      ...groups.flatMap((group) =>
        group.items.flatMap((item) =>
          item.items
            ? item.items.map((sub) => ({ ...sub, section: item.title }))
            : [{ ...(item as ResolvedNavLink), section: group.title }]
        )
      ),
      ...footer,
    ]

    return { groups, footer, pages }
    // i18n.language re-translates when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, tier, i18n.language])
}
