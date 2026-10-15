import { useState, type FormEvent } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Lock, Shield } from '@/components/icons'
import { useChargeCardMutation } from '@/features/settings/subscription/subscription.queries'
import type { CardSession } from '@/features/settings/subscription/subscription.types'
import { loadMidtrans } from '../midtrans'
import { CardFields } from './card-fields'
import { useCardForm } from './card-form'

interface CardPaymentProps {
  orderId: string
  amount: number | string
  card: CardSession
  onCheck: () => void
}

/**
 * Card entry in Ansilum's own form. The number is tokenized by Midtrans in the browser and
 * only the single-use token is sent to Ansilum; the bank's 3-D Secure page opens in a dialog.
 */
export function CardPayment({
  orderId,
  amount,
  card,
  onCheck,
}: CardPaymentProps) {
  const copy = useCopy()
  const charge = useChargeCardMutation()
  const form = useCardForm()
  const [saveCard, setSaveCard] = useState(true)
  const [tokenizing, setTokenizing] = useState(false)
  const [formError, setFormError] = useState('')
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null)
  const busy = tokenizing || charge.isPending

  function finishAuthentication() {
    setChallengeUrl(null)
    onCheck()
  }

  function authenticate(url: string) {
    loadMidtrans(card)
      .then((api) =>
        api.authenticate(url, {
          performAuthentication: setChallengeUrl,
          onSuccess: finishAuthentication,
          onFailure: finishAuthentication,
          onPending: finishAuthentication,
        })
      )
      // Without the script the bank page still works; this page's poller reads the result.
      .catch(() => setChallengeUrl(url))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    const details = form.submit()
    if (busy || !details) return
    setTokenizing(true)
    let tokenId: string
    try {
      const api = await loadMidtrans(card)
      tokenId = await new Promise<string>((resolve, reject) =>
        api.getCardToken(details, {
          onSuccess: (response) =>
            response.token_id
              ? resolve(response.token_id)
              : reject(new Error('No token')),
          onFailure: () => reject(new Error('Tokenization failed')),
        })
      )
    } catch {
      setTokenizing(false)
      setFormError(
        copy(
          'Kartu ini tidak bisa diverifikasi. Periksa detailnya, lalu coba lagi.',
          'We couldn’t verify this card. Check the details and try again.'
        )
      )
      return
    }
    // The details have served their purpose; don't keep them around.
    form.clear()
    setTokenizing(false)
    charge.mutate(
      { orderId, tokenId, saveCard },
      {
        onSuccess: (response) => {
          const url = response.data.card?.authenticationUrl
          if (url) authenticate(url)
          else onCheck()
        },
        onError: (error) => setFormError(error.message),
      }
    )
  }

  const challenge = (
    <Dialog
      open={!!challengeUrl}
      onOpenChange={(open) => !open && finishAuthentication()}
    >
      <DialogPortal>
        <DialogOverlay />
        {/* The bank's page is shown bare. Its size can't be measured across origins, so the
            frame uses the EMV 3-D Secure 2 challenge window (500×600), shrinking on small screens. */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-1/2 left-1/2 z-50 h-[min(600px,100dvh)] w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 outline-none'
        >
          <DialogTitle className='sr-only'>
            {copy('Konfirmasi dengan bank Anda', 'Confirm with your bank')}
          </DialogTitle>
          {challengeUrl && (
            <iframe
              src={challengeUrl}
              title={copy('Verifikasi 3-D Secure', '3-D Secure verification')}
              className='block size-full border-0 bg-white'
            />
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )

  if (card.charged) {
    return (
      <div className='space-y-3 rounded-lg border p-4 text-sm'>
        {card.authenticationUrl ? (
          <>
            <p className='flex gap-2'>
              <Shield className='mt-0.5 size-4 shrink-0' />
              {copy(
                'Kartu Anda sudah dikirim. Selesaikan konfirmasi dari bank untuk menyelesaikan pembayaran.',
                'Your card was submitted. Finish your bank’s confirmation to complete the payment.'
              )}
            </p>
            <Button onClick={() => authenticate(card.authenticationUrl!)}>
              {copy('Lanjutkan konfirmasi bank', 'Continue bank confirmation')}
            </Button>
          </>
        ) : (
          <p className='text-muted-foreground flex items-center gap-2'>
            <Loader2 className='size-4 animate-spin' />
            {copy('Memproses kartu Anda…', 'Processing your card…')}
          </p>
        )}
        {challenge}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className='space-y-5'>
      <CardFields form={form} disabled={busy} />

      <div className='flex items-start gap-2.5'>
        <Checkbox
          id='card-save'
          checked={saveCard}
          onCheckedChange={(checked) => setSaveCard(checked === true)}
          disabled={busy}
          className='mt-0.5'
        />
        <Label htmlFor='card-save' className='block leading-snug font-normal'>
          {copy(
            'Simpan kartu ini untuk perpanjangan otomatis',
            'Save this card for automatic renewal'
          )}
          <span className='text-muted-foreground mt-0.5 block text-xs'>
            {copy(
              'Kami menagihnya sebelum paket Anda berakhir. Matikan kapan saja di pengaturan tagihan.',
              'We charge it before your plan ends. Turn it off any time in billing settings.'
            )}
          </span>
        </Label>
      </div>

      {formError && (
        <p
          role='alert'
          className='border-destructive/40 text-destructive flex gap-2 rounded-lg border p-3 text-sm'
        >
          <AlertCircle className='mt-0.5 size-4 shrink-0' />
          {formError}
        </p>
      )}

      <Button type='submit' size='lg' className='w-full' disabled={busy}>
        {busy && <Loader2 className='size-4 animate-spin' />}
        {tokenizing
          ? copy('Memeriksa kartu…', 'Checking card…')
          : charge.isPending
            ? copy('Menagih kartu…', 'Charging card…')
            : copy(
                `Bayar ${formatMoney(amount)}`,
                `Pay ${formatMoney(amount)}`
              )}
      </Button>

      <p className='text-muted-foreground flex gap-2 text-xs'>
        <Lock className='mt-0.5 size-3.5 shrink-0' />
        {copy(
          'Detail kartu langsung diproses Midtrans dan tidak pernah disimpan Ansilum. Bank Anda mungkin meminta kode sekali pakai.',
          'Card details go straight to Midtrans and are never stored by Ansilum. Your bank may ask for a one-time code.'
        )}
      </p>
      {challenge}
    </form>
  )
}
