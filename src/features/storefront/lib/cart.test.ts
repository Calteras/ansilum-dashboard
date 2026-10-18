import { beforeEach, describe, expect, it } from 'vitest'
import { latte, menu } from '../test-fixtures'
import '../test-storage'
import { brandStyle } from './brand'
import {
  cartQuantity,
  estimateTotals,
  repriceLines,
  unitPriceMinor,
  useCartStore,
  type CartLine,
} from './cart'

const line = (
  overrides: Partial<Omit<CartLine, 'key'>> = {}
): Omit<CartLine, 'key'> => ({
  productId: 'latte',
  variantId: 'large',
  modifierIds: ['ice'],
  quantity: 1,
  notes: '',
  name: 'Caffe Latte',
  variantName: 'Large',
  optionNames: ['Ice'],
  unitPriceMinor: 3_500_000,
  ...overrides,
})

const scope = { slug: 'kopi-senja', outletId: 'lumajang' }

describe('storefront cart', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useCartStore.getState().clear()
  })

  it('merges identical choices and keeps different ones apart', () => {
    const { add } = useCartStore.getState()
    add(scope, line())
    add(scope, line({ quantity: 2 }))
    add(scope, line({ modifierIds: ['hot'] }))
    add(scope, line({ notes: 'less sugar' }))
    const cart = useCartStore.getState().cart!
    expect(cart.lines).toHaveLength(3)
    expect(cart.lines[0].quantity).toBe(3)
    expect(cartQuantity(cart)).toBe(5)
  })

  it('belongs to one outlet: adding for another outlet starts over', () => {
    const { add } = useCartStore.getState()
    add(scope, line())
    add({ ...scope, outletId: 'malang' }, line({ quantity: 2 }))
    const cart = useCartStore.getState().cart!
    expect(cart.outletId).toBe('malang')
    expect(cartQuantity(cart)).toBe(2)
  })

  it('caps quantities like the server does', () => {
    const { add, setQuantity } = useCartStore.getState()
    add(scope, line({ quantity: 49 }))
    add(scope, line({ quantity: 10 }))
    expect(useCartStore.getState().cart!.lines[0].quantity).toBe(50)
    add(scope, line({ modifierIds: ['hot'], quantity: 50 }))
    add(scope, line({ variantId: 'regular', quantity: 5 }))
    expect(cartQuantity(useCartStore.getState().cart)).toBe(100)
    setQuantity(useCartStore.getState().cart!.lines[1].key, 999)
    expect(cartQuantity(useCartStore.getState().cart)).toBe(100)
  })

  it('renews the submission key whenever the cart changes', () => {
    const { add, setQuantity } = useCartStore.getState()
    add(scope, line())
    const first = useCartStore.getState().cart!.submissionId
    setQuantity(useCartStore.getState().cart!.lines[0].key, 2)
    expect(useCartStore.getState().cart!.submissionId).not.toBe(first)
  })

  it('survives a reload', async () => {
    useCartStore.getState().add(scope, line())
    const stored = JSON.parse(
      window.localStorage.getItem('ansilum.storefront.cart')!
    )
    expect(stored.lines[0].productId).toBe('latte')
  })

  it('reprices from the menu and flags what is no longer offered', () => {
    const lines = [
      { ...line(), key: 'a', unitPriceMinor: 1 },
      { ...line({ modifierIds: ['ice', 'oat'] }), key: 'b' },
      { ...line({ productId: 'gone' }), key: 'c' },
    ]
    const [kept, option, product] = repriceLines(lines, menu)
    expect(kept).toMatchObject({
      unitPriceMinor: 3_500_000,
      unavailable: false,
    })
    expect(option.unavailable).toBe(true)
    expect(product.unavailable).toBe(true)
  })
})

describe('storefront price estimate', () => {
  it('adds variant and option prices to the base price', () => {
    expect(unitPriceMinor(latte, 'large', ['ice', 'shot'])).toBe(4_100_000)
    expect(unitPriceMinor(latte, null, [])).toBe(3_000_000)
  })

  it('rounds tax half up on the subtotal, like the register', () => {
    expect(
      estimateTotals(6_300_000, { taxRate: 10, serviceChargeRate: 0 })
    ).toEqual({
      subtotalMinor: 6_300_000,
      taxMinor: 630_000,
      serviceMinor: 0,
      totalMinor: 6_930_000,
    })
    expect(
      estimateTotals(105, { taxRate: 10, serviceChargeRate: 5.5 }).taxMinor
    ).toBe(11)
    expect(estimateTotals(1000, null).totalMinor).toBe(1000)
  })
})

describe('storefront brand colour', () => {
  it('picks readable text on the merchant colour', () => {
    expect(brandStyle('#7a3e1d')).toMatchObject({
      '--store-on-accent': '#ffffff',
      '--store-accent-text': '#7a3e1d',
    })
    expect(brandStyle('#ffd84d')).toMatchObject({
      '--store-on-accent': '#111418',
      '--store-accent-text': '#111418',
    })
    expect(brandStyle(null)).toMatchObject({ '--store-accent': '#111418' })
    expect(brandStyle('javascript:alert(1)')).toMatchObject({
      '--store-accent': '#111418',
    })
    expect(brandStyle('#7a3e1d', true)).toMatchObject({
      '--store-accent-text': '#ffffff',
    })
  })
})
