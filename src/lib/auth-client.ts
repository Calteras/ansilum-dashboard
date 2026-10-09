import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

// Both dev (Vite proxy) and production (Vercel rewrites) route through /api
// to keep requests same-origin, which is required for cookie-based auth
// Better Auth requires a full URL, so we prepend the current origin
const getAuthBaseURL = () =>
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth`
    : 'http://localhost:5173/api/auth'

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: 'include', // Always send cookies with requests
  },
})

// Re-export for convenient access
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
