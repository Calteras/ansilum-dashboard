import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
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
import { AlertCircle, Loader2, Lock } from '@/components/icons'
import { CardFields } from '@/features/checkout/components/card-fields'
import { useCardForm } from '@/features/checkout/components/card-form'
import { loadMidtrans } from '@/features/checkout/midtrans'
import { useSaveCardMutation } from '../subscription.queries'
import type { BillingOverview } from '../subscription.types'

/**
 * Saves a card for automatic renewals without charging it. Midtrans registers the card in
 * the browser and returns a saved token; only that token and the masked number reach Ansilum.
 */
export function AddCardDialog({
  open,
  onOpenChange,
  setup,
  replacing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  setup: NonNullable<BillingOverview['cardSetup']>
  replacing: boolean
}) {
  const copy = useCopy()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-5 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {replacing
              ? copy('Ganti kartu', 'Update card')
              : copy('Tambah kartu', 'Add card')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Kartu ini dipakai untuk perpanjangan otomatis. Anda tidak ditagih sekarang.',
              'This card is used for automatic renewals. You won’t be charged now.'
            )}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted on every open, so no card details linger between uses. */}
        {open && <CardForm setup={setup} onSaved={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CardForm({
  setup,
  onSaved,
}: {
  setup: NonNullable<BillingOverview['cardSetup']>
  onSaved: () => void
}) {
  const copy = useCopy()
  const form = useCardForm()
  const save = useSaveCardMutation()
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const busy = registering || save.isPending

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const details = form.submit()
    if (busy || !details) return
    setRegistering(true)
    let registered: { savedTokenId: string; maskedCard: string }
    try {
      const api = await loadMidtrans(setup)
      registered = await new Promise((resolve, reject) =>
        api.registerCard(details, {
          onSuccess: (response) =>
            response.saved_token_id && response.masked_card
              ? resolve({
                  savedTokenId: response.saved_token_id,
                  maskedCard: response.masked_card,
                })
              : reject(new Error('No saved token')),
          onFailure: () => reject(new Error('Registration failed')),
        })
      )
    } catch {
      setRegistering(false)
      setError(
        copy(
          'Kartu ini tidak bisa disimpan. Periksa detailnya, lalu coba lagi.',
          'We couldn’t save this card. Check the details and try again.'
        )
      )
      return
    }
    form.clear()
    setRegistering(false)
    save.mutate(
      {
        ...registered,
        expMonth: Number(details.card_exp_month),
        expYear: Number(details.card_exp_year),
      },
      {
        onSuccess: () => {
          toast.success(copy('Kartu disimpan', 'Card saved'))
          onSaved()
        },
        onError: (saveError) => setError(saveError.message),
      }
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className='space-y-5'>
      <CardFields form={form} disabled={busy} idPrefix='billing-card' />
      {error && (
        <p
          role='alert'
          className='border-destructive/40 text-destructive flex gap-2 rounded-lg border p-3 text-sm'
        >
          <AlertCircle className='mt-0.5 size-4 shrink-0' />
          {error}
        </p>
      )}
      <p className='text-muted-foreground flex gap-2 text-xs'>
        <Lock className='mt-0.5 size-3.5 shrink-0' />
        {copy(
          'Detail kartu langsung diproses Midtrans dan tidak pernah disimpan Ansilum.',
          'Card details go straight to Midtrans and are never stored by Ansilum.'
        )}
      </p>
      <DialogFooter>
        <Button type='submit' disabled={busy}>
          {busy && <Loader2 className='size-4 animate-spin' />}
          {copy('Simpan kartu', 'Save card')}
        </Button>
      </DialogFooter>
    </form>
  )
}
