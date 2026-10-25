import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdjustPointsMutation,
  useCustomerStatusMutation,
  useSaveCustomerMutation,
} from '../api/loyalty.queries'
import type { Customer } from '../api/loyalty.types'
import { formatPoints, parseTags } from '../lib/loyalty'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Add / edit ───────────────────────────────────────────────────────────────

export function CustomerFormDialog({
  customer,
  open,
  onOpenChange,
  onSaved,
}: DialogProps & {
  customer?: Customer
  onSaved?: (customer: Customer) => void
}) {
  const copy = useCopy()
  const save = useSaveCustomerMutation()
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, copy('Nama wajib diisi.', 'Name is required.')),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[\d\s-]{7,20}$/,
        copy('Masukkan nomor HP yang valid.', 'Enter a valid phone number.')
      ),
    email: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || z.email().safeParse(v).success,
        copy('Email tidak valid.', 'Invalid email.')
      ),
    address: z.string(),
    notes: z.string(),
    tags: z.string(),
  })
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
      tags: (customer?.tags ?? []).join(', '),
    },
  })

  const onSubmit = async (values: Values) => {
    // An emptied field is cleared on edit and left out on create.
    const optional = (value: string) =>
      value.trim() || (customer ? null : undefined)
    try {
      const { data } = await save.mutateAsync({
        id: customer?.id,
        data: {
          name: values.name,
          phone: values.phone,
          email: optional(values.email),
          address: optional(values.address),
          notes: optional(values.notes),
          tags: parseTags(values.tags),
        },
      })
      onOpenChange(false)
      onSaved?.(data)
    } catch {
      // Toast shown by the mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {customer
              ? copy('Ubah data pelanggan', 'Edit customer')
              : copy('Tambah pelanggan', 'Add customer')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Nomor HP adalah identitas member di kasir. Satu nomor untuk satu pelanggan.',
              'The phone number identifies the member at the register. One number per customer.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='customer-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-4 sm:grid-cols-2'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy('Nama', 'Name')}</FormLabel>
                  <FormControl>
                    <Input autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy('Nomor HP', 'Phone')}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode='tel'
                      placeholder='0812 3456 7890'
                      autoComplete='off'
                      className='tabular-nums'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>
                    {copy('Email', 'Email')}{' '}
                    <span className='text-fg-muted font-normal'>
                      {copy('(opsional)', '(optional)')}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type='email' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>
                    {copy('Alamat', 'Address')}{' '}
                    <span className='text-fg-muted font-normal'>
                      {copy('(opsional)', '(optional)')}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input autoComplete='off' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>{copy('Label', 'Tags')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='vip, langganan'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {copy('Pisahkan dengan koma.', 'Separate with commas.')}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem className='sm:col-span-2'>
                  <FormLabel>{copy('Catatan', 'Notes')}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className='resize-none' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          <Button type='submit' form='customer-form' disabled={save.isPending}>
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Adjust points ────────────────────────────────────────────────────────────

export function AdjustPointsDialog({
  customer,
  open,
  onOpenChange,
}: DialogProps & { customer: Customer }) {
  const copy = useCopy()
  const adjust = useAdjustPointsMutation(customer.id)
  const [direction, setDirection] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  const points = Number(amount)
  const validAmount = Number.isInteger(points) && points > 0
  const delta = direction === 'add' ? points : -points
  const after = customer.currentPoints + (validAmount ? delta : 0)
  const overdraft = validAmount && after < 0
  const canSubmit = validAmount && !overdraft && reason.trim() !== ''

  const submit = async () => {
    setTouched(true)
    if (!canSubmit) return
    try {
      await adjust.mutateAsync({ points: delta, description: reason.trim() })
      onOpenChange(false)
    } catch {
      // Toast shown by the mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !adjust.isPending && onOpenChange(next)}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{copy('Sesuaikan poin', 'Adjust points')}</DialogTitle>
          <DialogDescription>
            {copy(
              `${customer.name} punya ${formatPoints(customer.currentPoints)} poin. Penyesuaian dicatat di riwayat poin beserta nama Anda.`,
              `${customer.name} has ${formatPoints(customer.currentPoints)} points. Adjustments are recorded in the points history with your name.`
            )}
          </DialogDescription>
        </DialogHeader>
        <form
          id='adjust-points-form'
          className='grid gap-4'
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <SegmentedControl
            aria-label={copy('Jenis penyesuaian', 'Adjustment type')}
            value={direction}
            onValueChange={setDirection}
            options={[
              { value: 'add', label: copy('Tambah poin', 'Add points') },
              { value: 'deduct', label: copy('Kurangi poin', 'Deduct points') },
            ]}
            className='w-fit'
          />
          <div className='grid gap-2'>
            <Label htmlFor='adjust-points-amount'>
              {copy('Jumlah poin', 'Points')}
            </Label>
            <Input
              id='adjust-points-amount'
              inputMode='numeric'
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              aria-invalid={touched && (!validAmount || overdraft)}
              className='tabular-nums'
              autoFocus
            />
            <p
              className={cn(
                'text-[13px]',
                overdraft ? 'text-status-danger' : 'text-fg-muted'
              )}
            >
              {overdraft
                ? copy('Melebihi saldo poin.', 'More than the balance.')
                : copy(
                    `Saldo setelahnya: ${formatPoints(after)} poin`,
                    `Balance after: ${formatPoints(after)} points`
                  )}
            </p>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='adjust-points-reason'>
              {copy('Alasan', 'Reason')}
            </Label>
            <Input
              id='adjust-points-reason'
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder={copy(
                'mis. Bonus ulang tahun',
                'e.g. Birthday bonus'
              )}
              aria-invalid={touched && reason.trim() === ''}
            />
            {touched && reason.trim() === '' && (
              <p className='text-status-danger text-[13px]'>
                {copy('Alasan wajib diisi.', 'A reason is required.')}
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={adjust.isPending}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          <Button
            type='submit'
            form='adjust-points-form'
            disabled={adjust.isPending}
          >
            {adjust.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Ban ──────────────────────────────────────────────────────────────────────

export function BanCustomerDialog({
  customer,
  open,
  onOpenChange,
}: DialogProps & { customer: Customer }) {
  const copy = useCopy()
  const status = useCustomerStatusMutation()
  const [reason, setReason] = useState('')
  const [forfeit, setForfeit] = useState(false)
  const [touched, setTouched] = useState(false)
  const missingReason = reason.trim() === ''

  const submit = async () => {
    setTouched(true)
    if (missingReason) return
    try {
      await status.mutateAsync({
        kind: 'ban',
        id: customer.id,
        reason: reason.trim(),
        forfeitPoints: forfeit,
      })
      onOpenChange(false)
    } catch {
      // Toast shown by the mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !status.isPending && onOpenChange(next)}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {copy(`Blokir ${customer.name}?`, `Ban ${customer.name}?`)}
          </DialogTitle>
          <DialogDescription asChild>
            <ul className='list-disc space-y-1 ps-5'>
              <li>
                {copy(
                  'Kasir tidak bisa memilih pelanggan ini lagi setelah daftar member di perangkat diperbarui.',
                  "Registers can't select this customer once their member list refreshes."
                )}
              </li>
              <li>
                {copy(
                  'Poin tidak bisa didapat atau ditukar. Poin dari transaksi sebelum blokir tetap tercatat.',
                  'No points can be earned or redeemed. Points from sales before the ban still count.'
                )}
              </li>
              <li>
                {copy(
                  'Nomor HP-nya tidak bisa didaftarkan ulang. Anda bisa mencabut blokir kapan saja.',
                  "The phone number can't be registered again. You can lift the ban at any time."
                )}
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <form
          id='ban-customer-form'
          className='grid gap-4'
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className='grid gap-2'>
            <Label htmlFor='ban-reason'>{copy('Alasan', 'Reason')}</Label>
            <Textarea
              id='ban-reason'
              rows={3}
              maxLength={500}
              className='resize-none'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={copy(
                'mis. Menyalahgunakan kode promo',
                'e.g. Abused promo codes'
              )}
              aria-invalid={touched && missingReason}
              autoFocus
            />
            {touched && missingReason && (
              <p className='text-status-danger text-[13px]'>
                {copy('Alasan wajib diisi.', 'A reason is required.')}
              </p>
            )}
          </div>
          {customer.currentPoints > 0 && (
            <label className='flex items-start gap-3 text-sm'>
              <Checkbox
                checked={forfeit}
                onCheckedChange={(checked) => setForfeit(checked === true)}
                className='mt-0.5'
              />
              <span>
                {copy(
                  `Hanguskan ${formatPoints(customer.currentPoints)} poin miliknya`,
                  `Also forfeit their ${formatPoints(customer.currentPoints)} points`
                )}
                <span className='text-fg-muted block text-[13px]'>
                  {copy(
                    'Tidak dikembalikan saat blokir dicabut.',
                    'Not returned if the ban is lifted.'
                  )}
                </span>
              </span>
            </label>
          )}
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={status.isPending}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          <Button
            type='submit'
            form='ban-customer-form'
            variant='destructive'
            disabled={status.isPending}
          >
            {status.isPending
              ? copy('Memblokir…', 'Banning…')
              : copy('Blokir pelanggan', 'Ban customer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
