import { tenantApiPaths } from '@/lib/tenant-api-client'
import { accountRequest } from '@/features/settings/subscription/subscription.api'
import type { NotificationsResponse } from './notifications.types'

export function listNotificationsApi(limit = 20) {
  return accountRequest<NotificationsResponse>(
    `${tenantApiPaths.notifications.list}?limit=${limit}`
  )
}

export function markNotificationReadApi(id: string) {
  return accountRequest<unknown>(tenantApiPaths.notifications.read(id), 'POST')
}

export function markAllNotificationsReadApi() {
  return accountRequest<unknown>(tenantApiPaths.notifications.readAll, 'POST')
}
