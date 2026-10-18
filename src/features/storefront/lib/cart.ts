import { create } from 'zustand'
import type { MenuProduct, OutletMenu } from '../api/storefront.types'

/**
 * The customer's cart, kept in this browser only. It belongs to one store and
 * one outlet; nothing reaches the server until the order is placed, and the
 * server prices it again then.
 */
export interface CartLine {
  key: string
  productId: string
  variantId: string | null
  modifierIds: string[]
  quantity: number
  notes: string
  /** What the customer saw, for display. Never sent as a price. */
  name: string
  variantName: string | null
  optionNames: string[]
  unitPriceMinor: number
  /** Set when the menu no longer offers this line as chosen. */
  unavailable?: boolean
}

export interface Cart {
  slug: string
  outletId: string
  /** Idempotency key for placing this cart; renewed when the cart changes. */
  submissionId: string
  lines: CartLine[]
}

const STORAGE_KEY = 'ansilum.storefront.cart'
export const MAX_LINE_QUANTITY = 50
export const MAX_CART_QUANTITY = 100
export const MAX_CART_LINES = 30

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`

function load(): Cart | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const cart = JSON.parse(raw) as Cart
    return cart && Array.isArray(cart.lines) && typeof cart.slug === 'string'
      ? cart
      : null
  } catch {
    return null
  }
}

function save(cart: Cart | null) {
  try {
    if (cart) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode or full storage: the cart still works for this visit.
  }
}

export const lineKey = (
  productId: string,
  variantId: string | null,
  modifierIds: string[],
  notes: string
) =>
  [
    productId,
    variantId ?? '',
    [...modifierIds].sort().join(','),
    notes.trim(),
  ].join('|')

export const cartQuantity = (cart: Cart | null) =>
  cart?.lines.reduce((sum, l) => sum + l.quantity, 0) ?? 0

export const cartSubtotalMinor = (cart: Cart | null) =>
  cart?.lines.reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0) ?? 0

interface CartState {
  cart: Cart | null
  add: (
    scope: { slug: string; outletId: string },
    line: Omit<CartLine, 'key'>
  ) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  /** A new idempotency key, e.g. after the customer edits the cart. */
  renewSubmission: () => void
  /** Refresh prices and availability from the latest menu. */
  reprice: (menu: OutletMenu, unavailableLines?: number[]) => void
}

export const useCartStore = create<CartState>()((set, get) => {
  const commit = (cart: Cart | null) => {
    save(cart)
    set({ cart })
  }
  return {
    cart: typeof window === 'undefined' ? null : load(),
    add: (scope, line) => {
      const current = get().cart
      const sameScope =
        current &&
        current.slug === scope.slug &&
        current.outletId === scope.outletId
      const cart: Cart = sameScope
        ? { ...current, submissionId: newId() }
        : { ...scope, submissionId: newId(), lines: [] }
      const key = lineKey(
        line.productId,
        line.variantId,
        line.modifierIds,
        line.notes
      )
      const existing = cart.lines.find((l) => l.key === key)
      const room = MAX_CART_QUANTITY - cartQuantity(cart)
      if (existing) {
        const quantity = Math.min(
          existing.quantity + line.quantity,
          MAX_LINE_QUANTITY,
          existing.quantity + room
        )
        cart.lines = cart.lines.map((l) =>
          l.key === key ? { ...l, quantity } : l
        )
      } else if (cart.lines.length < MAX_CART_LINES && room > 0) {
        cart.lines = [
          ...cart.lines,
          { ...line, key, quantity: Math.min(line.quantity, room) },
        ]
      }
      commit(cart)
    },
    setQuantity: (key, quantity) => {
      const current = get().cart
      if (!current) return
      if (quantity <= 0) return get().remove(key)
      const others =
        cartQuantity(current) -
        (current.lines.find((l) => l.key === key)?.quantity ?? 0)
      const bounded = Math.min(
        quantity,
        MAX_LINE_QUANTITY,
        MAX_CART_QUANTITY - others
      )
      commit({
        ...current,
        submissionId: newId(),
        lines: current.lines.map((l) =>
          l.key === key ? { ...l, quantity: bounded } : l
        ),
      })
    },
    remove: (key) => {
      const current = get().cart
      if (!current) return
      const lines = current.lines.filter((l) => l.key !== key)
      commit(lines.length ? { ...current, submissionId: newId(), lines } : null)
    },
    clear: () => commit(null),
    renewSubmission: () => {
      const current = get().cart
      if (current) commit({ ...current, submissionId: newId() })
    },
    reprice: (menu, unavailableLines = []) => {
      const current = get().cart
      if (!current) return
      const lines = repriceLines(current.lines, menu).map((line, index) =>
        unavailableLines.includes(index) ? { ...line, unavailable: true } : line
      )
      commit({ ...current, submissionId: newId(), lines })
    },
  }
})

/** The cart for this store and outlet, or nothing. */
export function useOutletCart(slug: string, outletId: string) {
  return useCartStore((state) =>
    state.cart && state.cart.slug === slug && state.cart.outletId === outletId
      ? state.cart
      : null
  )
}

/** Unit price as the menu shows it: base + variant + chosen options. */
export function unitPriceMinor(
  product: MenuProduct,
  variantId: string | null,
  modifierIds: string[]
) {
  const variant = product.variants.find((v) => v.id === variantId)
  const options = product.modifierGroups
    .flatMap((g) => g.options)
    .filter((o) => modifierIds.includes(o.id))
  return (
    product.priceMinor +
    (variant?.priceDeltaMinor ?? 0) +
    options.reduce((sum, o) => sum + o.priceDeltaMinor, 0)
  )
}

/** Rounded half up on the subtotal, like the cashier's register. An estimate only. */
export function estimateTotals(
  subtotalMinor: number,
  pricing: { taxRate: number; serviceChargeRate: number } | null
) {
  const share = (rate: number) =>
    Math.floor((subtotalMinor * Math.round(rate * 100) + 5000) / 10000)
  const taxMinor = pricing ? share(pricing.taxRate) : 0
  const serviceMinor = pricing ? share(pricing.serviceChargeRate) : 0
  return {
    subtotalMinor,
    taxMinor,
    serviceMinor,
    totalMinor: subtotalMinor + taxMinor + serviceMinor,
  }
}

/** Lines re-read against the menu: today's prices, or flagged when no longer offered. */
export function repriceLines(lines: CartLine[], menu: OutletMenu): CartLine[] {
  const products = new Map(
    menu.categories.flatMap((c) => c.products).map((p) => [p.id, p])
  )
  return lines.map((line) => {
    const product = products.get(line.productId)
    const variant = product?.variants.find((v) => v.id === line.variantId)
    const options = product?.modifierGroups.flatMap((g) => g.options) ?? []
    const chosen = options.filter((o) => line.modifierIds.includes(o.id))
    const offered =
      product &&
      !product.soldOut &&
      (line.variantId === null || variant?.available) &&
      chosen.length === line.modifierIds.length &&
      chosen.every((o) => o.available)
    if (!offered) return { ...line, unavailable: true }
    return {
      ...line,
      name: product.name,
      variantName: variant?.name ?? null,
      optionNames: chosen.map((o) => o.name),
      unitPriceMinor: unitPriceMinor(product, line.variantId, line.modifierIds),
      unavailable: false,
    }
  })
}
