import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  savePendingVerification,
  clearPendingVerification,
} from '../verification/pending-email'
import { AuthRequestError, loginApi, logoutApi } from './auth.api'
import { deleteProfileImageApi, uploadProfileImageApi } from './profile.api'
import type { LoginCredentials } from './auth.types'
import { listTenantsApi, setActiveTenantApi } from './tenant.api'

/**
 * Login mutation - handles email/password authentication
 */
export function useLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setAuth, setTenants, setActiveTenant } = useAuthStore()

  return useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: ({
      credentials,
      captchaToken,
    }: {
      credentials: LoginCredentials
      captchaToken: string
    }) => loginApi(credentials, captchaToken),
    onSuccess: async (data) => {
      queryClient.clear()
      clearPendingVerification()
      useAuthStore.getState().clearAuth()
      let needsOnboarding = false
      if (data?.user && data?.session) {
        setAuth(data.user, data.session)

        // Fetch user's tenants and set first as active if none set
        try {
          const tenants = await listTenantsApi()
          setTenants(tenants)
          needsOnboarding = tenants.length === 0

          // Auto-select first tenant if user has tenants but no active one
          if (tenants.length > 0 && !data.session.activeTenantId) {
            const firstTenant = tenants[0].tenant
            await setActiveTenantApi(firstTenant.id)
            setActiveTenant(firstTenant)
          } else if (tenants.length > 0 && data.session.activeTenantId) {
            // Set the active tenant from session
            const activeMembership = tenants.find(
              (t) => t.tenant.id === data.session.activeTenantId
            )
            if (activeMembership) {
              setActiveTenant(activeMembership.tenant)
            }
          }
        } catch {
          // Tenant loading is non-blocking; continue with the authenticated session.
        }
      }

      toast.success('Welcome back!')

      navigate({ to: needsOnboarding ? '/onboarding' : '/' })
    },
    onError: (error: Error, variables) => {
      if (
        error instanceof AuthRequestError &&
        error.code === 'EMAIL_NOT_VERIFIED'
      ) {
        savePendingVerification(variables.credentials.email)
        toast.info('Verify your email before signing in.')
        navigate({ to: '/auth/check-email' })
        return
      }
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials',
      })
    },
  })
}

/**
 * Logout mutation - clears session and redirects to login
 */
export function useLogoutMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      toast.success('Logged out successfully')
      navigate({ to: '/sign-in-2' })
    },
    onError: (error: Error) => {
      // Clear auth even on error - user likely wants to log out
      clearAuth()
      queryClient.clear()
      toast.error('Logout failed', {
        description: error.message,
      })
      navigate({ to: '/sign-in-2' })
    },
  })
}

/**
 * Set active tenant mutation - switches context to a different tenant
 */
export function useSetActiveTenantMutation() {
  const queryClient = useQueryClient()
  const { setActiveTenant } = useAuthStore()

  return useMutation({
    mutationFn: (tenantId: string) => setActiveTenantApi(tenantId),
    onSuccess: (data) => {
      setActiveTenant(data.tenant)

      // Invalidate all non-auth queries to refresh business data for new tenant context
      // We exclude 'auth' to prevent session/tenant re-fetching that might clear state
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey
          return queryKey[0] !== 'auth'
        },
      })

      toast.success('Switched tenant', {
        description: `Now working with ${data.tenant.name}`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to switch tenant', {
        description: error.message,
      })
    },
  })
}

/**
 * Query to fetch tenants list
 */
export function useTenantsQuery() {
  const { setTenants, setActiveTenant } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'tenants'],
    queryFn: async () => {
      const tenants = await listTenantsApi()
      setTenants(tenants)

      // Get current activeTenant from store directly, not from stale closure
      const currentActiveTenant = useAuthStore.getState().activeTenant

      // Auto-select first tenant if none is active
      if (tenants.length > 0 && !currentActiveTenant) {
        setActiveTenant(tenants[0].tenant)
      }

      return tenants
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Upload or replace the current user's profile image
 */
export function useUploadProfileImageMutation() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (file: File) => uploadProfileImageApi(file),
    onSuccess: (user) => {
      setUser(user)
      toast.success('Profile photo updated')
    },
    onError: (error: Error) => {
      toast.error('Failed to upload photo', { description: error.message })
    },
  })
}

/**
 * Remove the current user's profile image
 */
export function useDeleteProfileImageMutation() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: () => deleteProfileImageApi(),
    onSuccess: (user) => {
      setUser(user)
      toast.success('Profile photo removed')
    },
    onError: (error: Error) => {
      toast.error('Failed to remove photo', { description: error.message })
    },
  })
}
