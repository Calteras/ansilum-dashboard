import { UiText } from '@/components/ui-text'
import { useEffect, useRef, useState } from 'react'
import { loadTurnstile, type TurnstileAPI } from '@/lib/turnstile'
import { Button } from '@/components/ui/button'

export function TurnstileChallenge({
  onToken,
}: {
  onToken: (token: string | null) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('Loading security check…')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let disposed = false
    let api: TurnstileAPI | undefined
    let widget: string | undefined
    const fail = (message: string) => {
      if (disposed) return
      onToken(null)
      setStatus(message)
      setFailed(true)
    }
    const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!sitekey) {
      fail('Security check is unavailable. Please contact support.')
      return
    }
    loadTurnstile()
      .then((loaded) => {
        if (disposed || !container.current) return
        api = loaded
        setStatus('Complete the security check to continue.')
        widget = api.render(container.current, {
          sitekey,
          'response-field': false,
          callback: (token) => {
            if (disposed) return
            onToken(token)
            setFailed(false)
            setStatus('Security check complete.')
          },
          'expired-callback': () =>
            fail('Security check expired. Please try again.'),
          'error-callback': () =>
            fail('Security check failed. Please try again.'),
          'timeout-callback': () =>
            fail('Security check timed out. Please try again.'),
        })
      })
      .catch(() =>
        fail(
          'Security check could not load. Check your connection and try again.'
        )
      )
    return () => {
      disposed = true
      onToken(null)
      if (widget !== undefined) api?.remove(widget)
    }
  }, [attempt, onToken])
  return (
    <div className='space-y-2'>
      <div ref={container} />
      <p
        role={failed ? 'alert' : 'status'}
        className='text-muted-foreground text-sm'
      >
        {status}
      </p>
      {failed && (
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setFailed(false)
            setStatus('Loading security check…')
            setAttempt((value) => value + 1)
          }}
        ><UiText id="Ulangi pemeriksaan keamanan" en="Retry security check" /></Button>
      )}
    </div>
  )
}
