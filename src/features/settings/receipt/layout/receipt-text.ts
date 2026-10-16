// Text helpers for receipt layout contract v1. A copy of the POS app's
// lib/src/domain/receipt/receipt_text.dart; keep the two identical.

export type ReceiptLanguage = 'id' | 'en'

const replacements: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '‚': "'",
  '‛': "'",
  '′': "'",
  '´': "'",
  '“': '"',
  '”': '"',
  '„': '"',
  '″': '"',
  '«': '"',
  '»': '"',
  '‐': '-',
  '‑': '-',
  '‒': '-',
  '–': '-',
  '—': '-',
  '―': '-',
  '−': '-',
  '…': '...',
  '•': '*',
  '·': '.',
  '×': 'x',
  '÷': '/',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  ' ': ' ',
  '\t': ' ',
  ß: 'ss',
  æ: 'ae',
  Æ: 'AE',
  œ: 'oe',
  Œ: 'OE',
  ø: 'o',
  Ø: 'O',
  đ: 'd',
  Đ: 'D',
  ł: 'l',
  Ł: 'L',
}

const accented: Record<string, string> = {
  a: 'àáâãäåāăą',
  A: 'ÀÁÂÃÄÅĀĂĄ',
  c: 'çćĉċč',
  C: 'ÇĆĈĊČ',
  d: 'ď',
  D: 'Ď',
  e: 'èéêëēĕėęě',
  E: 'ÈÉÊËĒĔĖĘĚ',
  g: 'ĝğġģ',
  G: 'ĜĞĠĢ',
  h: 'ĥħ',
  H: 'ĤĦ',
  i: 'ìíîïĩīĭįı',
  I: 'ÌÍÎÏĨĪĬĮİ',
  j: 'ĵ',
  J: 'Ĵ',
  k: 'ķ',
  K: 'Ķ',
  l: 'ĺļľŀ',
  L: 'ĹĻĽĿ',
  n: 'ñńņňŉ',
  N: 'ÑŃŅŇ',
  o: 'òóôõöōŏő',
  O: 'ÒÓÔÕÖŌŎŐ',
  r: 'ŕŗř',
  R: 'ŔŖŘ',
  s: 'śŝşš',
  S: 'ŚŜŞŠ',
  t: 'ţťŧ',
  T: 'ŢŤŦ',
  u: 'ùúûüũūŭůűų',
  U: 'ÙÚÛÜŨŪŬŮŰŲ',
  w: 'ŵ',
  W: 'Ŵ',
  y: 'ýÿŷ',
  Y: 'ÝŸŶ',
  z: 'źżž',
  Z: 'ŹŻŽ',
}

const baseLetter: Record<string, string> = Object.fromEntries(
  Object.entries(accented).flatMap(([base, letters]) =>
    [...letters].map((letter) => [letter, base])
  )
)

const letter = /\p{L}/u

/**
 * `input` in characters every thermal printer prints: printable ASCII and
 * newlines. Typographic punctuation becomes ASCII, accented letters lose
 * their accents, other letters become `?`, everything else is dropped.
 */
export function printable(input: string): string {
  let out = ''
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0
    if ((code >= 0x20 && code <= 0x7e) || code === 0x0a) {
      out += char
    } else if (char in replacements) {
      out += replacements[char]
    } else if (char in baseLetter) {
      out += baseLetter[char]
    } else if (letter.test(char)) {
      out += '?'
    }
  }
  return out
}

/** `input` on one line, with newlines as spaces and spaces collapsed. */
export function printableLine(input: string): string {
  return printable(input).replace(/\s+/g, ' ').trim()
}

/** The non-empty lines of `input`, each a printableLine. */
export function printableParagraphs(input: string): string[] {
  return printable(input)
    .split('\n')
    .map(printableLine)
    .filter((paragraph) => paragraph.length > 0)
}

/**
 * Words filled into lines of at most `width` characters; the first line may
 * be shorter (`firstWidth`). Words longer than a line are broken.
 */
export function wrapText(
  text: string,
  width: number,
  firstWidth?: number
): string[] {
  const words = text.split(' ').filter((word) => word.length > 0)
  const lines: string[] = []
  let line = ''
  const widthAt = (index: number) => {
    const value = index === 0 ? (firstWidth ?? width) : width
    return value < 1 ? 1 : value
  }
  for (let word of words) {
    for (;;) {
      const limit = widthAt(lines.length)
      if (line.length === 0) {
        if (word.length <= limit) {
          line = word
          break
        }
        lines.push(word.substring(0, limit))
        word = word.substring(limit)
        if (word.length === 0) break
        continue
      }
      if (line.length + 1 + word.length <= limit) {
        line = `${line} ${word}`
        break
      }
      lines.push(line)
      line = ''
    }
  }
  if (line.length > 0) lines.push(line)
  return lines
}

/** `text` centered in `width`; extra space goes to the right. */
export function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  return `${' '.repeat(Math.floor((width - text.length) / 2))}${text}`
}

/**
 * `left` and `right` on one line of `width`, `right` flush right and never
 * broken. `left` wraps beside it and continues `indent` spaces in. With
 * fewer than eight columns beside `right`, `left` takes its own lines.
 */
export function formatRow(
  left: string,
  right: string,
  width: number,
  indent = 0
): string[] {
  const available = width - right.length - 1
  const continued = (lines: string[]) => [
    ...lines.slice(0, 1),
    ...lines.slice(1).map((line) => `${' '.repeat(indent)}${line}`),
  ]
  if (right.length === 0) return continued(wrapText(left, width - indent))
  if (available < 8) {
    return [
      ...continued(wrapText(left, width - indent, width)),
      right.padStart(width),
    ]
  }
  const lines = wrapText(left, width - indent, available)
  if (lines.length === 0) return [right.padStart(width)]
  const first = lines[0]
  return [
    `${first}${' '.repeat(width - first.length - right.length)}${right}`,
    ...continued(lines).slice(1),
  ]
}

/** Label and value on one line when they fit, otherwise stacked. */
export function labelValue(
  label: string,
  value: string,
  width: number
): string[] {
  if (label.length + 1 + value.length <= width) {
    return [
      `${label}${' '.repeat(width - label.length - value.length)}${value}`,
    ]
  }
  return [
    ...wrapText(label, width),
    ...wrapText(value, width).map((line) => line.padStart(width)),
  ]
}

/** An amount in minor units: `12.500` (id), `12,500` (en), `Rp` on request. */
export function formatAmount(
  minor: number,
  language: ReceiptLanguage,
  symbol = false
): string {
  const english = language === 'en'
  const absolute = Math.abs(minor)
  const digits = Math.floor(absolute / 100).toString()
  let grouped = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += english ? ',' : '.'
    grouped += digits[i]
  }
  const cents = absolute % 100
  const fraction =
    cents === 0
      ? ''
      : `${english ? '.' : ','}${cents.toString().padStart(2, '0')}`
  return `${minor < 0 ? '-' : ''}${symbol ? 'Rp' : ''}${grouped}${fraction}`
}

/** A rate in basis points: 1100 is `11%`, 1050 is `10,5%` (id). */
export function formatRate(
  basisPoints: number,
  language: ReceiptLanguage
): string {
  const whole = Math.floor(basisPoints / 100)
  const rest = basisPoints % 100
  if (rest === 0) return `${whole}%`
  let fraction = rest.toString().padStart(2, '0')
  if (fraction.endsWith('0')) fraction = fraction.substring(0, 1)
  return `${whole}${language === 'en' ? '.' : ','}${fraction}%`
}

const months: Record<ReceiptLanguage, string[]> = {
  id: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ],
  en: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
}

/** `19.05` (id), `19:05` (en). */
export function formatTime(time: Date, language: ReceiptLanguage): string {
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  return `${hours}${language === 'en' ? ':' : '.'}${minutes}`
}

/** `16 Okt 2026 19.05` (id), `16 Oct 2026 19:05` (en). */
export function formatDateTime(time: Date, language: ReceiptLanguage): string {
  return (
    `${time.getDate()} ${months[language][time.getMonth()]} ` +
    `${time.getFullYear()} ${formatTime(time, language)}`
  )
}
