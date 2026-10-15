import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CreditCard, Loader2 } from '@/components/icons'
import { brandMark } from '@/features/checkout/components/card-form'
import { PaymentLogo } from '@/features/checkout/components/payment-logo'
import { formatDate } from '@/features/checkout/format'
import { findPaymentMethod } from '@/features/checkout/payment-methods'
import { brandLabel } from '../billing-labels'
import {
  useAutoRenewMutation,
  useRemoveCardMutation,
} from '../subscription.queries'
import type { BillingOverview } from '../subscription.types'
import { AddCardDialog } from './add-card-dialog'
import { BillingRow, BillingSection } from './billing-section'

const GENERIC_CARD = findPaymentMethod('CREDIT_CARD')

function expiryLabel(iso: string) {
  const date = new Date(iso)
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`
}

export function PaymentMethodSection({
  overview,
}: {
  overview: BillingOverview
}) {
  const copy = useCopy()
  const [adding, setAdding] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const autoRenew = useAutoRenewMutation()
  const remove = useRemoveCardMutation()
  const { card, cardSetup, renewal, subscription } = overview
  const mark = card ? (brandMark(card.brand) ?? GENERIC_CARD) : undefined
  // The token can't pay a renewal after the card itself expires.
  const expiresBeforeRenewal =
    !!card?.expiresAt &&
    !!renewal &&
    new Date(card.expiresAt).getTime() <= new Date(renewal.date).getTime()
  const error = autoRenew.error ?? remove.error

  return (
    <BillingSection
      labelledBy='billing-payment'
      title={copy('Metode pembayaran', 'Payment method')}
      description={copy(
        'Kartu tersimpan Anda ditagih untuk perpanjangan otomatis paket.',
        'Your saved card is charged for automatic plan renewals.'
      )}
      action={
        !card && (
          <Button
            variant='outline'
            onClick={() => setAdding(true)}
            disabled={!cardSetup}
          >
            {copy('Tambah kartu', 'Add card')}
          </Button>
        )
      }
    >
      {card ? (
        <BillingRow
          leading={
            mark ? (
              <PaymentLogo method={mark} size='sm' />
            ) : (
              <CreditCard className='size-5' />
            )
          }
          title={`${brandLabel(card.brand)} •••• ${card.last4}`}
          description={
            card.expiresAt
              ? copy(
                  `Berlaku hingga ${expiryLabel(card.expiresAt)}`,
                  `Expires ${expiryLabel(card.expiresAt)}`
                )
              : undefined
          }
          action={
            <>
              <Button
                variant='ghost'
                onClick={() => setConfirmRemove(true)}
                disabled={remove.isPending}
              >
                {copy('Hapus', 'Remove')}
              </Button>
              <Button
                variant='outline'
                onClick={() => setAdding(true)}
                disabled={!cardSetup}
              >
                {copy('Ganti', 'Update')}
              </Button>
            </>
          }
        />
      ) : (
        <p className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
          {cardSetup
            ? copy(
                'Belum ada kartu tersimpan. Tambahkan kartu agar paket diperpanjang otomatis, atau centang “Simpan kartu” saat membayar.',
                'No card saved. Add one to renew automatically, or tick “Save this card” when you pay by card.'
              )
            : copy(
                'Pembayaran kartu belum tersedia saat ini.',
                'Card payments aren’t available right now.'
              )}
        </p>
      )}

      <div className='border-t pt-4'>
        <BillingRow
          title={copy('Perpanjangan otomatis', 'Automatic renewal')}
          description={
            !card
              ? copy(
                  'Tambahkan kartu untuk memperpanjang paket tanpa membayar manual.',
                  'Add a card to renew your plan without paying manually.'
                )
              : card.autoCharge
                ? copy(
                    'Kami menagih kartu Anda 1 hari sebelum paket diperpanjang.',
                    'We charge your card 1 day before your plan renews.'
                  )
                : copy(
                    'Mati. Anda akan diingatkan untuk membayar sebelum paket berakhir.',
                    'Off. We’ll remind you to pay before your plan ends.'
                  )
          }
          action={
            <Button
              variant='outline'
              disabled={!card || autoRenew.isPending}
              onClick={() => card && autoRenew.mutate(!card.autoCharge)}
            >
              {autoRenew.isPending && (
                <Loader2 className='size-4 animate-spin' />
              )}
              {card?.autoCharge
                ? copy('Matikan', 'Turn off')
                : copy('Nyalakan', 'Turn on')}
            </Button>
          }
        />
        {card?.autoCharge && expiresBeforeRenewal && subscription && (
          <p className='text-destructive mt-3 flex gap-2 text-sm'>
            <AlertTriangle className='mt-0.5 size-4 shrink-0' />
            {copy(
              `Kartu ini kedaluwarsa sebelum ${formatDate(renewal!.date)}. Ganti kartu agar paket tetap diperpanjang.`,
              `This card expires before ${formatDate(renewal!.date)}. Update it so your plan keeps renewing.`
            )}
          </p>
        )}
      </div>
      {error && (
        <p role='alert' className='text-destructive text-sm'>
          {error.message}
        </p>
      )}

      {cardSetup && (
        <AddCardDialog
          open={adding}
          onOpenChange={setAdding}
          setup={cardSetup}
          replacing={!!card}
        />
      )}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy('Hapus kartu ini?', 'Remove this card?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy(
                'Paket Anda tidak lagi diperpanjang otomatis. Kami akan mengingatkan Anda untuk membayar sebelum paket berakhir.',
                'Your plan won’t renew automatically any more. We’ll remind you to pay before it ends.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy('Batal', 'Keep card')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>
              {copy('Hapus kartu', 'Remove card')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BillingSection>
  )
}
