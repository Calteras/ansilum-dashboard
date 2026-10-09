import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth-store'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.clearAuth()
    })
  })

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  }

  const mockSession = {
    id: 'session-1',
    userId: '1',
    token: 'token-123',
    expiresAt: '2024-01-22T10:00:00Z',
  }

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  }

  it('should initialize with no user and not authenticated', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.activeTenant).toBeNull()
    expect(result.current.tenants).toEqual([])
  })

  it('should set auth when setAuth is called', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setAuth(mockUser, mockSession)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should clear auth when clearAuth is called', () => {
    const { result } = renderHook(() => useAuthStore())

    // First set auth
    act(() => {
      result.current.setAuth(mockUser, mockSession)
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then clear it
    act(() => {
      result.current.clearAuth()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.activeTenant).toBeNull()
    expect(result.current.tenants).toEqual([])
  })

  it('should set tenants', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockTenants = [
      {
        id: '1',
        tenant: mockTenant,
        role: 'OWNER' as const,
        memberSince: '2024-01-15T10:00:00Z',
      },
    ]

    act(() => {
      result.current.setTenants(mockTenants)
    })

    expect(result.current.tenants).toEqual(mockTenants)
  })

  it('should set active tenant', () => {
    const { result } = renderHook(() => useAuthStore())

    // First set auth
    act(() => {
      result.current.setAuth(mockUser, mockSession)
    })

    // Then set active tenant
    act(() => {
      result.current.setActiveTenant(mockTenant)
    })

    expect(result.current.activeTenant).toEqual(mockTenant)
    expect(result.current.session?.activeTenantId).toBe(mockTenant.id)
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
