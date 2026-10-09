export function safeVerificationError(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  return value === 'token_expired' || value === 'invalid_token'
    ? value
    : 'unknown'
}
// Run before router creation or any future page-view instrumentation.
export function sanitizeVerificationLocation() {
  if (window.location.pathname !== '/auth/email-verified') return
  const query = new URLSearchParams(window.location.search)
  const error = query.has('error')
    ? safeVerificationError(query.get('error'))
    : initialVerificationError()
  window.history.replaceState(
    { ...window.history.state, verificationError: error },
    '',
    window.location.pathname
  )
}
export function initialVerificationError() {
  return safeVerificationError(window.history.state?.verificationError)
}
