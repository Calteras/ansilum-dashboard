import { BRAND_LABELS } from '@/features/checkout/components/card-form'
import { findPaymentMethod } from '@/features/checkout/payment-methods'
import type {
  BillingCycle,
  CardBrand,
  PaymentStatus,
  PaymentType,
} from './subscription.types'

type Copy = (id: string, en: string) => string

const FALLBACK_METHODS: Partial<Record<PaymentType, string>> = {
  BANK_TRANSFER_BRI: 'BRI Virtual Account',
  BANK_TRANSFER_PERMATA: 'Permata Virtual Account',
}

export function brandLabel(brand: CardBrand | string) {
  return BRAND_LABELS[brand as keyof typeof BRAND_LABELS] ?? 'Card'
}

/** "Visa •••• 1114" for cards, the method's name otherwise. */
export function paymentMethodLabel(
  copy: Copy,
  paymentType: PaymentType,
  card?: { brand: CardBrand | string; last4: string } | null
) {
  if (card) return `${brandLabel(card.brand)} •••• ${card.last4}`
  const method = findPaymentMethod(paymentType)
  if (method?.name) return copy(...method.name)
  return method?.label ?? FALLBACK_METHODS[paymentType] ?? paymentType
}

export function cycleLabel(copy: Copy, cycle: BillingCycle | null) {
  return cycle === 'YEARLY'
    ? copy('Tahunan', 'Yearly')
    : copy('Bulanan', 'Monthly')
}

export const STATUS_BADGE: Record<
  PaymentStatus,
  {
    variant: 'success' | 'upcoming' | 'destructive' | 'secondary' | 'outline'
    label: [string, string]
  }
> = {
  PAID: { variant: 'success', label: ['Lunas', 'Paid'] },
  PENDING: { variant: 'upcoming', label: ['Menunggu', 'Pending'] },
  FAILED: { variant: 'destructive', label: ['Gagal', 'Failed'] },
  EXPIRED: { variant: 'secondary', label: ['Kedaluwarsa', 'Expired'] },
  REFUNDED: { variant: 'outline', label: ['Dikembalikan', 'Refunded'] },
}
