import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getSessionApi } from '../api/auth.api'
import { listTenantsApi, getActiveTenantApi } from '../api/tenant.api'

/** Confirm the cookie session before rendering a protected layout or onboarding. */
export function useSessionRestore() {
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      const sessionData = await getSessionApi().catch(() => null)
      if (cancelled) return
      const store = useAuthStore.getState()
      if (!sessionData) {
        store.clearAuth()
        setRestored(true)
        return
      }
      // Load tenant context before allowing protected content to mount.
      try {
        const tenants = await listTenantsApi()
        const activeTenant = tenants.length ? await getActiveTenantApi() : null
        if (cancelled) return
        store.setTenants(tenants)
        if (activeTenant) store.setActiveTenant(activeTenant)
        else if (tenants.length) store.setActiveTenant(tenants[0].tenant)
      } catch {
        // Preserve existing context if tenant loading is temporarily unavailable.
      }
      if (cancelled) return
      store.setAuth(sessionData.user, sessionData.session)
      setRestored(true)
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])
  return { isPending: !restored }
}
