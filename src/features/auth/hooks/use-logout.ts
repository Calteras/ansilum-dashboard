import { useLogoutMutation } from '../api/auth.queries'

/**
 * Hook for logout functionality
 * Provides logout function with loading state
 */
export function useLogout() {
  const logoutMutation = useLogoutMutation()

  const logout = () => {
    logoutMutation.mutate()
  }

  return {
    logout,
    isLoading: logoutMutation.isPending,
  }
}
