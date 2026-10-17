import i18n from '@/i18n'

/** Whether a rise in the metric is good news. Refunds or voids would use `decrease-is-good`. */
export type MetricPolarity = 'increase-is-good' | 'decrease-is-good' | 'neutral'
export type DeltaTone = 'positive' | 'negative' | 'neutral'

/** Relative change as a ratio (0.124 = +12.4%). Null when there is no meaningful baseline. */
export function percentChange(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null) return null
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

/** Tone comes from what the metric means, not from the sign alone. */
export function deltaTone(
  change: number | null,
  polarity: MetricPolarity
): DeltaTone {
  if (change == null || change === 0 || polarity === 'neutral') return 'neutral'
  const isIncrease = change > 0
  return isIncrease === (polarity === 'increase-is-good')
    ? 'positive'
    : 'negative'
}

/** A ratio as a percentage with one decimal, e.g. 0.124 → "12.4%". */
export function formatPercent(
  ratio: number,
  language = i18n.resolvedLanguage ?? i18n.language ?? 'id'
): string {
  return new Intl.NumberFormat(language.startsWith('id') ? 'id-ID' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ratio)
}

/** Unsigned magnitude, e.g. "12.4%". The direction is carried by an arrow and words. */
export function formatChangeMagnitude(change: number, language?: string) {
  return formatPercent(Math.abs(change), language)
}

export function formatCount(
  value: number,
  language = i18n.resolvedLanguage ?? i18n.language ?? 'id'
): string {
  return new Intl.NumberFormat(language.startsWith('id') ? 'id-ID' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value)
}
