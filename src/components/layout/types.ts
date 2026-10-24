import { type LinkProps } from '@tanstack/react-router'
import type { SubscriptionTier } from '@/features/settings/subscription/subscription.types'

type BaseNavItem = {
  /** i18n key in the data file, translated text once resolved by `useNavigation`. */
  title: string
  badge?: string
  icon?: React.ElementType
  requiredTier?: SubscriptionTier
  /** Extra terms the global search matches on (synonyms, Indonesian terms). */
  keywords?: string[]
  /** Live status shown at the end of the sidebar entry (e.g. an answer running). */
  indicator?: React.ComponentType
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  /** Section label; omit for the unlabelled top section. */
  title?: string
  items: NavItem[]
}

type SidebarData = {
  navGroups: NavGroup[]
  /** Pinned to the bottom of the sidebar. */
  footer: NavLink[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
