// Receipt template contract v1, as stored on the tenant configuration
// (ansilum-be docs/RECEIPT_TEMPLATE.md). Read the same way as the POS app's
// ReceiptTemplate.fromJson: missing or odd keys fall back one by one.
import type { ReceiptLanguage } from './receipt-text'

export interface ReceiptTemplate {
  version: 1
  language: ReceiptLanguage
  header: {
    showLogo: boolean
    businessName: string
    showOutletName: boolean
    showAddress: boolean
    showPhone: boolean
    taxId: string
    note: string
  }
  transaction: {
    showCashier: boolean
    showCustomer: boolean
    showTable: boolean
    showOrderType: boolean
  }
  items: {
    showModifiers: boolean
    showNotes: boolean
    showUnitPrice: boolean
  }
  footer: {
    thankYou: string
    policy: string
    social: string
    website: string
    note: string
    showQr: boolean
    qrValue: string
    showPoweredBy: boolean
  }
}

export const DEFAULT_THANK_YOU = 'Terima kasih atas kunjungan Anda'

/** Text limits, matching the backend's RECEIPT_TEXT_LIMITS. */
export const RECEIPT_TEXT_LIMITS = {
  businessName: 80,
  taxId: 40,
  headerNote: 240,
  thankYou: 120,
  policy: 240,
  social: 120,
  website: 120,
  footerNote: 240,
  qrValue: 300,
} as const

export function defaultReceiptTemplate(): ReceiptTemplate {
  return {
    version: 1,
    language: 'id',
    header: {
      showLogo: true,
      businessName: '',
      showOutletName: true,
      showAddress: true,
      showPhone: true,
      taxId: '',
      note: '',
    },
    transaction: {
      showCashier: true,
      showCustomer: true,
      showTable: true,
      showOrderType: true,
    },
    items: { showModifiers: true, showNotes: true, showUnitPrice: true },
    footer: {
      thankYou: DEFAULT_THANK_YOU,
      policy: '',
      social: '',
      website: '',
      note: '',
      showQr: false,
      qrValue: '',
      showPoweredBy: true,
    },
  }
}

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const bool = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** A stored template (or null) as a complete template. */
export function readReceiptTemplate(json: unknown): ReceiptTemplate {
  const defaults = defaultReceiptTemplate()
  if (!isObject(json)) return defaults
  const section = (key: string): Json =>
    isObject(json[key]) ? (json[key] as Json) : {}
  const header = section('header')
  const transaction = section('transaction')
  const items = section('items')
  const footer = section('footer')
  return {
    version: 1,
    language: json.language === 'en' ? 'en' : 'id',
    header: {
      showLogo: bool(header.showLogo, true),
      businessName: text(header.businessName),
      showOutletName: bool(header.showOutletName, true),
      showAddress: bool(header.showAddress, true),
      showPhone: bool(header.showPhone, true),
      taxId: text(header.taxId),
      note: text(header.note),
    },
    transaction: {
      showCashier: bool(transaction.showCashier, true),
      showCustomer: bool(transaction.showCustomer, true),
      showTable: bool(transaction.showTable, true),
      showOrderType: bool(transaction.showOrderType, true),
    },
    items: {
      showModifiers: bool(items.showModifiers, true),
      showNotes: bool(items.showNotes, true),
      showUnitPrice: bool(items.showUnitPrice, true),
    },
    footer: {
      thankYou:
        'thankYou' in footer ? text(footer.thankYou) : DEFAULT_THANK_YOU,
      policy: text(footer.policy),
      social: text(footer.social),
      website: text(footer.website),
      note: text(footer.note),
      showQr: bool(footer.showQr, false),
      qrValue: text(footer.qrValue),
      showPoweredBy: bool(footer.showPoweredBy, true),
    },
  }
}
