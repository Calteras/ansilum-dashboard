/**
 * Centralized API configuration
 *
 * Note: In development, requests are proxied through Vite to bypass CORS.
 * The authClient from '@/lib/auth-client' handles all API calls internally.
 */

// Both dev (Vite proxy) and production (Vercel rewrites) use /api prefix
// to keep requests same-origin, which is required for cookie-based auth
export const API_BASE_URL = '/api'

export const apiConfig = {
    baseURL: API_BASE_URL,
    auth: {
        signInPath: '/auth/sign-in/email',
        signUpPath: '/auth/sign-up/email',
        signOutPath: '/auth/sign-out',
    },
    tenant: {
        listPath: '/auth/organization/list',
        createPath: '/auth/organization/create',
        activePath: '/auth/organization/set-active',
    },
}
