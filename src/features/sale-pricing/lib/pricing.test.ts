import { describe, expect, it } from 'vitest'
import type { Promotion, ServiceCharge, TaxConfig } from '../api/pricing.types'
import {
  allocate,
  billPreview,
  dateToIso,
  namedRegisterRates,
  previewPolicy,
  pricingErrorMessage,
  promotionBenefit,
  promotionFormDefaults,
  promotionRequest,
  promotionState,
  readPricingSettings,
  registerBill,
  taxFormDefaults,
  taxRequest,
  usageSummary,
  weekdaysLabel,
} from './pricing'

const en = (_id: string, english: string) => english
const now = Date.parse('2026-10-28T07:00:00.000Z')
const day = 24 * 60 * 60 * 1000

const promotion = (overrides: Partial<Promotion> = {}): Promotion => ({
  id: 'p1',
  tenantId: 't1',
  code: 'HEMAT10',
  name: '10% off',
  description: null,
  discountType: 'PERCENTAGE',
  value: '10.00',
  minPurchase: null,
  maxDiscount: null,
  validFrom: new Date(now - day).toISOString(),
  validUntil: null,
  usageLimit: null,
  usedCount: 0,
  isActive: true,
  rules: {},
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const tax = (overrides: Partial<TaxConfig> = {}): TaxConfig => ({
  id: 'tax',
  tenantId: 't1',
  name: 'PB1',
  rate: '10.00',
  isInclusive: false,
  isActive: true,
  rules: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const service = (overrides: Partial<ServiceCharge> = {}): ServiceCharge => ({
  id: 'svc',
  tenantId: 't1',
  name: 'Service',
  rate: '5.00',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const settings = readPricingSettings({ customSettings: {} })

describe('readPricingSettings', () => {
  it('fills in the server defaults', () => {
    expect(settings).toEqual({
      controls: {
        maxManualPercent: 100,
        allowPriceOverride: true,
        requireReason: false,
      },
      registerTaxPercent: null,
      registerServicePercent: null,
      timezone: 'Asia/Jakarta',
    })
  })

  it('reads stored controls, register rates and the business time zone', () => {
    expect(
      readPricingSettings({
        customSettings: {
          taxPercentage: '11',
          serviceChargePercentage: 5,
          timezone: 'Asia/Makassar',
          pricingControls: { maxManualPercent: 10, requireReason: true },
        },
      })
    ).toMatchObject({
      controls: { maxManualPercent: 10, requireReason: true },
      registerTaxPercent: 11,
      registerServicePercent: 5,
      timezone: 'Asia/Makassar',
    })
  })
})

describe('promotionState', () => {
  it('follows activity, window and capacity in that order', () => {
    expect(promotionState(promotion(), now)).toBe('running')
    expect(promotionState(promotion({ isActive: false }), now)).toBe('inactive')
    expect(
      promotionState(
        promotion({ validFrom: new Date(now + day).toISOString() }),
        now
      )
    ).toBe('scheduled')
    expect(
      promotionState(
        promotion({ validUntil: new Date(now - 1).toISOString() }),
        now
      )
    ).toBe('ended')
    expect(
      promotionState(promotion({ usageLimit: 5, usedCount: 5 }), now)
    ).toBe('usedUp')
  })
})

describe('promotionBenefit', () => {
  it('describes each promotion type', () => {
    expect(promotionBenefit(promotion(), en)).toBe('10%')
    expect(
      promotionBenefit(
        promotion({
          discountType: 'BUY_X_GET_Y',
          value: '100',
          rules: { buyQuantity: 2, getQuantity: 1 },
        }),
        en
      )
    ).toBe('Buy 2, get 1 free')
    expect(
      promotionBenefit(
        promotion({
          discountType: 'BUY_X_GET_Y',
          value: '50',
          rules: { buyQuantity: 1, getQuantity: 1 },
        }),
        en
      )
    ).toBe('Buy 1, get 1 at 50% off')
  })
})

describe('weekdaysLabel', () => {
  it('compresses runs and lists the rest, Monday first', () => {
    expect(weekdaysLabel([0, 1, 2, 3, 4, 5, 6], en)).toBe('Every day')
    expect(weekdaysLabel([5, 1, 2, 3, 4], en)).toBe('Mon–Fri')
    expect(weekdaysLabel([1, 3], en)).toBe('Mon, Wed')
    expect(weekdaysLabel([6, 0], en)).toBe('Sat, Sun')
  })
})

describe('promotionRequest', () => {
  it('keeps rules the form does not edit and drops unset ones', () => {
    const stored = promotion({
      rules: {
        customerTags: ['VIP'],
        channels: ['POS'],
        perCustomerLimit: 2,
        stackable: false,
      },
    })
    const values = promotionFormDefaults(stored, '2026-10-28')
    const request = promotionRequest(
      { ...values, perCustomerLimit: '', stackable: true },
      stored,
      'Asia/Jakarta'
    )
    expect(request.rules).toEqual({ customerTags: ['VIP'], channels: ['POS'] })
    // An untouched start date keeps the stored instant.
    expect(request.validFrom).toBe(stored.validFrom)
    expect(request.validUntil).toBeNull()
    expect(request.value).toBe(10)
  })

  it('builds quantity, schedule and automatic rules', () => {
    const values = promotionFormDefaults(undefined, '2026-11-01')
    const request = promotionRequest(
      {
        ...values,
        name: ' Happy hour ',
        code: 'happy',
        type: 'BUY_X_GET_Y',
        value: '100',
        buyQuantity: '2',
        getQuantity: '1',
        maxDiscount: '5000',
        scheduled: true,
        weekdays: [5, 1],
        startTime: '14:00',
        endTime: '00:00',
        automatic: true,
        priority: '5',
        paymentMethods: ['QRIS'],
        budgetAmount: '500000',
      },
      undefined,
      'Asia/Jakarta'
    )
    expect(request).toMatchObject({
      name: 'Happy hour',
      code: 'HAPPY',
      discountType: 'BUY_X_GET_Y',
      value: 100,
      // A cap only applies to percent-off promotions.
      maxDiscount: null,
      description: null,
    })
    expect(request.rules).toEqual({
      buyQuantity: 2,
      getQuantity: 1,
      automatic: true,
      priority: 5,
      paymentMethods: ['QRIS'],
      budgetAmount: 500000,
      schedule: {
        timezone: 'Asia/Jakarta',
        weekdays: [1, 5],
        startMinute: 840,
        endMinute: 1440,
      },
    })
    expect(new Date(request.validFrom).getDate()).toBe(1)
  })

  it('reads a comma as the decimal mark', () => {
    const values = promotionFormDefaults(undefined, '2026-11-01')
    expect(
      promotionRequest({ ...values, value: '12,5' }, undefined, 'Asia/Jakarta')
        .value
    ).toBe(12.5)
  })
})

describe('dateToIso', () => {
  it('turns a date into the start or end of that local day', () => {
    const start = new Date(dateToIso('2026-12-31', 'start')!)
    const end = new Date(dateToIso('2026-12-31', 'end')!)
    expect([start.getHours(), start.getMinutes()]).toEqual([0, 0])
    expect([end.getHours(), end.getMinutes(), end.getDate()]).toEqual([
      23, 59, 31,
    ])
    expect(dateToIso('', 'end')).toBeNull()
  })
})

describe('taxRequest', () => {
  it('never sends tax on service for an included tax', () => {
    const request = taxRequest({
      ...taxFormDefaults(),
      name: 'PPN',
      rate: '11',
      inclusive: true,
      taxService: true,
      exemptProductIds: ['water'],
    })
    expect(request).toEqual({
      name: 'PPN',
      rate: 11,
      isInclusive: true,
      rules: { exemptProductIds: ['water'] },
    })
  })
})

describe('billPreview (server pricing v2)', () => {
  const price = (
    taxes: TaxConfig[],
    services: ServiceCharge[],
    amount: number
  ) =>
    billPreview(
      previewPolicy({ taxes, services, settings, outletId: 'o1', now }),
      amount
    )

  it('adds service on the price, then added tax on the same base', () => {
    const bill = price([tax()], [service()], 100000)
    expect(bill.services[0].amount).toBe(5000)
    expect(bill.addedTax[0].amount).toBe(10000)
    expect(bill.total).toBe(115000)
  })

  it('charges tax on service only when asked', () => {
    const bill = price(
      [tax({ rules: { taxService: true } })],
      [service()],
      100000
    )
    expect(bill.addedTax[0].amount).toBe(10500)
    expect(bill.total).toBe(115500)
  })

  it('extracts included tax and charges service on the price without it', () => {
    const bill = price(
      [tax({ rate: '11', isInclusive: true })],
      [service()],
      111000
    )
    expect(bill.includedTax[0].amount).toBe(11000)
    expect(bill.services[0].amount).toBe(5000)
    expect(bill.total).toBe(116000)
  })

  it('leaves out other outlets, future rates and product-only taxes', () => {
    const policy = previewPolicy({
      taxes: [
        tax(),
        tax({ id: 'elsewhere', rules: { outletIds: ['o2'] } }),
        tax({
          id: 'next-year',
          rules: { validFrom: new Date(now + day).toISOString() },
        }),
        tax({ id: 'drinks', name: 'Drinks', rules: { categoryIds: ['c1'] } }),
      ],
      services: [],
      settings,
      outletId: 'o1',
      now,
    })
    expect(policy.taxes.map((t) => t.id)).toEqual(['tax'])
    expect(policy.productTaxes.map((t) => t.id)).toEqual(['drinks'])
  })

  it('uses the older single rates only while no named rows exist', () => {
    const legacy = readPricingSettings({
      customSettings: { taxPercentage: 10, serviceChargePercentage: 5 },
    })
    const policy = previewPolicy({
      taxes: [],
      services: [service({ isActive: false })],
      settings: legacy,
      outletId: 'o1',
      now,
    })
    expect(policy.legacyTax).toBe(true)
    expect(policy.taxes[0].rate).toBe(1000)
    // An inactive named row means no service charge, not the old rate.
    expect(policy.legacyService).toBe(false)
    expect(policy.services).toEqual([])
  })

  it('splits included tax between rates by largest remainder', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33])
    expect(allocate(0, [0, 0])).toEqual([0, 0])
  })
})

describe('register rates', () => {
  it('mirrors only taxes a current register can add to every item', () => {
    expect(
      namedRegisterRates(
        [
          tax(),
          tax({ id: 'pb1', rate: '1.5' }),
          tax({ id: 'incl', isInclusive: true }),
          tax({ id: 'scoped', rules: { outletIds: ['o1'] } }),
          tax({ id: 'off', isActive: false }),
        ],
        [service(), service({ id: 'off', isActive: false })]
      )
    ).toEqual({ tax: 11.5, service: 5 })
    expect(namedRegisterRates([], [])).toEqual({ tax: null, service: null })
  })

  it('prices a current register line with both rates on the price', () => {
    expect(registerBill(100000, { tax: 10, service: 5 })).toEqual({
      tax: 10000,
      service: 5000,
      total: 115000,
    })
  })
})

describe('usageSummary', () => {
  it('counts holds and redemptions and leaves unknown amounts out', () => {
    const summary = usageSummary([
      {
        status: 'REDEEMED',
        benefitUnknown: false,
        _count: { _all: 3 },
        _sum: { amount: '15000' },
      },
      {
        status: 'REDEEMED',
        benefitUnknown: true,
        _count: { _all: 2 },
        _sum: { amount: '0' },
      },
      {
        status: 'RESERVED',
        benefitUnknown: false,
        _count: { _all: 1 },
        _sum: { amount: '5000' },
      },
      {
        status: 'RELEASED',
        benefitUnknown: false,
        _count: { _all: 4 },
        _sum: { amount: '20000' },
      },
    ])
    expect(summary).toEqual({
      redeemed: { count: 5, amount: 15000 },
      reserved: { count: 1, amount: 5000 },
      released: 4,
      unknownBenefit: 2,
      committed: 20000,
    })
  })
})

describe('pricingErrorMessage', () => {
  it('translates known server messages and passes others through', () => {
    const id = (indonesian: string) => indonesian
    expect(pricingErrorMessage('Combined tax rate exceeds 100%', id)).toBe(
      'Jumlah tarif pajak aktif tidak boleh lebih dari 100%.'
    )
    expect(pricingErrorMessage('Something else', id)).toBe('Something else')
  })
})
