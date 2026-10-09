import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { createTenantApi, listTenantsApi, setActiveTenantApi } from '@/features/auth/api/tenant.api'
import type { CreateTenantRequest } from './tenants.types'

/**
 * Create tenant mutation - creates a new tenant and sets it as active
 */
export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  const { setTenants, setActiveTenant } = useAuthStore()

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => createTenantApi(data),
    onSuccess: async (newTenant) => {
      // Set as active tenant
      await setActiveTenantApi(newTenant.id)
      setActiveTenant(newTenant)

      // Refresh tenants list
      const tenants = await listTenantsApi()
      setTenants(tenants)

      // Invalidate all queries to refresh data for new tenant context
      queryClient.invalidateQueries()

      toast.success('Tenant created', {
        description: `${newTenant.name} has been created and set as active.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create tenant', {
        description: error.message,
      })
    },
  })
}
