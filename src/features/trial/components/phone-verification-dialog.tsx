import { useCallback, useEffect, useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileChallenge } from '@/features/auth/components/turnstile-challenge'
import type { PhoneChallenge } from '../api/trial.api'
import {
  useConfirmPhoneCodeMutation,
  useRequestPhoneCodeMutation,
} from '../api/trial.queries'
import { restartsPhoneStep, trialErrorMessage } from '../lib/trial'

const challengeConfigured = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

/** Two steps: send a code to a mobile number, then type it back. */
export function PhoneVerificationDialog({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}) {
  const copy = useCopy()
  const request = useRequestPhoneCodeMutation()
  const confirm = useConfirmPhoneCodeMutation()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const onToken = useCallback((value: string | null) => setToken(value), [])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const reset = () => {
    setChallenge(null)
    setCode('')
    setError(null)
  }

  const send = async () => {
    setError(null)
    try {
      const sent = await request.mutateAsync({
        phone,
        challengeToken: token ?? undefined,
      })
      setChallenge(sent)
      setResendIn(sent.resendAfterSeconds)
      setCode('')
    } catch (e) {
      setError(trialErrorMessage(e, copy))
    }
  }

  const verify = async () => {
    if (!challenge) return
    setError(null)
    try {
      await confirm.mutateAsync({ challengeId: challenge.challengeId, code })
      onVerified()
      onOpenChange(false)
    } catch (e) {
      setError(trialErrorMessage(e, copy))
      if (restartsPhoneStep(e)) setChallenge(null)
    }
  }

  const busy = request.isPending || confirm.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {copy('Verifikasi nomor HP', 'Verify your mobile number')}
          </DialogTitle>
          <DialogDescription>
            {challenge
              ? copy(
                  `Masukkan 6 digit kode yang dikirim ke ${challenge.phone}.`,
                  `Enter the 6-digit code sent to ${challenge.phone}.`
                )
              : copy(
                  'Kami mengirim kode sekali pakai untuk memastikan nomor ini milik Anda. Nomor disimpan tersamarkan.',
                  'We send a one-time code to confirm the number is yours. It is stored masked.'
                )}
          </DialogDescription>
        </DialogHeader>

        {challenge ? (
          <form
            id='phone-verify-form'
            className='grid gap-2'
            onSubmit={(e) => {
              e.preventDefault()
              void verify()
            }}
          >
            <Label htmlFor='otp-code'>{copy('Kode', 'Code')}</Label>
            <Input
              id='otp-code'
              inputMode='numeric'
              autoComplete='one-time-code'
              maxLength={6}
              className='w-40 text-lg tracking-[0.3em] tabular-nums'
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <div className='text-fg-muted flex flex-wrap items-center gap-x-3 text-[13px]'>
              {resendIn > 0 ? (
                <span>
                  {copy(
                    `Kirim ulang dalam ${resendIn} detik`,
                    `Resend in ${resendIn}s`
                  )}
                </span>
              ) : (
                <button
                  type='button'
                  className='text-foreground underline-offset-4 hover:underline'
                  onClick={reset}
                >
                  {copy(
                    'Kirim ulang atau ganti nomor',
                    'Resend or change number'
                  )}
                </button>
              )}
            </div>
          </form>
        ) : (
          <form
            id='phone-request-form'
            className='grid gap-3'
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <div className='grid gap-2'>
              <Label htmlFor='phone-number'>
                {copy('Nomor HP', 'Mobile number')}
              </Label>
              <Input
                id='phone-number'
                type='tel'
                inputMode='tel'
                autoComplete='tel'
                placeholder='0812 3456 7890'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={24}
              />
            </div>
            {challengeConfigured && (
              <TurnstileChallenge onToken={onToken} action='phone_verify' />
            )}
          </form>
        )}

        {error && (
          <p role='alert' className='text-status-danger text-[13px]'>
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          {challenge ? (
            <Button
              type='submit'
              form='phone-verify-form'
              disabled={busy || code.length !== 6}
            >
              {confirm.isPending
                ? copy('Memeriksa…', 'Checking…')
                : copy('Verifikasi', 'Verify')}
            </Button>
          ) : (
            <Button
              type='submit'
              form='phone-request-form'
              disabled={
                busy ||
                phone.trim().length < 8 ||
                (challengeConfigured && !token)
              }
            >
              {request.isPending
                ? copy('Mengirim…', 'Sending…')
                : copy('Kirim kode', 'Send code')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
