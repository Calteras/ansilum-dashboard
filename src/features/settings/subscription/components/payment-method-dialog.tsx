import { UiText } from '@/components/ui-text'
import { formatMoney } from '@/lib/format'
import { useState } from 'react'
import { Loader2 } from '@/components/icons'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import type { SubscriptionPlan } from '../subscription.types'

const PAYMENT_METHOD_GROUPS = [
  {
    label: 'E-Wallet & QRIS',
    methods: [
      {
        value: 'QRIS',
        label: 'QRIS',
        description: 'Pay with GoPay, OVO, Dana, ShopeePay, or any QRIS app',
      },
      {
        value: 'GOPAY',
        label: 'GoPay',
        description: 'Pay directly via GoPay app',
      },
    ],
  },
  {
    label: 'Bank Transfer',
    methods: [
      {
        value: 'BANK_TRANSFER_BCA',
        label: 'BCA Virtual Account',
        description: undefined,
      },
      {
        value: 'BANK_TRANSFER_BNI',
        label: 'BNI Virtual Account',
        description: undefined,
      },
      {
        value: 'BANK_TRANSFER_MANDIRI',
        label: 'Mandiri Bill Payment',
        description: undefined,
      },
    ],
  },
] as const

const formatPrice = formatMoney

interface PaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SubscriptionPlan
  isYearly: boolean
  isLoading: boolean
  error?: string
  onSubmit: (paymentType: string) => void
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  plan,
  isYearly,
  isLoading,
  onSubmit,
  error,
}: PaymentMethodDialogProps) {
  const [paymentType, setPaymentType] = useState<string>('')
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const billingLabel = isYearly ? 'yearly' : 'monthly'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isLoading) onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={!isLoading}
        className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'
      >
        <DialogHeader>
          <DialogTitle><UiText id="Periksa pilihan paket Anda" en="Review your upgrade" /></DialogTitle>
          <DialogDescription><UiText id="Pilih cara pembayaran. Paket berubah setelah pembayaran dikonfirmasi." en="Choose how to pay. Your plan changes after payment is confirmed." /></DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1 rounded-lg border p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'><UiText id="Paket" en="Plan" /></span>
              <span className='font-medium'>{plan.name}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'><UiText id="Tagihan" en="Billing" /></span>
              <span className='font-medium capitalize'>{billingLabel}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'><UiText id="Total tagihan periode ini" en="Total for this billing period" /></span>
              <span className='font-semibold'>{formatPrice(price)}</span>
            </div>
          </div>

          <Separator />

          <RadioGroup
            aria-label='Payment method'
            disabled={isLoading}
            value={paymentType}
            onValueChange={setPaymentType}
          >
            <div className='space-y-5'>
              {PAYMENT_METHOD_GROUPS.map((group) => (
                <div key={group.label} className='space-y-2'>
                  <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    {group.label}
                  </Label>
                  <div className='space-y-1.5'>
                    {group.methods.map((method) => (
                      <label
                        key={method.value}
                        htmlFor={method.value}
                        className='hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start space-x-3 rounded-lg border p-3'
                      >
                        <RadioGroupItem
                          value={method.value}
                          id={method.value}
                          className='mt-0.5'
                        />
                        <div className='flex-1 space-y-0.5'>
                          <div className='text-sm font-medium'>
                            {method.label}
                          </div>
                          {method.description && (
                            <div className='text-muted-foreground text-xs'>
                              {method.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {error && (
          <p
            role='alert'
            className='text-destructive border-destructive/30 rounded-lg border p-3 text-sm'
          >
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          ><UiText id="Kembali ke paket" en="Back to plans" /></Button>
          <Button
            onClick={() => onSubmit(paymentType)}
            disabled={!paymentType || isLoading}
          >
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isLoading
              ? 'Preparing payment…'
              : `Continue · ${formatPrice(price)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
