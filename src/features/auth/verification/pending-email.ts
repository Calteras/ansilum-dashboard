const KEY = 'terrapos.pending-verification'
export interface PendingVerification {
  email: string
  deadline: number
}
export function readPendingVerification(): PendingVerification {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (typeof value?.email === 'string' && Number.isFinite(value?.deadline))
      return value
  } catch {
    /* Storage is optional UI convenience. */
  }
  return { email: '', deadline: 0 }
}
export function savePendingVerification(email: string, deadline?: number) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        email,
        deadline:
          deadline ??
          (readPendingVerification().email === email
            ? readPendingVerification().deadline
            : 0),
      })
    )
  } catch {
    /* Optional. */
  }
}
export function clearPendingVerification() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* Optional. */
  }
}
