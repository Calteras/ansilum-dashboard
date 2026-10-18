/**
 * Per-browser conveniences: the outlet a customer picked for a store, and the
 * orders they placed here (so the order page can be reopened without the
 * link). Storage failures are ignored; nothing depends on them.
 */
const OUTLET_KEY = (slug: string) => `ansilum.storefront.outlet.${slug}`
const ORDERS_KEY = 'ansilum.storefront.orders'

export interface RememberedOrder {
  code: string
  token: string
  slug: string
  storeName: string
  placedAt: string
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const rememberedOutlet = (slug: string) =>
  read<string | null>(OUTLET_KEY(slug), null)
export const rememberOutlet = (slug: string, outletId: string) =>
  write(OUTLET_KEY(slug), outletId)

export const rememberedOrders = () => read<RememberedOrder[]>(ORDERS_KEY, [])

export function rememberOrder(order: RememberedOrder) {
  const others = rememberedOrders().filter((o) => o.code !== order.code)
  write(ORDERS_KEY, [order, ...others].slice(0, 10))
}

export const tokenFor = (code: string) =>
  rememberedOrders().find((o) => o.code === code)?.token ?? null

/** The order link the customer keeps and the cashier can scan. */
export const orderPath = (code: string, token: string) =>
  `/o/${encodeURIComponent(code)}?t=${encodeURIComponent(token)}`

const NAME_KEY = 'ansilum.storefront.name'

/** The name the customer ordered under last time, to save retyping it. */
export const rememberedName = () => read<string>(NAME_KEY, '')
export const rememberName = (name: string) => write(NAME_KEY, name.slice(0, 60))
