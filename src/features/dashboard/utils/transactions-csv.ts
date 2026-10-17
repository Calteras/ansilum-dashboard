import { format, parseISO } from 'date-fns'
import type { Transaction } from '../api/dashboard.types'

const HEADERS = [
  'Transaction no',
  'Date',
  'Status',
  'Customer',
  'Table',
  'Items',
  'Subtotal',
  'Discount',
  'Tax',
  'Total',
  'Payment methods',
  'Cashier',
]

/** Quotes every cell and neutralises spreadsheet formulas in user-entered text. */
function cell(value: string | number | null | undefined): string {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const lines = transactions.map((tx) =>
    [
      tx.transactionNo,
      format(parseISO(tx.transactionDate), 'yyyy-MM-dd HH:mm'),
      tx.status,
      tx.customerName,
      tx.tableNumber,
      tx.items.reduce((sum, item) => sum + item.quantity, 0),
      Number(tx.subtotal),
      Number(tx.discountAmount),
      Number(tx.taxAmount),
      Number(tx.grandTotal),
      [...new Set(tx.payments.map((p) => p.paymentMethod))].join(' + '),
      tx.cashier?.name,
    ]
      .map(cell)
      .join(',')
  )
  return [HEADERS.map(cell).join(','), ...lines].join('\r\n')
}

export function downloadFile(fileName: string, content: string, type: string) {
  // BOM so spreadsheet apps read the file as UTF-8.
  const blob = new Blob(['﻿', content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
