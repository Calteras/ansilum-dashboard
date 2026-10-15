import { create } from 'zustand'
import type {
  User,
  Session,
  Tenant,
  TenantMembership,
} from '@/features/auth/api/auth.types'

interface AuthState {
  // State
  user: User | null
  session: Session | null
  activeTenant: Tenant | null
  tenants: TenantMembership[]
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setAuth: (user: User, session: Session) => void
  setUser: (user: User) => void
  setTenants: (tenants: TenantMembership[]) => void
  setActiveTenant: (tenant: Tenant) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

/**
 * Auth store - no localStorage persistence
 * Cookie-based sessions are managed by better-auth
 */
export const useAuthStore = create<AuthState>()((set) => ({
  // Initial state
  user: null,
  session: null,
  activeTenant: null,
  tenants: [],
  isAuthenticated: false,
  isLoading: true,

  // Set authenticated user and session
  setAuth: (user, session) =>
    set({
      user,
      session,
      isAuthenticated: true,
      isLoading: false,
    }),

  // Replace the user profile, e.g. after an avatar change
  setUser: (user) => set({ user }),

  // Set user's tenants
  setTenants: (tenants) => set({ tenants }),

  // Set active tenant
  setActiveTenant: (tenant) =>
    set((state) => ({
      activeTenant: tenant,
      session: state.session
        ? { ...state.session, activeTenantId: tenant.id }
        : null,
    })),

  // Clear all auth state
  clearAuth: () =>
    set({
      user: null,
      session: null,
      activeTenant: null,
      tenants: [],
      isAuthenticated: false,
      isLoading: false,
    }),

  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),
}))
