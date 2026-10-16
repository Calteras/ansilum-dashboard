// The semantic receipt, in the fixture format shared with the POS app
// (ReceiptDocument.toJson / ReceiptMerchant.toJson). Amounts are minor units.
import type { OrderType, PaymentMethod } from './receipt-labels'

export interface ReceiptMerchant {
  businessName: string
  outletName?: string
  address?: string
  phone?: string
  hasLogo?: boolean
}

export interface ReceiptItem {
  name: string
  quantity: number
  unitPriceMinor: number
  totalMinor: number
  variant?: string
  modifiers?: string[]
  note?: string
}

export interface ReceiptPayment {
  method: PaymentMethod
  amountMinor: number
  receivedMinor?: number
}

export interface ReceiptLoyalty {
  earnedPoints?: number
  redeemedPoints?: number
  projectedPoints?: number
  rulesUnavailable?: boolean
}

export interface ReceiptDocument {
  id: string
  number?: string
  /** Local ISO 8601 without an offset, such as 2026-10-16T19:05:00. */
  issuedAt: string
  items: ReceiptItem[]
  subtotalMinor: number
  discountMinor?: number
  taxMinor?: number
  taxBasisPoints?: number
  serviceMinor?: number
  serviceBasisPoints?: number
  totalMinor: number
  payments?: ReceiptPayment[]
  changeMinor?: number
  remainingMinor?: number
  cashierName?: string
  customerName?: string
  tableNumber?: string
  orderType?: OrderType
  rewardName?: string
  loyalty?: ReceiptLoyalty
}

/**
 * The sale the preview shows: the same sample the POS app prints as its test
 * receipt (ReceiptSamples.sale). Not a real sale.
 */
export const SAMPLE_RECEIPT: ReceiptDocument = {
  id: 'contoh',
  number: 'CONTOH-0001',
  issuedAt: '2026-10-16T19:05:00',
  cashierName: 'Ayu',
  customerName: 'Budi Santoso',
  tableNumber: '4',
  orderType: 'dineIn',
  items: [
    {
      name: 'Kopi susu gula aren',
      quantity: 2,
      unitPriceMinor: 2700000,
      totalMinor: 5400000,
      variant: 'Besar',
      modifiers: ['Extra shot', 'Gula 50%'],
      note: 'Es sedikit',
    },
    {
      name: 'Nasi goreng kampung',
      quantity: 1,
      unitPriceMinor: 3500000,
      totalMinor: 3500000,
    },
    {
      name: 'Air mineral',
      quantity: 3,
      unitPriceMinor: 500000,
      totalMinor: 1500000,
    },
  ],
  subtotalMinor: 10400000,
  discountMinor: 500000,
  taxMinor: 1144000,
  taxBasisPoints: 1100,
  serviceMinor: 520000,
  serviceBasisPoints: 500,
  totalMinor: 11564000,
  payments: [
    { method: 'cash', amountMinor: 11564000, receivedMinor: 12000000 },
  ],
  changeMinor: 436000,
}

/** The receipt number, or the last eight characters of the ID. */
export function displayNumber(document: ReceiptDocument): string {
  const number = document.number?.trim()
  if (number) return number
  const compact = document.id.replace(/-/g, '').toUpperCase()
  return compact.length <= 8 ? compact : compact.substring(compact.length - 8)
}
