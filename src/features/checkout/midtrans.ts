import type { CardSession } from '@/features/settings/subscription/subscription.types'

/** Only Midtrans' own 3DS script may load, whatever the API returns. */
const MIDTRANS_SCRIPTS = new Set([
  'https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js',
  'https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js',
])

let loading: Promise<MidtransNew3dsApi> | null = null

/** Loads Midtrans' 3DS script once. It draws nothing; it tokenizes cards and runs 3-D Secure. */
export function loadMidtrans(
  card: Pick<CardSession, 'clientKey' | 'environment' | 'scriptUrl'>
): Promise<MidtransNew3dsApi> {
  if (window.MidtransNew3ds) return Promise.resolve(window.MidtransNew3ds)
  if (!MIDTRANS_SCRIPTS.has(card.scriptUrl) || !card.clientKey)
    return Promise.reject(new Error('Unexpected card payment configuration'))
  loading ??= new Promise<MidtransNew3dsApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'midtrans-script'
    script.src = card.scriptUrl
    script.async = true
    script.dataset.environment = card.environment
    script.dataset.clientKey = card.clientKey
    script.onload = () =>
      window.MidtransNew3ds
        ? resolve(window.MidtransNew3ds)
        : reject(new Error('Midtrans unavailable'))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Midtrans failed to load'))
    }
    document.head.appendChild(script)
  })
  return loading
}
