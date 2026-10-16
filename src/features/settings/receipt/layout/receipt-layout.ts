// Receipt layout contract v1: a copy of the POS app's ReceiptLayout.receipt
// (lib/src/domain/receipt/receipt_layout.dart). Both are checked against the
// same fixtures; keep them identical.
import {
  displayNumber,
  type ReceiptDocument,
  type ReceiptItem,
  type ReceiptLoyalty,
  type ReceiptMerchant,
} from './receipt-document'
import { receiptLabels, type ReceiptLabels } from './receipt-labels'
import type { ReceiptLine, ReceiptTextStyle } from './receipt-lines'
import type { ReceiptTemplate } from './receipt-template'
import {
  centerText,
  formatAmount,
  formatDateTime,
  formatRate,
  formatRow,
  labelValue,
  printableLine,
  printableParagraphs,
  wrapText,
  type ReceiptLanguage,
} from './receipt-text'

export type Support = 'yes' | 'no' | 'unknown'

export interface PrinterCapabilities {
  bold: Support
  doubleSize: Support
  image: Support
  qrCode: Support
}

export const DEFAULT_CAPABILITIES: PrinterCapabilities = {
  bold: 'yes',
  doubleSize: 'yes',
  image: 'yes',
  qrCode: 'unknown',
}

const canTry = (support: Support) => support !== 'no'

export interface PaperSpec {
  widthMm: number
  columns: number
  smallColumns: number
}

export const PAPER_58: PaperSpec = {
  widthMm: 58,
  columns: 32,
  smallColumns: 42,
}
export const PAPER_80: PaperSpec = {
  widthMm: 80,
  columns: 48,
  smallColumns: 64,
}

export class ReceiptLayout {
  readonly columns: number
  readonly smallColumns: number
  readonly capabilities: PrinterCapabilities

  constructor(
    paper: PaperSpec,
    capabilities: PrinterCapabilities = DEFAULT_CAPABILITIES,
    columns?: number
  ) {
    const normal =
      columns === undefined || columns > paper.columns ? paper.columns : columns
    this.columns = normal
    this.smallColumns = Math.floor(
      (paper.smallColumns * normal) / paper.columns
    )
    this.capabilities = capabilities
  }

  get largeColumns(): number {
    return Math.floor(this.columns / 2)
  }

  private get wide(): boolean {
    return this.columns >= 40
  }

  private get bold(): ReceiptTextStyle {
    return canTry(this.capabilities.bold) ? 'bold' : 'normal'
  }

  /** A customer receipt. `copy` marks a copy after the first. */
  receipt(
    document: ReceiptDocument,
    merchant: ReceiptMerchant,
    template: ReceiptTemplate,
    copy = false
  ): ReceiptLine[] {
    const language = template.language
    const labels = receiptLabels(language)
    const amount = (minor: number, symbol = false) =>
      formatAmount(minor, language, symbol)
    const reward = printableLine(document.rewardName ?? '')
    const lines: ReceiptLine[] = [
      ...this.header(merchant, template, labels),
      ...(copy ? this.centered(`*** ${labels.copy} ***`, this.bold) : []),
      this.rule(),
      ...this.details(document, template, labels, language),
      this.rule(),
      ...this.items(document.items, template, labels, language),
      ...(reward ? this.wrapped(`${labels.reward}: ${reward}`, this.bold) : []),
      this.rule(),
      ...this.row(labels.subtotal, amount(document.subtotalMinor)),
    ]
    const discount = document.discountMinor ?? 0
    const tax = document.taxMinor ?? 0
    const service = document.serviceMinor ?? 0
    if (discount > 0)
      lines.push(...this.row(labels.discount, amount(-discount)))
    if (tax > 0) {
      lines.push(
        ...this.row(
          rated(labels.tax, document.taxBasisPoints, language),
          amount(tax)
        )
      )
    }
    if (service > 0) {
      lines.push(
        ...this.row(
          rated(labels.service, document.serviceBasisPoints, language),
          amount(service)
        )
      )
    }
    lines.push(this.rule())
    lines.push(...this.total(labels.total, amount(document.totalMinor, true)))
    lines.push(this.rule())
    for (const payment of document.payments ?? []) {
      const received = payment.receivedMinor
      lines.push(
        ...this.row(
          labels.paymentMethods[payment.method],
          amount(
            received !== undefined && received > payment.amountMinor
              ? received
              : payment.amountMinor
          )
        )
      )
    }
    const change = document.changeMinor ?? 0
    if (change > 0) lines.push(...this.row(labels.change, amount(change)))
    const remaining = document.remainingMinor ?? 0
    if (remaining > 0) {
      lines.push(...this.row(labels.remaining, amount(remaining), this.bold))
      lines.push(...this.centered(labels.notPaidInFull, this.bold))
    }
    if (document.loyalty) {
      lines.push(this.rule())
      lines.push(...this.loyalty(document.loyalty, labels))
    }
    lines.push(...this.footer(template))
    if (!document.number?.trim()) {
      lines.push(...this.centered(`ID ${document.id}`, 'small'))
    }
    return lines
  }

  // Sections ---------------------------------------------------------------

  private header(
    merchant: ReceiptMerchant,
    template: ReceiptTemplate,
    labels: ReceiptLabels
  ): ReceiptLine[] {
    const header = template.header
    const name = printableLine(
      header.businessName ? header.businessName : merchant.businessName
    )
    const outlet = printableLine(merchant.outletName ?? '')
    const phone = printableLine(merchant.phone ?? '')
    const taxId = printableLine(header.taxId)
    const lines: ReceiptLine[] = []
    if (
      header.showLogo &&
      merchant.hasLogo &&
      canTry(this.capabilities.image)
    ) {
      lines.push({ kind: 'logo' })
    }
    if (name) lines.push(...this.title(name))
    if (
      header.showOutletName &&
      outlet &&
      outlet.toLowerCase() !== name.toLowerCase()
    ) {
      lines.push(...this.centered(outlet))
    }
    if (header.showAddress) {
      for (const paragraph of printableParagraphs(merchant.address ?? '')) {
        lines.push(...this.centered(paragraph))
      }
    }
    if (header.showPhone && phone) {
      lines.push(...this.centered(`${labels.phone} ${phone}`))
    }
    if (taxId) lines.push(...this.centered(`${labels.taxId} ${taxId}`))
    for (const paragraph of printableParagraphs(header.note)) {
      lines.push(...this.centered(paragraph))
    }
    return lines
  }

  private details(
    document: ReceiptDocument,
    template: ReceiptTemplate,
    labels: ReceiptLabels,
    language: ReceiptLanguage
  ): ReceiptLine[] {
    const show = template.transaction
    const cashier = printableLine(document.cashierName ?? '')
    const customer = printableLine(document.customerName ?? '')
    const table = printableLine(document.tableNumber ?? '')
    const lines = [
      ...this.labelValue(
        labels.receiptNo,
        printableLine(displayNumber(document))
      ),
      ...this.labelValue(
        labels.date,
        formatDateTime(new Date(document.issuedAt), language)
      ),
    ]
    if (show.showCashier && cashier) {
      lines.push(...this.labelValue(labels.cashier, cashier))
    }
    if (show.showCustomer && customer) {
      lines.push(...this.labelValue(labels.customer, customer))
    }
    if (show.showTable && table) {
      lines.push(...this.labelValue(labels.table, table))
    }
    if (show.showOrderType && document.orderType) {
      lines.push(
        ...this.labelValue(
          labels.orderType,
          labels.orderTypes[document.orderType]
        )
      )
    }
    return lines
  }

  private items(
    items: ReceiptItem[],
    template: ReceiptTemplate,
    labels: ReceiptLabels,
    language: ReceiptLanguage
  ): ReceiptLine[] {
    const show = template.items
    const amount = (minor: number) => formatAmount(minor, language)
    if (this.wide) {
      const qtyWidth =
        Math.max(0, ...items.map((item) => `${item.quantity}x`.length)) + 1
      const totalWidth = Math.max(
        0,
        ...items.map((item) => amount(item.totalMinor).length)
      )
      let unitWidth = show.showUnitPrice
        ? Math.max(
            0,
            ...items.map((item) => amount(item.unitPriceMinor).length)
          )
        : 0
      // Two spaces between money columns so they never read as one number.
      const nameWidth = () =>
        this.columns -
        qtyWidth -
        totalWidth -
        (unitWidth > 0 ? unitWidth + 4 : 1)
      if (unitWidth > 0 && nameWidth() < 12) unitWidth = 0
      if (nameWidth() >= 8) {
        return items.flatMap((item) =>
          this.wideItem(item, template, labels, {
            qtyWidth,
            nameWidth: nameWidth(),
            unitWidth,
            totalWidth,
            amount,
          })
        )
      }
    }
    return items.flatMap((item) =>
      this.narrowItem(item, template, labels, amount)
    )
  }

  private narrowItem(
    item: ReceiptItem,
    template: ReceiptTemplate,
    labels: ReceiptLabels,
    amount: (minor: number) => string
  ): ReceiptLine[] {
    const name = printableLine(item.name)
    const total = amount(item.totalMinor)
    let rows: string[]
    if (item.quantity > 1 && template.items.showUnitPrice) {
      const each = `  ${item.quantity} x ${amount(item.unitPriceMinor)}`
      rows = [
        ...wrapText(name, this.columns),
        ...(each.length + 1 + total.length <= this.columns
          ? [
              `${each}${' '.repeat(this.columns - each.length - total.length)}${total}`,
            ]
          : [each, total.padStart(this.columns)]),
      ]
    } else {
      const prefix = item.quantity > 1 ? `${item.quantity}x ` : ''
      rows = formatRow(`${prefix}${name}`, total, this.columns, prefix.length)
    }
    return [
      ...rows.map((row) => text(row)),
      ...this.itemDetails(item, template, labels, 2),
    ]
  }

  private wideItem(
    item: ReceiptItem,
    template: ReceiptTemplate,
    labels: ReceiptLabels,
    widths: {
      qtyWidth: number
      nameWidth: number
      unitWidth: number
      totalWidth: number
      amount: (minor: number) => string
    }
  ): ReceiptLine[] {
    const { qtyWidth, nameWidth, unitWidth, totalWidth, amount } = widths
    const names = wrapText(printableLine(item.name), nameWidth)
    const first = names[0] ?? ''
    const unit =
      unitWidth > 0
        ? `  ${amount(item.unitPriceMinor).padStart(unitWidth)}  `
        : ' '
    return [
      text(
        `${`${item.quantity}x`.padEnd(qtyWidth)}${first.padEnd(nameWidth)}` +
          `${unit}${amount(item.totalMinor).padStart(totalWidth)}`
      ),
      ...names.slice(1).map((name) => text(`${' '.repeat(qtyWidth)}${name}`)),
      ...this.itemDetails(item, template, labels, qtyWidth),
    ]
  }

  private itemDetails(
    item: ReceiptItem,
    template: ReceiptTemplate,
    labels: ReceiptLabels,
    indent: number
  ): ReceiptLine[] {
    const variant = printableLine(item.variant ?? '')
    const modifiers = (item.modifiers ?? [])
      .map(printableLine)
      .filter((modifier) => modifier.length > 0)
    const note = printableLine(item.note ?? '')
    const lines: ReceiptLine[] = []
    if (variant) lines.push(...this.indented(variant, indent))
    if (template.items.showModifiers && modifiers.length > 0) {
      lines.push(...this.indented(`+ ${modifiers.join(', ')}`, indent, 2))
    }
    if (template.items.showNotes && note) {
      lines.push(...this.indented(`${labels.note}: ${note}`, indent))
    }
    return lines
  }

  private total(label: string, amount: string): ReceiptLine[] {
    const fits = label.length + 1 + amount.length <= this.largeColumns
    if (canTry(this.capabilities.doubleSize) && fits) {
      const gap = ' '.repeat(this.largeColumns - label.length - amount.length)
      return [text(`${label}${gap}${amount}`, 'large')]
    }
    return this.row(label, amount, this.bold)
  }

  private loyalty(
    loyalty: ReceiptLoyalty,
    labels: ReceiptLabels
  ): ReceiptLine[] {
    if (loyalty.rulesUnavailable) return this.wrapped(labels.pointsUnavailable)
    const lines: ReceiptLine[] = []
    if (loyalty.earnedPoints !== undefined) {
      lines.push(...this.row(labels.pointsEarned, `${loyalty.earnedPoints}`))
    }
    if (loyalty.redeemedPoints !== undefined && loyalty.redeemedPoints > 0) {
      lines.push(
        ...this.row(labels.pointsRedeemed, `${loyalty.redeemedPoints}`)
      )
    }
    if (loyalty.projectedPoints !== undefined) {
      lines.push(
        ...this.row(labels.pointsBalance, `${loyalty.projectedPoints}`)
      )
      lines.push(...this.wrapped(labels.pointsMayChange))
    }
    return lines
  }

  private footer(template: ReceiptTemplate): ReceiptLine[] {
    const footer = template.footer
    const texts = [
      footer.thankYou,
      footer.policy,
      footer.social,
      footer.website,
      footer.note,
    ].flatMap(printableParagraphs)
    const qr = printableLine(footer.qrValue)
    const showQr = footer.showQr && qr.length > 0
    if (texts.length === 0 && !showQr && !footer.showPoweredBy) return []
    const lines: ReceiptLine[] = [{ kind: 'blank' }]
    for (const value of texts) lines.push(...this.centered(value))
    if (showQr) {
      if (canTry(this.capabilities.qrCode)) lines.push({ kind: 'qr', data: qr })
      else lines.push(...this.centered(qr))
    }
    if (footer.showPoweredBy) lines.push(...this.centered('Powered by Ansilum'))
    return lines
  }

  // Building blocks --------------------------------------------------------

  private rule(): ReceiptLine {
    return text('-'.repeat(this.columns))
  }

  private widthOf(style: ReceiptTextStyle): number {
    if (style === 'large') return this.largeColumns
    if (style === 'small') return this.smallColumns
    return this.columns
  }

  private title(value: string): ReceiptLine[] {
    const words = value.split(' ').filter((word) => word.length > 0)
    const large =
      canTry(this.capabilities.doubleSize) &&
      words.every((word) => word.length <= this.largeColumns)
    return this.centered(value, large ? 'large' : this.bold)
  }

  private centered(
    value: string,
    style: ReceiptTextStyle = 'normal'
  ): ReceiptLine[] {
    const width = this.widthOf(style)
    return wrapText(value, width).map((line) =>
      text(centerText(line, width), style)
    )
  }

  private wrapped(
    value: string,
    style: ReceiptTextStyle = 'normal'
  ): ReceiptLine[] {
    return wrapText(value, this.widthOf(style)).map((line) => text(line, style))
  }

  private row(
    left: string,
    right: string,
    style: ReceiptTextStyle = 'normal'
  ): ReceiptLine[] {
    return formatRow(left, right, this.columns).map((line) => text(line, style))
  }

  private labelValue(label: string, value: string): ReceiptLine[] {
    return labelValue(label, value, this.columns).map((line) => text(line))
  }

  private indented(value: string, indent: number, hang = 0): ReceiptLine[] {
    const lines = wrapText(
      value,
      this.columns - indent - hang,
      this.columns - indent
    )
    return lines.map((line, index) =>
      text(`${' '.repeat(indent + (index === 0 ? 0 : hang))}${line}`)
    )
  }
}

function text(value: string, style: ReceiptTextStyle = 'normal'): ReceiptLine {
  return { kind: 'text', text: value, style }
}

function rated(
  label: string,
  basisPoints: number | undefined,
  language: ReceiptLanguage
): string {
  return basisPoints === undefined || basisPoints <= 0
    ? label
    : `${label} ${formatRate(basisPoints, language)}`
}
