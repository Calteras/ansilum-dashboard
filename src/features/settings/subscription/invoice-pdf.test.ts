import { beforeEach, expect, it, vi } from 'vitest'
import { downloadInvoicePdf } from './invoice-pdf'
import type { Invoice } from './subscription.types'

const doc = vi.hoisted(() => ({
  texts: [] as string[],
  save: vi.fn(),
}))
vi.mock('jspdf', () => ({
  jsPDF: class {
    text(value: string | string[]) {
      doc.texts.push(...([] as string[]).concat(value))
    }
    splitTextToSize(value: string) {
      return [value]
    }
    save(name: string) {
      doc.save(name)
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}
    setFillColor() {}
    setLineWidth() {}
    line() {}
    rect() {}
  },
}))

const invoice: Invoice = {
  invoiceNumber: 'INV-2026-000001',
  orderNumber: 'SUB-20261014-abc',
  status: 'PAID',
  issuedAt: '2026-10-14T00:05:00.000Z',
  currency: 'IDR',
  seller: {
    name: 'Ansilum',
    address: 'Jakarta',
    email: 'billing@ansilum.test',
    taxId: '01.234.567.8-901.000',
  },
  customer: { name: 'Owner', email: 'owner@example.test', business: 'Kopi' },
  items: [
    {
      tier: 'STANDARD',
      planName: 'Standard',
      billingCycle: 'MONTHLY',
      renewal: true,
      periodStart: '2026-10-14T00:00:00.000Z',
      periodEnd: '2026-11-14T00:00:00.000Z',
      amount: 99000,
    },
  ],
  subtotal: 99000,
  total: 99000,
  payment: {
    paymentType: 'CREDIT_CARD',
    card: { brand: 'visa', last4: '1114' },
    paidAt: '2026-10-14T00:05:00.000Z',
    transactionId: 'trx-1',
  },
}

const en = (_id: string, english: string) => english

beforeEach(() => {
  doc.texts.length = 0
  doc.save.mockClear()
})

it('writes the invoice details and saves it under its number', () => {
  downloadInvoicePdf(invoice, en)
  expect(doc.save).toHaveBeenCalledWith('INV-2026-000001.pdf')
  const text = doc.texts.join('\n')
  expect(text).toContain('INV-2026-000001')
  expect(text).toContain('Kopi')
  expect(text).toContain('Standard plan (monthly) - renewal')
  expect(text).toContain('Rp99,000')
  expect(text).toContain('Visa ending in 1114')
  expect(text).toContain('Tax ID: 01.234.567.8-901.000')
  // Built-in PDF fonts are Latin-1 only.
  expect([...text].every((char) => char.charCodeAt(0) <= 0xff)).toBe(true)
})
