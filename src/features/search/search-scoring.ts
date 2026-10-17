/** Lowercase, accent-free form used for matching ("Café" matches "cafe"). */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (const char of haystack) {
    if (char === needle[i]) i++
    if (i === needle.length) return true
  }
  return false
}

/**
 * Relevance of `text` for `query`, 0–100. Exact > prefix > word prefix >
 * substring > all words present > fuzzy subsequence (3+ characters).
 */
export function scoreText(query: string, text: string): number {
  const q = normalize(query)
  const t = normalize(text)
  if (!q || !t) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 85
  if (t.split(/[\s\-_/·.,()]+/).some((word) => word.startsWith(q))) return 70
  if (t.includes(q)) return 55
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length > 1 && words.every((word) => t.includes(word))) return 45
  if (q.length >= 3 && isSubsequence(q.replace(/\s+/g, ''), t)) return 15
  return 0
}

export interface Searchable {
  title: string
  subtitle?: string
  keywords?: string[]
}

/** Title matches count fully; keywords and (optionally) subtitles count less. */
export function scoreItem(
  query: string,
  item: Searchable,
  { matchSubtitle = true } = {}
): number {
  return Math.max(
    scoreText(query, item.title),
    ...(item.keywords ?? []).map((keyword) => scoreText(query, keyword) * 0.7),
    matchSubtitle && item.subtitle ? scoreText(query, item.subtitle) * 0.6 : 0
  )
}

/** Items that match, best first, capped at `limit`. Ties keep their order. */
export function rankItems<T extends Searchable>(
  query: string,
  items: T[],
  limit = Number.POSITIVE_INFINITY,
  options?: { matchSubtitle?: boolean }
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreItem(query, item, options),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item)
}

/** Splits `text` around the first case-insensitive occurrence of `query`. */
export function highlightParts(
  text: string,
  query: string
): { text: string; match: boolean }[] {
  const q = query.trim().toLowerCase()
  const index = q ? text.toLowerCase().indexOf(q) : -1
  if (index < 0) return [{ text, match: false }]
  return [
    { text: text.slice(0, index), match: false },
    { text: text.slice(index, index + q.length), match: true },
    { text: text.slice(index + q.length), match: false },
  ].filter((part) => part.text)
}

/** Looks like a receipt number, e.g. "TRX-00012", "trx 12", "#00012". */
export function looksLikeTransactionNo(query: string): boolean {
  return (
    /^(trx|#)?[\s-]?\d{3,}$/i.test(query.trim()) || /^trx-/i.test(query.trim())
  )
}
