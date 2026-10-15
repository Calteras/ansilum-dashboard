export type CardBrand = 'visa' | 'mastercard' | 'jcb' | 'amex'

/** Networks Midtrans accepts, recognised from the leading digits as the customer types. */
export function detectBrand(digits: string): CardBrand | null {
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits))
    return 'mastercard'
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return 'jcb'
  if (/^3[47]/.test(digits)) return 'amex'
  return null
}

const LENGTHS: Record<CardBrand, number[]> = {
  visa: [13, 16, 19],
  mastercard: [16],
  jcb: [16, 17, 18, 19],
  amex: [15],
}

export function maxCardLength(brand: CardBrand | null) {
  return brand ? Math.max(...LENGTHS[brand]) : 19
}

export function cvcLength(brand: CardBrand | null) {
  return brand === 'amex' ? 4 : 3
}

/** Groups digits the way they are printed: 4-6-5 for Amex, fours for everything else. */
export function formatCardNumber(digits: string) {
  const brand = detectBrand(digits)
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3]
  const parts: string[] = []
  let index = 0
  for (const size of groups) {
    if (index >= digits.length) break
    parts.push(digits.slice(index, index + size))
    index += size
  }
  return parts.join(' ')
}

function luhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function isValidCardNumber(digits: string) {
  const brand = detectBrand(digits)
  return !!brand && LENGTHS[brand].includes(digits.length) && luhn(digits)
}

/** "MM / YY" as typed, with the slash added automatically. */
export function formatExpiry(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 1 && Number(digits) > 1) return `0${digits} / `
  return digits.length > 2
    ? `${digits.slice(0, 2)} / ${digits.slice(2)}`
    : digits
}

/** A usable expiry (this month or later), as the two-digit month and four-digit year Midtrans expects. */
export function parseExpiry(value: string, now = new Date()) {
  const match = /^(\d{2}) \/ (\d{2})$/.exec(value)
  if (!match) return null
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return null
  const expired =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1)
  return expired ? null : { month: match[1], year: String(year) }
}
