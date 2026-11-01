/**
 * A random first-party id for this browser, sent only to trial and
 * verification requests. It is not a fingerprint: clearing site data resets
 * it, and the server treats it as a weak hint (ansilum-be docs/TRUST_AND_TRIALS.md).
 */
const KEY = 'ansilum.device-id'

export function deviceId(): string | null {
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(KEY, created)
    return created
  } catch {
    return null
  }
}
