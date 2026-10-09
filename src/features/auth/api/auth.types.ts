// Auth API Types - matching better-auth responses

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData {
  name: string
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  activeTenantId?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  code?: string
  logo?: string
  isActive: boolean
  createdAt: string
}

export interface TenantMembership {
  id: string
  tenant: Tenant
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  memberSince: string
}

export interface AuthResponse {
  user: User
  session: Session
}

export interface AuthError {
  message: string
  code?: string
}
