import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from '@/components/icons'
import { formatDate } from '@/features/checkout/format'
import { useCancelSubscriptionMutation } from '../subscription.queries'
import type { BillingOverview } from '../subscription.types'
import { BillingSection } from './billing-section'

/** Cancelling stops renewals; the plan stays until the period that was paid for ends. */
export function CancelPlanSection({
  subscription,
}: {
  subscription: NonNullable<BillingOverview['subscription']>
}) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useCancelSubscriptionMutation()
  const end = formatDate(subscription.currentPeriodEnd)

  function confirm() {
    cancel.mutate(reason.trim() || undefined, {
      onSuccess: () => {
        setOpen(false)
        setReason('')
        toast.success(
          copy(
            `Langganan dibatalkan. Paket tetap aktif hingga ${end}.`,
            `Subscription cancelled. Your plan stays active until ${end}.`
          )
        )
      },
    })
  }

  return (
    <BillingSection
      labelledBy='billing-cancel'
      className='border-t pt-8'
      title={copy('Batalkan langganan', 'Cancel subscription')}
      description={copy(
        `Fitur ${subscription.planName} tetap bisa dipakai hingga ${end}. Setelah itu akun Anda kembali ke Basic, dan data Anda tetap tersimpan.`,
        `You keep ${subscription.planName} features until ${end}. After that your account moves to Basic, and your data is kept.`
      )}
      action={
        <Button
          variant='outline'
          className='text-destructive hover:text-destructive'
          onClick={() => setOpen(true)}
        >
          {copy('Batalkan paket', 'Cancel plan')}
        </Button>
      }
    >
      <Dialog
        open={open}
        onOpenChange={(next) => !cancel.isPending && setOpen(next)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {copy('Batalkan langganan?', 'Cancel your subscription?')}
            </DialogTitle>
            <DialogDescription>
              {copy(
                `Paket tidak akan diperpanjang. Anda tetap bisa memakainya hingga ${end}, dan bisa melanjutkannya kapan saja sebelum tanggal itu.`,
                `Your plan won’t renew. You can keep using it until ${end}, and resume any time before then.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='cancel-reason'>
              {copy(
                'Apa alasan Anda? (opsional)',
                'Why are you cancelling? (optional)'
              )}
            </Label>
            <Textarea
              id='cancel-reason'
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              disabled={cancel.isPending}
            />
          </div>
          {cancel.isError && (
            <p role='alert' className='text-destructive text-sm'>
              {cancel.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={cancel.isPending}
            >
              {copy('Tetap berlangganan', 'Keep plan')}
            </Button>
            <Button
              variant='destructive'
              onClick={confirm}
              disabled={cancel.isPending}
            >
              {cancel.isPending && <Loader2 className='size-4 animate-spin' />}
              {copy('Batalkan paket', 'Cancel plan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BillingSection>
  )
}
