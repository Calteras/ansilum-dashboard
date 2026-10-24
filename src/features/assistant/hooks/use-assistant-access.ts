import { useRouterState } from '@tanstack/react-router'
import { hasRouteAccess } from '@/lib/subscription-access'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'

export const isAssistantPath = (pathname: string) =>
  pathname === '/chats' || pathname.startsWith('/chats/')

/** Whether the active plan includes Ask Ansilum (the same rule as its sidebar entry). */
export function useAssistantAccess() {
  const { data } = useCurrentSubscriptionQuery()
  const tier = data?.data?.tier
  return tier ? hasRouteAccess(tier, '/chats') : false
}

/** Whether the full Ask Ansilum page is the one on screen. */
export function useOnAssistantPage() {
  return useRouterState({
    select: (state) => isAssistantPath(state.location.pathname),
  })
}
