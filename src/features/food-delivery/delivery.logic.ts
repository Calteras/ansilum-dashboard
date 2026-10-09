import type {
  Action,
  DeliveryOrder,
  MappingInput,
  OrderPage,
} from './delivery.types'

export function mergeOrders(
  previous: DeliveryOrder[],
  incoming: DeliveryOrder[]
): DeliveryOrder[] {
  const orders = new Map(previous.map((order) => [order.id, order]))
  for (const order of incoming) {
    if ((orders.get(order.id)?.version ?? 0) <= order.version)
      orders.set(order.id, order)
  }
  return [...orders.values()].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id)
  )
}

export async function syncOrders(
  previous: OrderPage | undefined,
  fetchPage: (cursor: string | null) => Promise<OrderPage>
): Promise<OrderPage> {
  let orders = previous?.orders ?? []
  let cursor = previous?.cursor ?? null
  // Bound each catch-up cycle. The next cycle resumes from this cursor.
  for (let page = 0; page < 20; page++) {
    const next = await fetchPage(cursor)
    orders = mergeOrders(orders, next.orders)
    const done = next.orders.length < 100 || next.cursor === cursor
    cursor = next.cursor
    if (done) break
  }
  return { orders, cursor }
}

export function availableActions(
  order: DeliveryOrder,
  admin: boolean
): Action[] {
  if (
    order.processingState === 'INVENTORY_REVIEW' &&
    admin &&
    !order.preparedAt &&
    !order.transactionId &&
    !order.inventoryHandledExternally
  )
    return ['ACKNOWLEDGE_EXTERNAL_INVENTORY']
  if (
    ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.state) ||
    ['EDIT_REVIEW', 'STATE_REVIEW', 'NEEDS_MAPPING', 'NEEDS_ITEMS'].includes(
      order.processingState
    )
  )
    return []
  const actions: Action[] = []
  if (order.state === 'ACCEPTED' && order.capabilities.inventoryEnabled)
    actions.push('START_PREPARATION')
  if (order.capabilities.writesEnabled) {
    if (order.state === 'PREPARING') actions.push('READY')
    if (
      order.provider === 'GRABFOOD' &&
      order.capabilities.manualAcceptance &&
      order.state === 'RECEIVED'
    )
      actions.push('ACCEPT', 'REJECT')
    if (
      admin &&
      order.provider === 'GRABFOOD' &&
      !order.capabilities.manualAcceptance &&
      order.orderType === 'delivery' &&
      !order.scheduledAt
    )
      actions.push('CANCEL')
  }
  return actions
}

export function validateMapping(mapping: MappingInput): void {
  if (!mapping.externalId.trim())
    throw new Error('Enter the provider item or option ID.')
  if (
    mapping.kind === 'ITEM'
      ? !mapping.productId || !!mapping.modifierId
      : !!mapping.productId || !!mapping.variantId === !!mapping.modifierId
  )
    throw new Error(
      'Items need a product and optional variant. Options need exactly one variant or modifier.'
    )
}

export function parseMenu(text: string): Record<string, unknown> {
  const menu: unknown = JSON.parse(text)
  if (!menu || typeof menu !== 'object' || Array.isArray(menu))
    throw new Error('The reviewed menu must be a JSON object.')
  if (new TextEncoder().encode(text).length > 1024 * 1024)
    throw new Error('Menu must be no larger than 1 MB.')
  return menu as Record<string, unknown>
}

export function reportPeriod(start: string, end: string) {
  const from = new Date(start),
    to = new Date(end)
  if (
    !Number.isFinite(from.getTime()) ||
    !Number.isFinite(to.getTime()) ||
    to <= from ||
    to.getTime() - from.getTime() > 366 * 86400000
  )
    throw new Error(
      'Choose an end after the start, within 366 days. The end is exclusive.'
    )
  return { start: from.toISOString(), end: to.toISOString() }
}

export function authorizationDestination(
  authorizationUrl: string,
  frontendOrigin: string
): string {
  const url = new URL(authorizationUrl)
  const callback = new URL(url.searchParams.get('redirect_uri') ?? '')
  if (
    ![
      'https://integration-goauth.gojekapi.com',
      'https://accounts.go-jek.com',
    ].includes(url.origin) ||
    callback.origin !== frontendOrigin ||
    !/^\/app\/terrapos\/webhooks\/gofood\/[^/]+\/oauth\/callback$/.test(
      callback.pathname
    )
  ) {
    throw new Error(
      'GoFood authorization is not configured for this website. Ask your operator to check the registered callback address.'
    )
  }
  return url.href
}

export const reviewMessages: Record<string, string> = {
  NEEDS_MAPPING:
    'Correct the menu mappings, then replay the blocked event in Recovery.',
  NEEDS_ITEMS:
    'Order items are missing. Recover provider details, then replay the blocked event.',
  INVENTORY_REVIEW:
    'This order completed without a preparation record. Check manual stock records before acknowledging external inventory.',
  FINANCIAL_REVIEW:
    'Compare amounts and promotions with provider records. Automatic financial overrides are unavailable.',
  EDIT_REVIEW:
    'The provider edited this order after preparation. Investigate stock and provider records before continuing.',
  STATE_REVIEW:
    'Conflicting terminal states require investigation against provider records.',
}

export function money(value: string | null, currency = 'IDR') {
  return value === null
    ? 'Unconfirmed'
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(
        Number(value)
      )
}
export function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—'
}
