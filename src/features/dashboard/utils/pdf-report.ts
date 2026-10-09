import { format, parseISO } from 'date-fns'
import { jsPDF } from 'jspdf'
import type { TransactionSummary } from '../api/dashboard.types'
import type { Transaction } from '../components/transactions/transactions-table'

interface BuildDashboardPdfOptions {
  outletName: string
  dateRangeLabel: string
  statusLabel: string
  summary: TransactionSummary | null
  transactions: Transaction[]
  itemsCogs?: {
    totalRevenue: string
    transactions: string
    grossProfit: string
    cogs: string
    profitMargin: string
    profitMarginNote?: string
    itemsSold: string
    ordersNote?: string
    uniqueCustomers: string
    returned?: string
    repeatRate: string
    pendingOrders: string
    topProducts: { name: string; revenue: string; sold: string }[]
  }
  generatedAt?: Date
}

const PAGE_HEIGHT = 297 // A4 mm
const LEFT_MARGIN = 14
const RIGHT_MARGIN = 14
const CONTENT_WIDTH = 210 - LEFT_MARGIN - RIGHT_MARGIN
const COLORS = {
  primary: '#111827',
  accent: '#2563EB',
  subtle: '#F3F4F6',
  border: '#E5E7EB',
  muted: '#6B7280',
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed <= PAGE_HEIGHT - 15) return y
  doc.addPage()
  return 20
}

function addKeyValue(doc: jsPDF, y: number, label: string, value: string) {
  doc.setFontSize(9.5)
  doc.setTextColor(COLORS.muted)
  doc.text(`${label}:`, LEFT_MARGIN, y)
  doc.setTextColor(COLORS.primary)
  doc.text(value || '-', LEFT_MARGIN + 42, y)
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(12)
  doc.setTextColor(COLORS.primary)
  doc.text(title, LEFT_MARGIN, y)
  doc.setDrawColor(COLORS.accent)
  doc.setLineWidth(0.6)
  doc.line(LEFT_MARGIN, y + 1, LEFT_MARGIN + 30, y + 1)
  doc.setLineWidth(0.2)
}

function drawCardBackground(doc: jsPDF, y: number, height: number) {
  doc.setFillColor(COLORS.subtle)
  doc.setDrawColor(COLORS.border)
  doc.roundedRect(
    LEFT_MARGIN - 2,
    y - 6,
    CONTENT_WIDTH + 4,
    height + 10,
    3,
    3,
    'FD'
  )
}

export function buildDashboardPdf({
  outletName,
  dateRangeLabel,
  statusLabel,
  summary,
  transactions,
  itemsCogs,
  generatedAt = new Date(),
}: BuildDashboardPdfOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 18

  // Header band
  doc.setFillColor(COLORS.primary)
  doc.setDrawColor(COLORS.primary)
  doc.roundedRect(LEFT_MARGIN - 4, y - 10, CONTENT_WIDTH + 8, 24, 3, 3, 'FD')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(15)
  doc.text('Dashboard Report', LEFT_MARGIN, y + 2)
  doc.setFontSize(9.5)
  doc.text(
    `Generated: ${format(generatedAt, 'dd MMM yyyy HH:mm')}`,
    LEFT_MARGIN,
    y + 9
  )
  doc.text(`Outlet: ${outletName || 'All'}`, LEFT_MARGIN + 90, y + 9)
  y += 22
  doc.setTextColor(COLORS.primary)

  // Meta chips
  doc.setFillColor(COLORS.accent)
  doc.setTextColor('#FFFFFF')
  doc.roundedRect(LEFT_MARGIN - 2, y - 6, 54, 10, 2, 2, 'FD')
  doc.text('Date Range', LEFT_MARGIN + 2, y)
  doc.setTextColor(COLORS.primary)
  doc.text(dateRangeLabel, LEFT_MARGIN + 60, y)
  y += 12
  doc.setFillColor(COLORS.accent)
  doc.setTextColor('#FFFFFF')
  doc.roundedRect(LEFT_MARGIN - 2, y - 6, 54, 10, 2, 2, 'FD')
  doc.text('Status', LEFT_MARGIN + 2, y)
  doc.setTextColor(COLORS.primary)
  doc.text(statusLabel, LEFT_MARGIN + 60, y)
  y += 12

  // Summary
  drawSectionTitle(doc, 'Summary', y)
  y += 8
  y = ensureSpace(doc, y, 36)
  drawCardBackground(doc, y, 26)
  addKeyValue(
    doc,
    y + 2,
    'Total transactions',
    summary?.totalTransactions?.toString() ?? '-'
  )
  addKeyValue(
    doc,
    y + 8,
    'Total sales',
    summary ? `Rp ${Number(summary.totalSales).toLocaleString()}` : '-'
  )
  addKeyValue(
    doc,
    y + 14,
    'Discount',
    summary ? `Rp ${Number(summary.totalDiscount).toLocaleString()}` : '-'
  )
  addKeyValue(
    doc,
    y + 20,
    'Tax',
    summary ? `Rp ${Number(summary.totalTax).toLocaleString()}` : '-'
  )
  y += 40

  if (itemsCogs) {
    drawSectionTitle(doc, 'Items & COGS', y)
    y += 8
    y = ensureSpace(doc, y, 52)
    drawCardBackground(doc, y, 44)
    addKeyValue(
      doc,
      y + 2,
      'Total revenue',
      `${itemsCogs.totalRevenue} (${itemsCogs.transactions})`
    )
    addKeyValue(
      doc,
      y + 8,
      'Gross profit / COGS',
      `${itemsCogs.grossProfit} / ${itemsCogs.cogs}`
    )
    addKeyValue(
      doc,
      y + 14,
      'Profit margin',
      itemsCogs.profitMarginNote
        ? `${itemsCogs.profitMargin} (${itemsCogs.profitMarginNote})`
        : itemsCogs.profitMargin
    )
    addKeyValue(
      doc,
      y + 20,
      'Items sold',
      itemsCogs.ordersNote
        ? `${itemsCogs.itemsSold} (${itemsCogs.ordersNote})`
        : itemsCogs.itemsSold
    )
    addKeyValue(
      doc,
      y + 26,
      'Unique customers',
      itemsCogs.returned
        ? `${itemsCogs.uniqueCustomers} (${itemsCogs.returned})`
        : itemsCogs.uniqueCustomers
    )
    addKeyValue(doc, y + 32, 'Repeat rate', itemsCogs.repeatRate)
    addKeyValue(doc, y + 38, 'Pending orders', itemsCogs.pendingOrders)
    y += 58

    if (itemsCogs.topProducts.length > 0) {
      drawSectionTitle(doc, 'Top products (by revenue)', y)
      y += 6
      doc.setFontSize(9)
      doc.setTextColor(COLORS.primary)
      itemsCogs.topProducts.forEach((p, idx) => {
        y = ensureSpace(doc, y, 18)
        const rowHeight = 12
        doc.setFillColor(idx % 2 === 0 ? COLORS.subtle : '#FFFFFF')
        doc.rect(LEFT_MARGIN - 2, y - 4, CONTENT_WIDTH + 4, rowHeight, 'F')
        const nameY = y + 2
        doc.text(`${idx + 1}. ${p.name}`, LEFT_MARGIN, nameY)
        doc.setTextColor(COLORS.muted)
        doc.text(
          `Revenue: ${p.revenue} • Sold: ${p.sold}`,
          LEFT_MARGIN + 4,
          nameY + 4
        )
        doc.setTextColor(COLORS.primary)
        y += rowHeight + 2
      })
      y += 8
    }
  }

  // Transactions table (simple text rows)
  drawSectionTitle(doc, 'Transactions', y)
  y += 6
  doc.setFontSize(9)
  const header = ['No', 'Date', 'Tx No', 'Status', 'Customer', 'Qty', 'Total']
  const colWidths = [8, 28, 35, 22, 48, 12, 35]

  const rowToText = (values: string[]) => {
    let x = LEFT_MARGIN
    values.forEach((v, idx) => {
      doc.text(v, x, y, { maxWidth: colWidths[idx] })
      x += colWidths[idx]
    })
  }

  // Header row
  y = ensureSpace(doc, y, 8)
  doc.setFillColor(COLORS.primary)
  doc.setTextColor('#FFFFFF')
  doc.rect(LEFT_MARGIN - 1, y - 4, CONTENT_WIDTH + 2, 8, 'F')
  rowToText(header)
  y += 6
  doc.setTextColor(COLORS.primary)

  transactions.forEach((tx, idx) => {
    y = ensureSpace(doc, y, 8)
    if (idx % 2 === 0) {
      doc.setFillColor(COLORS.subtle)
      doc.rect(LEFT_MARGIN - 1, y - 5, CONTENT_WIDTH + 2, 7, 'F')
    }
    const totalItems = tx.items.reduce((s, i) => s + i.quantity, 0)
    const row = [
      String(idx + 1),
      format(parseISO(tx.transactionDate), 'dd/MM HH:mm'),
      tx.transactionNo,
      tx.status,
      tx.customerName || '-',
      String(totalItems),
      `Rp ${Number(tx.grandTotal).toLocaleString()}`,
    ]
    rowToText(row)
    y += 6
  })

  const fileName = `dashboard-report-${format(generatedAt, 'yyyyMMdd-HHmmss')}.pdf`
  doc.save(fileName)
}
