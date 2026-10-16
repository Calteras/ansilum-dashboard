import { describe, expect, it } from 'vitest'
import cases from './__fixtures__/receipt_cases.json'
import type { ReceiptDocument, ReceiptMerchant } from './receipt-document'
import {
  DEFAULT_CAPABILITIES,
  PAPER_58,
  PAPER_80,
  ReceiptLayout,
  type PrinterCapabilities,
} from './receipt-layout'
import { receiptLinesToText } from './receipt-lines'
import { readReceiptTemplate } from './receipt-template'
import {
  formatAmount,
  formatDateTime,
  formatRate,
  formatRow,
  labelValue,
  printable,
  printableLine,
  printableParagraphs,
  wrapText,
} from './receipt-text'

// The fixtures are copied from the POS app (test/receipt/fixtures); both
// layouts must produce exactly these lines.
const expected = import.meta.glob('./__fixtures__/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface Fixture {
  name: string
  copy?: boolean
  capabilities?: Partial<PrinterCapabilities>
  merchant: ReceiptMerchant
  template: unknown
  document: ReceiptDocument
}

describe('receipt layout fixtures (shared with the POS app)', () => {
  for (const fixture of cases as Fixture[]) {
    for (const columns of [32, 48]) {
      it(`${fixture.name} at ${columns} columns`, () => {
        const layout = new ReceiptLayout(columns <= 32 ? PAPER_58 : PAPER_80, {
          ...DEFAULT_CAPABILITIES,
          ...fixture.capabilities,
        })
        const lines = layout.receipt(
          fixture.document,
          fixture.merchant,
          readReceiptTemplate(fixture.template),
          fixture.copy === true
        )
        expect(receiptLinesToText(lines)).toBe(
          expected[`./__fixtures__/${fixture.name}.${columns}.txt`]
        )
      })
    }
  }
})

describe('readReceiptTemplate', () => {
  it('fills every missing or odd key with its default', () => {
    const template = readReceiptTemplate({
      language: 'en',
      header: { showLogo: false, taxId: ' 01.234 ' },
      transaction: { showCashier: 'yes' },
      footer: { thankYou: '' },
    })
    expect(template.language).toBe('en')
    expect(template.header.showLogo).toBe(false)
    expect(template.header.taxId).toBe('01.234')
    expect(template.header.showAddress).toBe(true)
    expect(template.transaction.showCashier).toBe(true)
    expect(template.footer.thankYou).toBe('')
    expect(readReceiptTemplate(null).footer.thankYou).toBe(
      'Terima kasih atas kunjungan Anda'
    )
  })
})

describe('text helpers', () => {
  it('converts text to what thermal printers print', () => {
    expect(printable('Café “crème” – brûlée…')).toBe('Cafe "creme" - brulee...')
    expect(printable('Kopi ☕️ 2×')).toBe('Kopi  2x')
    expect(printable('Straße Ærø')).toBe('Strasse AEro')
    expect(printable('拉面')).toBe('??')
    expect(printable('a\nb\tc')).toBe('a\nb c')
    expect(printableLine('  a \n  b  ')).toBe('a b')
    expect(printableParagraphs('one\n\n two ')).toEqual(['one', 'two'])
  })

  it('wraps and aligns like the POS app', () => {
    expect(wrapText('aa bb cc', 5)).toEqual(['aa bb', 'cc'])
    expect(wrapText('abcdefgh', 3)).toEqual(['abc', 'def', 'gh'])
    expect(formatRow('Nasi goreng kampung', '35.000', 20)).toEqual([
      'Nasi goreng   35.000',
      'kampung',
    ])
    expect(formatRow('Total', '1.234.567.890.123', 20)).toEqual([
      'Total',
      '   1.234.567.890.123',
    ])
    expect(labelValue('Pelanggan', 'Budi Santoso', 12)).toEqual([
      'Pelanggan',
      'Budi Santoso',
    ])
  })

  it('formats amounts, rates and dates in both languages', () => {
    expect(formatAmount(1250000, 'id')).toBe('12.500')
    expect(formatAmount(1250000, 'en')).toBe('12,500')
    expect(formatAmount(-500000, 'id', true)).toBe('-Rp5.000')
    expect(formatAmount(13592291790, 'id')).toBe('135.922.917,90')
    expect(formatRate(1050, 'id')).toBe('10,5%')
    expect(formatRate(1025, 'en')).toBe('10.25%')
    const time = new Date(2026, 4, 6, 9, 3)
    expect(formatDateTime(time, 'id')).toBe('6 Mei 2026 09.03')
    expect(formatDateTime(time, 'en')).toBe('6 May 2026 09:03')
  })
})
