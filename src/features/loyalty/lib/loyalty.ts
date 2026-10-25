import { formatMoney } from '@/lib/format'
import { formatCount } from '@/lib/metrics'
import type {
  Customer,
  CustomerStatus,
  LoyaltyConfig,
  PointsLedgerType,
  Reward,
} from '../api/loyalty.types'

type Copy = (id: string, en: string) => string

/** Banned wins: a banned member is also inactive. */
export function customerStatus(
  customer: Pick<Customer, 'isActive' | 'bannedAt'>
): CustomerStatus {
  if (customer.bannedAt) return 'banned'
  return customer.isActive ? 'active' : 'inactive'
}

export function customerStatusLabel(status: CustomerStatus, copy: Copy) {
  return {
    active: copy('Aktif', 'Active'),
    inactive: copy('Nonaktif', 'Inactive'),
    banned: copy('Diblokir', 'Banned'),
  }[status]
}

export function formatPoints(points: number) {
  return formatCount(points)
}

/**
 * Points a sale earns under the current rule, the same formula as the server
 * and the POS: floor(total / spend per point), nothing below the minimum.
 */
export function pointsForSpend(
  amount: number,
  rule: Pick<
    LoyaltyConfig,
    'isEnabled' | 'pointsPerAmount' | 'minimumAmountForPoints'
  >
) {
  const perPoint = Number(rule.pointsPerAmount)
  if (!rule.isEnabled || !(perPoint > 0)) return 0
  if (amount < Number(rule.minimumAmountForPoints)) return 0
  return Math.floor(amount / perPoint)
}

export type RewardState =
  | 'active'
  | 'expiring'
  | 'expired'
  | 'usedUp'
  | 'inactive'

const EXPIRING_WITHIN_MS = 7 * 24 * 60 * 60 * 1000

/** What a cashier would see: whether the reward can be redeemed right now. */
export function rewardState(reward: Reward, now = Date.now()): RewardState {
  if (!reward.isActive) return 'inactive'
  const expiresAt = reward.expiresAt ? Date.parse(reward.expiresAt) : null
  if (expiresAt !== null && expiresAt <= now) return 'expired'
  if (
    reward.maxRedemptions !== null &&
    reward.totalRedemptions >= reward.maxRedemptions
  )
    return 'usedUp'
  if (expiresAt !== null && expiresAt - now <= EXPIRING_WITHIN_MS)
    return 'expiring'
  return 'active'
}

export function rewardStateLabel(state: RewardState, copy: Copy) {
  return {
    active: copy('Aktif', 'Active'),
    expiring: copy('Segera berakhir', 'Expiring soon'),
    expired: copy('Kedaluwarsa', 'Expired'),
    usedUp: copy('Kuota habis', 'Used up'),
    inactive: copy('Nonaktif', 'Inactive'),
  }[state]
}

export function rewardTypeLabel(type: Reward['type'], copy: Copy) {
  return {
    DISCOUNT_FIXED: copy('Potongan harga', 'Amount off'),
    DISCOUNT_PERCENT: copy('Diskon persen', 'Percent off'),
    FREE_ITEM: copy('Produk gratis', 'Free item'),
  }[type]
}

/** The benefit in a few words, e.g. "Rp5.000 off" or "Free Latte · Large". */
export function rewardValue(
  reward: Pick<
    Reward,
    'type' | 'discountAmount' | 'discountPercent' | 'product' | 'variant'
  >,
  copy: Copy
) {
  switch (reward.type) {
    case 'DISCOUNT_FIXED':
      return copy(
        `Potongan ${formatMoney(reward.discountAmount ?? 0)}`,
        `${formatMoney(reward.discountAmount ?? 0)} off`
      )
    case 'DISCOUNT_PERCENT':
      return copy(
        `Diskon ${Number(reward.discountPercent ?? 0)}%`,
        `${Number(reward.discountPercent ?? 0)}% off`
      )
    case 'FREE_ITEM': {
      const item = [reward.product?.name, reward.variant?.name]
        .filter(Boolean)
        .join(' · ')
      return copy(`Gratis ${item || 'produk'}`, `Free ${item || 'item'}`)
    }
  }
}

export function ledgerTypeLabel(type: PointsLedgerType, copy: Copy) {
  return {
    EARN: copy('Didapat', 'Earned'),
    REDEEM: copy('Ditukar', 'Redeemed'),
    EXPIRE: copy('Kedaluwarsa', 'Expired'),
    ADJUST_IN: copy('Penyesuaian +', 'Adjustment +'),
    ADJUST_OUT: copy('Penyesuaian −', 'Adjustment −'),
  }[type]
}

/** Signed with a true minus sign, e.g. "+45" or "−200". */
export function formatPointsChange(points: number) {
  if (points === 0) return '0'
  return `${points > 0 ? '+' : '−'}${formatCount(Math.abs(points))}`
}

/** Comma-separated tags as typed in a form, trimmed and de-duplicated. */
export function parseTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ]
}

/** "Rizky Pratama" → "RP"; a single name gives its first two letters. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1)
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

/** The API's loyalty messages in the UI language; anything else as sent. */
export function loyaltyErrorMessage(message: string, copy: Copy) {
  const known: [RegExp, string, string][] = [
    [
      /belongs to a banned customer/,
      'Nomor HP ini milik pelanggan yang diblokir.',
      message,
    ],
    [/phone number already exists/, 'Nomor HP ini sudah terdaftar.', message],
    [/already banned/, 'Pelanggan ini sudah diblokir.', message],
    [/is not banned/, 'Pelanggan ini tidak sedang diblokir.', message],
    [/Customer is banned/, 'Pelanggan ini sedang diblokir.', message],
    [/Insufficient points/, 'Poin tidak cukup.', message],
  ]
  const match = known.find(([pattern]) => pattern.test(message))
  return match ? copy(match[1], match[2]) : message
}
