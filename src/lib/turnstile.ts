export interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
  'timeout-callback': () => void
  'response-field': boolean
}
export interface TurnstileAPI {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}
let loading: Promise<TurnstileAPI> | undefined
export function loadTurnstile(): Promise<TurnstileAPI> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileAPI>((resolve, reject) => {
    const script = document.createElement('script')
    const fail = () => {
      clearTimeout(timeout)
      script.remove()
      loading = undefined
      reject(new Error('Security check could not load.'))
    }
    const timeout = window.setTimeout(fail, 15_000)
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      if (!window.turnstile) return fail()
      clearTimeout(timeout)
      resolve(window.turnstile)
    }
    script.onerror = fail
    document.head.appendChild(script)
  })
  return loading
}
