import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  createTenantApi,
  deleteTenantLogoApi,
  listTenantsApi,
  setActiveTenantApi,
  uploadTenantLogoApi,
} from '@/features/auth/api/tenant.api'
import type { Tenant } from '@/features/auth/api/auth.types'
import type { CreateTenantRequest } from './tenants.types'

/**
 * Create tenant mutation - creates a new tenant and sets it as active
 */
export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  const { setTenants, setActiveTenant } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      logoFile,
      ...data
    }: CreateTenantRequest & { logoFile?: File }) => {
      const tenant = await createTenantApi(data)
      if (!logoFile) return tenant
      // The logo is uploaded as a separate step rather than in the create
      // request: the server writes the tenant before storing the logo, so a
      // combined request can fail after the tenant already exists.
      try {
        return await uploadTenantLogoApi(tenant.id, logoFile)
      } catch (error) {
        toast.warning('Tenant created without a logo', {
          description: `${error instanceof Error ? error.message : ''} You can add it later in Settings → Business.`.trim(),
        })
        return tenant
      }
    },
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

/**
 * Keep the store's copy of a tenant in sync after its logo changes
 */
function syncTenant(tenant: Tenant) {
  const { activeTenant, tenants, setActiveTenant, setTenants } =
    useAuthStore.getState()
  if (activeTenant?.id === tenant.id) setActiveTenant(tenant)
  setTenants(
    tenants.map((membership) =>
      membership.tenant.id === tenant.id ? { ...membership, tenant } : membership
    )
  )
}

/**
 * Upload or replace a tenant's logo
 */
export function useUploadTenantLogoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, file }: { tenantId: string; file: File }) =>
      uploadTenantLogoApi(tenantId, file),
    onSuccess: (tenant) => {
      syncTenant(tenant)
      queryClient.invalidateQueries({ queryKey: ['auth', 'tenants'] })
      toast.success('Logo updated', {
        description: `${tenant.name} logo has been updated.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to upload logo', { description: error.message })
    },
  })
}

/**
 * Remove a tenant's logo
 */
export function useDeleteTenantLogoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => deleteTenantLogoApi(tenantId),
    onSuccess: (tenant) => {
      syncTenant(tenant)
      queryClient.invalidateQueries({ queryKey: ['auth', 'tenants'] })
      toast.success('Logo removed', {
        description: `${tenant.name} logo has been removed.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to remove logo', { description: error.message })
    },
  })
}
