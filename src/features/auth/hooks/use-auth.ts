import { useAuthStore } from '@/stores/auth-store'

/**
 * Main auth hook - provides current auth state and user info
 * Use this hook in components that need to access auth state
 */
export function useAuth() {
  const { user, session, activeTenant, tenants, isAuthenticated, isLoading } =
    useAuthStore()

  return {
    user,
    session,
    activeTenant,
    tenants,
    isAuthenticated,
    isLoading,
  }
}

/**
 * Hook to check if user has specific role in active tenant
 */
export function useHasRole(requiredRole: string) {
  const { tenants, activeTenant } = useAuth()

  if (!activeTenant) return false

  const membership = tenants.find((t) => t.tenant.id === activeTenant.id)
  return membership?.role === requiredRole
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]) {
  const { tenants, activeTenant } = useAuth()

  if (!activeTenant) return false

  const membership = tenants.find((t) => t.tenant.id === activeTenant.id)
  return roles.includes(membership?.role ?? '')
}

/**
 * Hook to check if user is tenant owner
 */
export function useIsTenantOwner() {
  return useHasRole('OWNER')
}

/**
 * Hook to check if user is tenant admin or owner
 */
export function useIsTenantAdmin() {
  return useHasAnyRole(['OWNER', 'ADMIN'])
}
