import { UiText } from '@/components/ui-text'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AuthRequestError,
  logoutApi,
  resendVerificationApi,
} from '../api/auth.api'
import { TurnstileChallenge } from '../components/turnstile-challenge'
import { useChallenge } from '../hooks/use-challenge'
import { useCooldown } from '../hooks/use-cooldown'
import {
  readPendingVerification,
  savePendingVerification,
} from './pending-email'

export function ResendForm() {
  const queryClient = useQueryClient()
  const [saved] = useState(readPendingVerification)
  const [email, setEmail] = useState(saved.email)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sessionConflict, setSessionConflict] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const signOutLock = useRef(false)
  const challenge = useChallenge()
  const cooldown = useCooldown(saved.deadline)

  const signOutForVerification = async () => {
    if (signOutLock.current || challenge.pending) return
    signOutLock.current = true
    setSigningOut(true)
    setError('')
    setMessage('')
    challenge.onToken(null)
    savePendingVerification(email.trim())
    try {
      await logoutApi()
      await queryClient.cancelQueries()
      useAuthStore.getState().clearAuth()
      queryClient.clear()
      setSessionConflict(false)
      setMessage(
        'Signed out. Complete a new security check, then resend your verification email.'
      )
    } catch {
      setError(
        'We could not confirm sign-out completed. Please try signing out again.'
      )
    } finally {
      signOutLock.current = false
      setSigningOut(false)
    }
  }

  return (
    <form
      className='space-y-4'
      aria-busy={challenge.pending || signingOut}
      onSubmit={(event) => {
        event.preventDefault()
        if (sessionConflict || signOutLock.current || cooldown.isCoolingDown())
          return
        void challenge.run(async (token) => {
          setError('')
          setMessage('')
          try {
            await resendVerificationApi(email.trim(), token)
            const deadline = Date.now() + 60_000
            cooldown.setDeadline(deadline)
            savePendingVerification(email.trim(), deadline)
            setMessage(
              'If this account needs verification, a verification email will be sent. Check your inbox and spam folder.'
            )
          } catch (err) {
            if (
              err instanceof AuthRequestError &&
              err.code === 'EMAIL_MISMATCH'
            ) {
              savePendingVerification(email.trim())
              setSessionConflict(true)
            }
            if (err instanceof AuthRequestError && err.status === 429) {
              cooldown.setDeadline(err.retryAt)
              savePendingVerification(email.trim(), err.retryAt)
            }
            setError(
              err instanceof AuthRequestError
                ? err.message
                : 'We could not confirm the request completed. Please try again.'
            )
          }
        })
      }}
    >
      <div className='space-y-2'>
        <Label htmlFor='verification-email'><UiText id="Alamat email" en="Email address" /></Label>
        <Input
          id='verification-email'
          type='email'
          autoComplete='email'
          required
          value={email}
          disabled={challenge.pending || signingOut}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      {!challenge.pending && !sessionConflict && !signingOut && (
        <TurnstileChallenge
          key={challenge.generation}
          onToken={challenge.onToken}
        />
      )}
      {error && (
        <p role='alert' className='text-destructive text-sm'>
          {error}
        </p>
      )}
      {sessionConflict && (
        <Button
          type='button'
          variant='outline'
          className='w-full'
          disabled={signingOut}
          onClick={() => void signOutForVerification()}
        >
          {signingOut ? 'Signing out…' : 'Sign out of current account'}
        </Button>
      )}
      {signingOut && (
        <p role='status' className='text-sm'><UiText id="Keluar dari akun…" en="Signing out of the current account…" /></p>
      )}
      {message && (
        <p role='status' className='text-sm'>
          {message}
        </p>
      )}
      {cooldown.remaining > 0 && (
        <p role='status' className='text-muted-foreground text-sm'>
          You can try again in {cooldown.remaining}<UiText id="detik." en="seconds." /></p>
      )}
      <Button
        className='w-full'
        disabled={
          !challenge.ready ||
          challenge.pending ||
          sessionConflict ||
          signingOut ||
          cooldown.remaining > 0
        }
      >
        {challenge.pending
          ? 'Requesting verification…'
          : 'Resend verification email'}
      </Button>
    </form>
  )
}
