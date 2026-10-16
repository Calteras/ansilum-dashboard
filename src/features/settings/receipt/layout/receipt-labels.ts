// Printed words for receipts, a copy of the POS app's
// lib/src/domain/receipt/receipt_labels.dart (receipt part). Printed text is
// ASCII, so these are too.
import type { ReceiptLanguage } from './receipt-text'

export type OrderType = 'dineIn' | 'takeaway' | 'reservation'
export type PaymentMethod =
  | 'cash'
  | 'bankTransfer'
  | 'qrCode'
  | 'creditCard'
  | 'debitCard'

export interface ReceiptLabels {
  receiptNo: string
  date: string
  cashier: string
  customer: string
  table: string
  orderType: string
  orderTypes: Record<OrderType, string>
  note: string
  reward: string
  subtotal: string
  discount: string
  tax: string
  service: string
  total: string
  change: string
  remaining: string
  notPaidInFull: string
  paymentMethods: Record<PaymentMethod, string>
  pointsEarned: string
  pointsRedeemed: string
  pointsBalance: string
  pointsMayChange: string
  pointsUnavailable: string
  phone: string
  taxId: string
  copy: string
}

const indonesian: ReceiptLabels = {
  receiptNo: 'No. struk',
  date: 'Tanggal',
  cashier: 'Kasir',
  customer: 'Pelanggan',
  table: 'Meja',
  orderType: 'Jenis pesanan',
  orderTypes: {
    dineIn: 'Makan di tempat',
    takeaway: 'Bawa pulang',
    reservation: 'Reservasi',
  },
  note: 'Catatan',
  reward: 'Reward',
  subtotal: 'Subtotal',
  discount: 'Diskon',
  tax: 'Pajak',
  service: 'Layanan',
  total: 'TOTAL',
  change: 'Kembalian',
  remaining: 'Sisa tagihan',
  notPaidInFull: 'BELUM LUNAS',
  paymentMethods: {
    cash: 'Tunai',
    bankTransfer: 'Transfer',
    qrCode: 'QRIS',
    creditCard: 'Kartu kredit',
    debitCard: 'Kartu debit',
  },
  pointsEarned: 'Poin didapat',
  pointsRedeemed: 'Poin ditukar',
  pointsBalance: 'Saldo poin',
  pointsMayChange: 'Saldo bisa berubah setelah sinkron.',
  pointsUnavailable: 'Poin belum dihitung karena aturan reward belum tersedia.',
  phone: 'Telp',
  taxId: 'NPWP',
  copy: 'SALINAN',
}

const english: ReceiptLabels = {
  receiptNo: 'Receipt no.',
  date: 'Date',
  cashier: 'Cashier',
  customer: 'Customer',
  table: 'Table',
  orderType: 'Order type',
  orderTypes: {
    dineIn: 'Dine in',
    takeaway: 'Takeaway',
    reservation: 'Reservation',
  },
  note: 'Note',
  reward: 'Reward',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax',
  service: 'Service',
  total: 'TOTAL',
  change: 'Change',
  remaining: 'Balance due',
  notPaidInFull: 'NOT PAID IN FULL',
  paymentMethods: {
    cash: 'Cash',
    bankTransfer: 'Transfer',
    qrCode: 'QRIS',
    creditCard: 'Credit card',
    debitCard: 'Debit card',
  },
  pointsEarned: 'Points earned',
  pointsRedeemed: 'Points redeemed',
  pointsBalance: 'Points balance',
  pointsMayChange: 'The balance may change after sync.',
  pointsUnavailable:
    'Points were not calculated: reward rules are not available.',
  phone: 'Tel',
  taxId: 'Tax ID',
  copy: 'COPY',
}

export function receiptLabels(language: ReceiptLanguage): ReceiptLabels {
  return language === 'en' ? english : indonesian
}
