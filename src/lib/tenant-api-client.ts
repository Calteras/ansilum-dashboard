import { API_BASE_URL } from '@/config/api.config'
import { useAuthStore } from '@/stores/auth-store'
import { notifyAuthSessionExpired } from '@/lib/auth-session'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

/**
 * Get the current active tenant ID from the auth store
 */
export function getActiveTenantId(): string | null {
  const state = useAuthStore.getState()
  return state.activeTenant?.id ?? state.session?.activeTenantId ?? null
}

/**
 * Tenant-scoped API client that automatically adds x-tenant-id header
 * Used by all tenant-scoped features (employees, outlets, products, etc.)
 */
export async function tenantFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const tenantId = getActiveTenantId()

  if (!tenantId) {
    throw new Error('No active tenant selected. Please select a tenant first.')
  }

  const { body, headers: customHeaders, ...restOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...customHeaders,
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    credentials: 'include', // Include cookies for auth
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, config)

  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(
      error.message || `Request failed with status ${response.status}`
    )
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

/**
 * GET request with tenant context
 */
export function tenantGet<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return tenantFetch<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request with tenant context
 */
export function tenantPost<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return tenantFetch<T>(endpoint, { ...options, method: 'POST', body })
}

/**
 * PUT request with tenant context
 */
export function tenantPut<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return tenantFetch<T>(endpoint, { ...options, method: 'PUT', body })
}

/**
 * PATCH request with tenant context
 */
export function tenantPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return tenantFetch<T>(endpoint, { ...options, method: 'PATCH', body })
}

/**
 * DELETE request with tenant context
 */
export function tenantDelete<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return tenantFetch<T>(endpoint, { ...options, method: 'DELETE' })
}

/**
 * API paths for tenant-scoped resources
 */
export const tenantApiPaths = {
  employees: {
    list: '/employees',
    create: '/employees',
    get: (id: string) => `/employees/${id}`,
    update: (id: string) => `/employees/${id}`,
    delete: (id: string) => `/employees/${id}`,
    uploadPhoto: (id: string) => `/employees/${id}/photo`,
    deletePhoto: (id: string) => `/employees/${id}/photo`,
  },
  outlets: {
    list: '/outlets',
    create: '/outlets',
    get: (id: string) => `/outlets/${id}`,
    update: (id: string) => `/outlets/${id}`,
    delete: (id: string) => `/outlets/${id}`,
  },
  categories: {
    list: '/categories',
    create: '/categories',
    get: (id: string) => `/categories/${id}`,
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
  products: {
    list: '/products',
    create: '/products',
    get: (id: string) => `/products/${id}`,
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
    softDelete: (id: string) => `/products/${id}/soft`,
    uploadPhoto: (id: string) => `/products/${id}/photo`,
    deletePhoto: (id: string) => `/products/${id}/photo`,
    getOutlets: (id: string) => `/products/${id}/outlets`,
    setOutlets: (id: string) => `/products/${id}/outlets`,
  },
  modifierGroups: {
    list: '/modifier-groups',
    create: '/modifier-groups',
    get: (id: string) => `/modifier-groups/${id}`,
    update: (id: string) => `/modifier-groups/${id}`,
    delete: (id: string) => `/modifier-groups/${id}`,
  },
  ingredients: {
    list: '/ingredients',
    create: '/ingredients',
    get: (id: string) => `/ingredients/${id}`,
    update: (id: string) => `/ingredients/${id}`,
    delete: (id: string) => `/ingredients/${id}`,
  },
  recipes: {
    list: '/recipes',
    create: '/recipes',
    get: (id: string) => `/recipes/${id}`,
    getByProduct: (productId: string) => `/recipes/product/${productId}`,
    update: (id: string) => `/recipes/${id}`,
    delete: (id: string) => `/recipes/${id}`,
  },
  stockMovements: {
    list: '/stock-movements',
    create: '/stock-movements',
    get: (id: string) => `/stock-movements/${id}`,
  },
  transactions: {
    list: '/transactions',
    get: (id: string) => `/transactions/${id}`,
    summary: (outletId: string) => `/transactions/summary/${outletId}`,
  },
  subscriptions: {
    plans: '/subscriptions/plans',
    current: '/subscriptions/current',
    subscribe: '/subscriptions/subscribe',
    order: (id: string) => `/subscriptions/orders/${id}`,
    pendingOrder: '/subscriptions/orders/pending',
    cancelOrder: (id: string) => `/subscriptions/orders/${id}/cancel`,
    chargeCard: (id: string) => `/subscriptions/orders/${id}/card-charge`,
    billing: '/subscriptions/billing',
    card: '/subscriptions/billing/card',
    autoRenew: '/subscriptions/billing/auto-renew',
    payments: '/subscriptions/payments',
    invoice: (id: string) => `/subscriptions/payments/${id}/invoice`,
    cancel: '/subscriptions/cancel',
    resume: '/subscriptions/resume',
  },
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
  },
  reservations: {
    list: '/transactions/reservations',
    create: '/transactions/reservations',
    fulfill: (id: string) => `/transactions/reservations/${id}/fulfill`,
    cancel: (id: string) => `/transactions/reservations/${id}/cancel`,
    deposit: (id: string) => `/transactions/reservations/${id}/deposit`,
  },
  analytics: {
    summary: '/analytics/summary',
    stock: '/analytics/stock',
  },
  cogs: {
    calculate: '/cogs/calculate',
    productCost: (productId: string) => `/cogs/product/${productId}/cost`,
    marginForecast: '/cogs/margin-forecast',
    productOverhead: (productId: string) =>
      `/cogs/product/${productId}/overhead`,
    deleteOverhead: (overheadId: string) => `/cogs/overhead/${overheadId}`,
  },
  outletInventory: {
    byOutlet: (outletId: string) => `/outlet-inventory/${outletId}`,
    lowStock: (outletId: string) => `/outlet-inventory/${outletId}/low-stock`,
    stockValue: (outletId: string) =>
      `/outlet-inventory/${outletId}/stock-value`,
    byIngredient: (ingredientId: string) =>
      `/outlet-inventory/ingredient/${ingredientId}`,
  },
  tableLayout: {
    // API_BASE_URL (/api) is rewritten to /app/terrapos upstream.
    get: (outletId: string) => `/table-layout/${outletId}`,
    save: (outletId: string) => `/table-layout/${outletId}`,
    updateTable: (outletId: string, tableId: string) =>
      `/table-layout/${outletId}/tables/${tableId}`,
    updateStatus: (outletId: string, tableId: string) =>
      `/table-layout/${outletId}/tables/${tableId}/status`,
    release: (outletId: string, tableId: string) =>
      `/table-layout/${outletId}/tables/${tableId}/release`,
    monitoring: (outletId: string) => `/table-layout/${outletId}/monitoring`,
  },
}
