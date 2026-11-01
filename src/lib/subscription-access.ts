import type { SubscriptionTier } from '@/features/settings/subscription/subscription.types'

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  BASIC: 0,
  STANDARD: 1,
  FULL: 2,
}

const ROUTE_TIER_MAP: Record<string, SubscriptionTier> = {
  '/tables': 'STANDARD',
  '/reservations': 'STANDARD',
  '/modifier-groups': 'STANDARD',
  '/ingredients': 'STANDARD',
  '/stock-movements': 'STANDARD',
  '/transactions': 'STANDARD',
  '/chats': 'STANDARD',
  '/analytics': 'FULL',
}

export function getRequiredTier(path: string): SubscriptionTier {
  for (const [route, tier] of Object.entries(ROUTE_TIER_MAP)) {
    if (path === route || path.startsWith(route + '/')) {
      return tier
    }
  }
  return 'BASIC'
}

export function hasRouteAccess(
  currentTier: SubscriptionTier,
  path: string
): boolean {
  const requiredTier = getRequiredTier(path)
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier]
}

/**
 * The tier features are unlocked by: the paid plan, or a higher running free
 * trial. Billing and capacity keep using the paid `tier`.
 */
export function featureTierOf(
  data: { tier?: SubscriptionTier; featureTier?: SubscriptionTier } | undefined
): SubscriptionTier {
  return data?.featureTier ?? data?.tier ?? 'BASIC'
}
