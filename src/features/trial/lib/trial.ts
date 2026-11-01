import { TrialApiError, type SubscriptionTier } from '../api/trial.api'

type Copy = (id: string, en: string) => string

export const tierName = (tier: SubscriptionTier) =>
  ({ BASIC: 'Basic', STANDARD: 'Standard', FULL: 'Full' })[tier]

/** Whole days left, at least 1 while the trial is running. */
export function daysLeft(expiresAt: string, now = Date.now()) {
  return Math.max(1, Math.ceil((Date.parse(expiresAt) - now) / 86_400_000))
}

function wait(seconds: number, copy: Copy) {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return copy('beberapa saat', 'a moment')
  const minutes = Math.ceil(seconds / 60)
  return seconds < 60
    ? copy(`${seconds} detik`, `${seconds} seconds`)
    : copy(`${minutes} menit`, `${minutes} minutes`)
}

/** Server error codes in the UI language; never a raw server message. */
export function trialErrorMessage(error: unknown, copy: Copy): string {
  if (!(error instanceof TrialApiError))
    return copy(
      'Terjadi kesalahan. Coba lagi.',
      'Something went wrong. Please try again.'
    )
  switch (error.code) {
    case 'TOO_MANY_REQUESTS':
      return copy(
        `Terlalu banyak percobaan. Coba lagi dalam ${wait(Number(error.detail.retryAfter), copy)}.`,
        `Too many attempts. Try again in ${wait(Number(error.detail.retryAfter), copy)}.`
      )
    case 'TEMPORARILY_UNAVAILABLE':
      return copy(
        'Layanan verifikasi sedang tidak tersedia. Coba beberapa saat lagi.',
        'Verification is temporarily unavailable. Please try again shortly.'
      )
    case 'CHALLENGE_FAILED':
      return copy(
        'Pemeriksaan keamanan gagal. Ulangi pemeriksaan, lalu coba lagi.',
        'The security check failed. Redo it, then try again.'
      )
    case 'INVALID_PHONE':
      return copy(
        'Masukkan nomor HP yang valid, misalnya 0812 3456 7890.',
        'Enter a valid mobile number, such as 0812 3456 7890.'
      )
    case 'PHONE_VERIFICATION_UNAVAILABLE':
      return copy(
        'Verifikasi nomor HP belum tersedia. Ajukan peninjauan sebagai gantinya.',
        'Phone verification is not available yet. Ask for a review instead.'
      )
    case 'INVALID_CODE':
      return copy(
        `Kode salah. Sisa ${Number(error.detail.attemptsRemaining)} percobaan.`,
        `That code is wrong. ${Number(error.detail.attemptsRemaining)} attempts left.`
      )
    case 'TOO_MANY_ATTEMPTS':
      return copy(
        'Terlalu banyak kode salah. Minta kode baru.',
        'Too many wrong codes. Request a new code.'
      )
    case 'CODE_EXPIRED':
      return copy(
        'Kode sudah kedaluwarsa. Minta kode baru.',
        'The code has expired. Request a new code.'
      )
    case 'INVALID_CHALLENGE':
      return copy('Minta kode baru.', 'Request a new code.')
    case 'REVIEW_NOT_APPLICABLE':
      return copy(
        'Akun ini tidak memerlukan peninjauan.',
        'This account does not need a review.'
      )
    default:
      return copy(
        'Terjadi kesalahan. Coba lagi.',
        'Something went wrong. Please try again.'
      )
  }
}

/** Codes after which the code step must start over with a new code. */
export const restartsPhoneStep = (error: unknown) =>
  error instanceof TrialApiError &&
  ['TOO_MANY_ATTEMPTS', 'CODE_EXPIRED', 'INVALID_CHALLENGE'].includes(
    error.code ?? ''
  )
