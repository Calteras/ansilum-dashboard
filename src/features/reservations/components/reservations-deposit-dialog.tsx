'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Reservation } from '../api/reservations.types'
import { useAddDepositMutation } from '../api/reservations.queries'

const depositSchema = z.object({
  amount: z.coerce
    .number()
    .min(1, 'Deposit amount must be at least 1.'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
})

type DepositForm = z.infer<typeof depositSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

export function ReservationsDepositDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const depositMutation = useAddDepositMutation()
  const isLoading = depositMutation.isPending

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema) as any,
    defaultValues: { amount: 0, paymentMethod: 'CASH' },
  })

  const onSubmit = async (values: DepositForm) => {
    try {
      await depositMutation.mutateAsync({
        id: currentRow.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
      })
      form.reset()
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isLoading) {
          form.reset()
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>Add Deposit</DialogTitle>
          <DialogDescription>
            Add a deposit to reservation{' '}
            <span className='font-semibold'>{currentRow.transactionNo}</span>.
            Current deposit:{' '}
            <span className='font-semibold'>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(currentRow.depositAmount)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='deposit-form'
            onSubmit={form.handleSubmit(onSubmit as any)}
            className='space-y-4'
          >
            <FormField<DepositForm>
              control={form.control as any}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Enter deposit amount'
                      min={1}
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<DepositForm>
              control={form.control as any}
              name='paymentMethod'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select payment method' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='CASH'>Cash</SelectItem>
                      <SelectItem value='QRIS'>QRIS</SelectItem>
                      <SelectItem value='DEBIT_CARD'>Debit Card</SelectItem>
                      <SelectItem value='CREDIT_CARD'>Credit Card</SelectItem>
                      <SelectItem value='E_WALLET'>E-Wallet</SelectItem>
                      <SelectItem value='BANK_TRANSFER'>Bank Transfer</SelectItem>
                      <SelectItem value='OTHER'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='deposit-form' disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Deposit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
