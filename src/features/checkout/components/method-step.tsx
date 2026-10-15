import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from '@/components/icons'
import type { PaymentType } from '@/features/settings/subscription/subscription.types'
import {
  PAYMENT_METHOD_GROUPS,
  findPaymentMethod,
  type PaymentMethodGroup,
} from '../payment-methods'
import { PaymentLogo } from './payment-logo'

export function MethodStep({
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: {
  isSubmitting: boolean
  error: string
  onBack?: () => void
  onSubmit: (method: PaymentType) => void
}) {
  const copy = useCopy()
  const [method, setMethod] = useState<PaymentType | ''>('')
  const [openGroup, setOpenGroup] = useState<PaymentMethodGroup['id'] | null>(
    null
  )
  const selected = findPaymentMethod(method)

  function toggle(group: PaymentMethodGroup) {
    const opening = openGroup !== group.id
    setOpenGroup(opening ? group.id : null)
    // A category with one method has nothing left to choose once opened.
    if (opening && group.methods.length === 1) setMethod(group.methods[0].value)
  }

  return (
    <section className='space-y-6' aria-labelledby='method-heading'>
      <div className='space-y-1.5'>
        <h1 id='method-heading' className='text-2xl font-bold tracking-tight'>
          {copy('Bagaimana Anda ingin membayar?', 'How would you like to pay?')}
        </h1>
        <p className='text-muted-foreground'>
          {copy(
            'Paket berubah segera setelah pembayaran diterima.',
            'Your plan changes as soon as the payment arrives.'
          )}
        </p>
      </div>

      <RadioGroup
        aria-label={copy('Cara bayar', 'Payment method')}
        disabled={isSubmitting}
        value={method}
        onValueChange={(value) => setMethod(value as PaymentType)}
        className='bg-card gap-0 divide-y overflow-hidden rounded-xl border'
      >
        {PAYMENT_METHOD_GROUPS.map((group) => {
          const open = openGroup === group.id
          const chosen = group.methods.find((item) => item.value === method)
          const panelId = `pay-group-${group.id}`
          return (
            <div key={group.id}>
              <button
                type='button'
                aria-expanded={open}
                aria-controls={panelId}
                disabled={isSubmitting}
                onClick={() => toggle(group)}
                className='hover:bg-muted/40 focus-visible:ring-ring flex w-full items-center gap-3 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset'
              >
                <span className='min-w-0 flex-1'>
                  <span className='block font-semibold'>
                    {copy(...group.label)}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 flex items-center gap-1.5 text-xs',
                      chosen ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {chosen && !open ? (
                      <>
                        <CheckCircle2 className='text-leaf size-3.5' />
                        {chosen.name ? copy(...chosen.name) : chosen.label}
                      </>
                    ) : (
                      copy(...group.window)
                    )}
                  </span>
                  <LogoStrip group={group} className='mt-2.5 sm:hidden' />
                </span>
                <LogoStrip group={group} className='hidden sm:flex' />
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'text-muted-foreground size-4 shrink-0 transition-transform',
                    open && 'rotate-180'
                  )}
                />
              </button>

              {open && (
                <div
                  id={panelId}
                  className='bg-muted/40 space-y-2 border-t px-3 py-3'
                >
                  {group.methods.map((item) => (
                    <label
                      key={item.value}
                      htmlFor={item.value}
                      className='bg-background has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:ring-foreground hover:border-foreground/40 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 has-[[data-state=checked]]:ring-1'
                    >
                      <PaymentLogo method={item} />
                      <span className='min-w-0 flex-1'>
                        <span className='block text-sm font-medium'>
                          {item.name ? copy(...item.name) : item.label}
                        </span>
                        <span className='text-muted-foreground block text-xs'>
                          {copy(...item.detail)}
                        </span>
                      </span>
                      <RadioGroupItem value={item.value} id={item.value} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </RadioGroup>

      {error && (
        <p
          role='alert'
          className='border-destructive/40 text-destructive flex gap-2 rounded-lg border p-3 text-sm'
        >
          <AlertCircle className='mt-0.5 size-4 shrink-0' />
          {error}
        </p>
      )}

      <div className='flex flex-col-reverse gap-2 sm:flex-row'>
        {onBack && (
          <Button
            variant='ghost'
            size='lg'
            onClick={onBack}
            disabled={isSubmitting}
          >
            {copy('Kembali', 'Back')}
          </Button>
        )}
        <Button
          size='lg'
          className='flex-1'
          disabled={!selected || isSubmitting}
          onClick={() => selected && onSubmit(selected.value)}
        >
          {isSubmitting && <Loader2 className='size-4 animate-spin' />}
          {isSubmitting
            ? copy('Menyiapkan pembayaran…', 'Preparing payment…')
            : selected
              ? selected.cta
                ? copy(...selected.cta)
                : copy(
                    `Lanjut dengan ${selected.label}`,
                    `Continue with ${selected.label}`
                  )
              : copy('Pilih cara bayar', 'Choose a payment method')}
        </Button>
      </div>
    </section>
  )
}

/** Category marks: beside the title on wider screens, under it on phones. */
function LogoStrip({
  group,
  className,
}: {
  group: PaymentMethodGroup
  className?: string
}) {
  return (
    <span
      className={cn('flex shrink-0 flex-wrap items-center gap-1', className)}
    >
      {group.methods
        .flatMap((item) => item.brands ?? [item])
        .map((mark) => (
          <PaymentLogo key={mark.label} method={mark} size='sm' />
        ))}
    </span>
  )
}
