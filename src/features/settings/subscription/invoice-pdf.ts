import { jsPDF } from 'jspdf'
import { formatMoney } from '@/lib/format'
import { formatDate } from '@/features/checkout/format'
import { brandLabel, cycleLabel, paymentMethodLabel } from './billing-labels'
import type { Invoice } from './subscription.types'

type Copy = (id: string, en: string) => string

const INK: [number, number, number] = [23, 43, 58]
const MUTED: [number, number, number] = [96, 112, 128]
const RULE: [number, number, number] = [221, 227, 232]
const BRAND: [number, number, number] = [21, 94, 89]

/** A4 invoice for one payment, saved as "<invoice number>.pdf". */
export function downloadInvoicePdf(invoice: Invoice, copy: Copy) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const left = 20
  const right = 190
  let y = 24

  const text = (
    value: string | string[],
    x: number,
    at: number,
    {
      size = 10,
      bold = false,
      color = INK,
      align = 'left' as 'left' | 'right',
    } = {}
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.text(value, x, at, { align })
  }
  const rule = (at: number) => {
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.3)
    doc.line(left, at, right, at)
  }

  // Header: seller and invoice number.
  text(invoice.seller.name, left, y, { size: 18, bold: true, color: BRAND })
  text(copy('INVOICE', 'INVOICE'), right, y, {
    size: 18,
    bold: true,
    align: 'right',
  })
  y += 7
  text(invoice.invoiceNumber, right, y, { color: MUTED, align: 'right' })
  const sellerLines = [
    invoice.seller.address,
    invoice.seller.email,
    invoice.seller.taxId &&
      `${copy('NPWP', 'Tax ID')}: ${invoice.seller.taxId}`,
  ].filter((line): line is string => !!line)
  for (const line of sellerLines.flatMap((l) => doc.splitTextToSize(l, 90))) {
    text(line, left, y, { color: MUTED })
    y += 5
  }
  y = Math.max(y, 31) + 8

  // Billed to and invoice details.
  const top = y
  text(copy('Ditagihkan kepada', 'Billed to'), left, y, {
    size: 9,
    bold: true,
    color: MUTED,
  })
  y += 6
  for (const line of [
    invoice.customer.business,
    invoice.customer.name,
    invoice.customer.email,
  ].filter((line): line is string => !!line)) {
    text(line, left, y)
    y += 5
  }
  let detailY = top
  const details: [string, string][] = [
    [copy('Tanggal terbit', 'Date issued'), formatDate(invoice.issuedAt)],
    [
      copy('Tanggal bayar', 'Date paid'),
      invoice.payment.paidAt ? formatDate(invoice.payment.paidAt) : '-',
    ],
    [copy('Nomor pesanan', 'Order number'), invoice.orderNumber.slice(0, 22)],
  ]
  for (const [label, value] of details) {
    text(label, 120, detailY, { size: 9, color: MUTED })
    text(value, right, detailY, { size: 9, align: 'right' })
    detailY += 6
  }
  y = Math.max(y, detailY) + 8

  // Line items.
  doc.setFillColor(243, 245, 247)
  doc.rect(left, y - 5, right - left, 9, 'F')
  text(copy('Deskripsi', 'Description'), left + 3, y + 1, {
    size: 9,
    bold: true,
  })
  text(copy('Jumlah', 'Amount'), right - 3, y + 1, {
    size: 9,
    bold: true,
    align: 'right',
  })
  y += 12
  for (const item of invoice.items) {
    const title = copy(
      `Paket ${item.planName} (${cycleLabel(copy, item.billingCycle).toLowerCase()})`,
      `${item.planName} plan (${cycleLabel(copy, item.billingCycle).toLowerCase()})`
    )
    text(
      item.renewal ? `${title} - ${copy('perpanjangan', 'renewal')}` : title,
      left + 3,
      y
    )
    text(formatMoney(item.amount), right - 3, y, { align: 'right' })
    if (item.periodStart && item.periodEnd) {
      y += 5
      text(
        `${formatDate(item.periodStart)} - ${formatDate(item.periodEnd)}`,
        left + 3,
        y,
        { size: 9, color: MUTED }
      )
    }
    y += 9
  }
  rule(y)
  y += 8
  text(copy('Subtotal', 'Subtotal'), 130, y, { color: MUTED })
  text(formatMoney(invoice.subtotal), right - 3, y, { align: 'right' })
  y += 8
  text(copy('Total', 'Total'), 130, y, { size: 12, bold: true })
  text(formatMoney(invoice.total), right - 3, y, {
    size: 12,
    bold: true,
    align: 'right',
  })
  y += 6
  text(
    invoice.status === 'REFUNDED'
      ? copy('Dikembalikan', 'Refunded')
      : copy('Lunas', 'Paid'),
    right - 3,
    y,
    { size: 9, bold: true, color: BRAND, align: 'right' }
  )
  y += 14

  // Payment.
  rule(y)
  y += 8
  text(copy('Pembayaran', 'Payment'), left, y, {
    size: 9,
    bold: true,
    color: MUTED,
  })
  y += 6
  const card = invoice.payment.card
  text(
    card
      ? copy(
          `${brandLabel(card.brand)} berakhiran ${card.last4}`,
          `${brandLabel(card.brand)} ending in ${card.last4}`
        )
      : paymentMethodLabel(copy, invoice.payment.paymentType),
    left,
    y
  )
  if (invoice.payment.transactionId) {
    y += 5
    text(
      `${copy('ID transaksi', 'Transaction ID')}: ${invoice.payment.transactionId}`,
      left,
      y,
      { size: 9, color: MUTED }
    )
  }

  text(
    copy(
      'Terima kasih telah berlangganan.',
      'Thank you for your subscription.'
    ),
    left,
    280,
    { size: 9, color: MUTED }
  )
  doc.save(`${invoice.invoiceNumber}.pdf`)
}
