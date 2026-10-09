import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { deliveryApi } from './delivery.api'
import { syncOrders } from './delivery.logic'
import type { OrderPage } from './delivery.types'

export function useDeliveryAccess() {
  const { activeTenant, session, tenants, user } = useAuthStore()
  const tenantId = activeTenant?.id ?? session?.activeTenantId ?? ''
  const role = tenants.find((m) => m.tenant.id === tenantId)?.role
  return {
    tenantId,
    userId: user?.id ?? '',
    admin: role === 'OWNER' || role === 'ADMIN',
    owner: role === 'OWNER',
  }
}

export function useDeliveryQuery<T>(
  key: readonly unknown[],
  queryFn: (signal: AbortSignal) => Promise<T>,
  enabled = true,
  interval?: number
) {
  const { tenantId, userId } = useDeliveryAccess()
  return useQuery({
    queryKey: ['food-delivery', tenantId, userId, ...key],
    queryFn: ({ signal }) => queryFn(signal),
    enabled: !!tenantId && enabled,
    retry: false,
    refetchInterval: interval,
  })
}

export function useDeliveryOrders(outletId: string) {
  const client = useQueryClient()
  const { tenantId, userId } = useDeliveryAccess()
  const key = ['food-delivery', tenantId, userId, 'orders', outletId] as const
  return useQuery({
    queryKey: key,
    queryFn: ({ signal, queryKey }) =>
      syncOrders(client.getQueryData<OrderPage>(queryKey), (cursor) =>
        deliveryApi.orders(outletId, cursor, signal)
      ),
    enabled: !!tenantId && !!outletId,
    retry: false,
    refetchInterval: 5000,
    refetchOnReconnect: 'always',
    staleTime: 0,
  })
}

export function useDeliveryMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  onSuccess?: (data: T) => void
) {
  const client = useQueryClient()
  const { tenantId, userId } = useDeliveryAccess()
  return useMutation({
    mutationFn,
    gcTime: 0,
    retry: false,
    onSuccess: (data) => {
      void client.invalidateQueries({
        queryKey: ['food-delivery', tenantId, userId],
      })
      onSuccess?.(data)
    },
    onError: () => {
      // A conflict or ambiguous response must refresh the authoritative state.
      void client.invalidateQueries({
        queryKey: ['food-delivery', tenantId, userId],
      })
    },
  })
}

// Store only operation/command identifiers and non-sensitive operation intents.
// The parent workspace remounts on tenant or user changes.
export function useDeliverySession<T>(scope: string, initial: () => T) {
  const { tenantId, userId } = useDeliveryAccess()
  const slot = `delivery-session:${tenantId}:${userId}:${scope}`
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(slot)
      if (saved) return JSON.parse(saved) as T
    } catch {
      /* use a fresh session when storage is unavailable */
    }
    return initial()
  })
  function update(next: T) {
    try {
      sessionStorage.setItem(slot, JSON.stringify(next))
    } catch {
      /* in-memory fallback */
    }
    setValue(next)
  }
  return [value, update] as const
}

// Keep the same key when retrying identical input after a lost HTTP response.
// Only non-sensitive request keys/fingerprints are persisted, never fulfillment.
export function useIntentKey(scope: string) {
  const { tenantId, userId } = useDeliveryAccess()
  const memory = useRef(new Map<string, string>())
  return async (input: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(input))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const fingerprint = Array.from(new Uint8Array(digest), (value) =>
      value.toString(16).padStart(2, '0')
    ).join('')
    const slot = `delivery-intent:${tenantId}:${userId}:${scope}:${fingerprint}`
    let key = memory.current.get(slot)
    try {
      key ??= sessionStorage.getItem(slot) ?? undefined
    } catch {
      /* storage may be unavailable */
    }
    if (!key) {
      key = crypto.randomUUID()
      memory.current.set(slot, key)
      try {
        sessionStorage.setItem(slot, key)
      } catch {
        /* in-memory fallback */
      }
    }
    return key
  }
}

export function notifySaved() {
  toast.success('Saved')
}
