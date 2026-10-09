import { tenantFetch } from '@/lib/tenant-api-client'
import type {
  ActionInput,
  AdjustmentInput,
  Binding,
  ChannelReport,
  Command,
  Connection,
  Environment,
  Health,
  Mapping,
  MappingInput,
  Operation,
  OperationInput,
  OrderEvent,
  OrderPage,
  DeliveryOrder,
  Provider,
} from './delivery.types'

// The existing /api proxy already targets /app/terrapos. All management
// responses use the Nest response envelope, including single-object responses.
async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const response = await tenantFetch<{ data: T }>(path, {
    method,
    body,
    signal,
    cache: 'no-store',
  })
  return response.data
}
const base = '/integrations/food-delivery'
const idPath = (id: string) => encodeURIComponent(id)
export const deliveryApi = {
  connections: (signal?: AbortSignal) =>
    request<Connection[]>(`${base}/connections`, 'GET', undefined, signal),
  connect: (body: {
    provider: Provider
    environment: Environment
    accountId: string
    credentialKey: string
  }) => request<Connection>(`${base}/connections`, 'POST', body),
  connectionFlags: (
    id: string,
    body: Pick<Connection, 'enabled' | 'writesEnabled'>
  ) => request<Connection>(`${base}/connections/${idPath(id)}`, 'PATCH', body),
  authorize: (id: string) =>
    request<{ authorizationUrl: string }>(
      `${base}/connections/${idPath(id)}/authorize`,
      'POST'
    ),
  bindings: (id: string, signal?: AbortSignal) =>
    request<Binding[]>(
      `${base}/connections/${idPath(id)}/outlets`,
      'GET',
      undefined,
      signal
    ),
  bind: (id: string, body: { outletId: string; externalOutletId: string }) =>
    request<Binding>(`${base}/connections/${idPath(id)}/outlets`, 'POST', body),
  bindingFlags: (
    id: string,
    body: Pick<
      Binding,
      | 'enabled'
      | 'inventoryEnabled'
      | 'salesEnabled'
      | 'manualAcceptance'
      | 'preparationLeadMinutes'
    >
  ) => request<Binding>(`${base}/outlets/${idPath(id)}`, 'PATCH', body),
  mappings: (id: string, signal?: AbortSignal) =>
    request<Mapping[]>(
      `${base}/outlets/${idPath(id)}/menu-mappings`,
      'GET',
      undefined,
      signal
    ),
  map: (id: string, body: MappingInput) =>
    request<Mapping>(
      `${base}/outlets/${idPath(id)}/menu-mappings`,
      'PUT',
      body
    ),
  menu: (id: string, menu: Record<string, unknown>, expectedVersion: number) =>
    request<{ version: number }>(`${base}/outlets/${idPath(id)}/menu`, 'PUT', {
      menu,
      expectedVersion,
    }),
  operate: (id: string, body: OperationInput) =>
    request<Operation>(
      `${base}/outlets/${idPath(id)}/operations`,
      'POST',
      body
    ),
  operation: (id: string, signal?: AbortSignal) =>
    request<Operation>(
      `${base}/operations/${idPath(id)}`,
      'GET',
      undefined,
      signal
    ),
  orders: (outletId: string, cursor?: string | null, signal?: AbortSignal) => {
    const params = new URLSearchParams({ outletId })
    if (cursor) params.set('cursor', cursor)
    // Never filter synchronization by state: completed/cancelled orders must merge.
    return request<OrderPage>(
      `/delivery-orders?${params}`,
      'GET',
      undefined,
      signal
    )
  },
  order: (id: string, signal?: AbortSignal) =>
    request<DeliveryOrder>(
      `/delivery-orders/${idPath(id)}`,
      'GET',
      undefined,
      signal
    ),
  fulfillment: (id: string, signal?: AbortSignal) =>
    request<Record<string, unknown>>(
      `/delivery-orders/${idPath(id)}/fulfillment`,
      'GET',
      undefined,
      signal
    ),
  events: (id: string, signal?: AbortSignal) =>
    request<OrderEvent[]>(
      `/delivery-orders/${idPath(id)}/events`,
      'GET',
      undefined,
      signal
    ),
  action: (id: string, body: ActionInput) =>
    request<Command>(`/delivery-orders/${idPath(id)}/actions`, 'POST', body),
  command: (id: string, signal?: AbortSignal) =>
    request<Command>(
      `/delivery-commands/${idPath(id)}`,
      'GET',
      undefined,
      signal
    ),
  resolve: (id: string, outcome: 'SUCCEEDED' | 'FAILED', evidence: string) =>
    request<Command>(`/delivery-commands/${idPath(id)}/resolve`, 'POST', {
      outcome,
      evidence,
    }),
  health: (signal?: AbortSignal) =>
    request<Health>(`${base}/health`, 'GET', undefined, signal),
  replay: (id: string) =>
    request<{ id: string; status: string }>(
      `${base}/events/${idPath(id)}/replay`,
      'POST'
    ),
  adjust: (id: string, body: AdjustmentInput) =>
    request<{ id: string }>(
      `/delivery-orders/${idPath(id)}/financial-adjustments`,
      'POST',
      body
    ),
  report: (
    params: { start: string; end: string; outletId?: string },
    signal?: AbortSignal
  ) =>
    request<ChannelReport>(
      `/reports/channel-sales?${new URLSearchParams(params)}`,
      'GET',
      undefined,
      signal
    ),
}
