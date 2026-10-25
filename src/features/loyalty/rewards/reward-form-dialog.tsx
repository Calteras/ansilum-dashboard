import { useMemo } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useProductsQuery } from '@/features/products/api/products.queries'
import { useSaveRewardMutation } from '../api/loyalty.queries'
import type { Reward, RewardRequest, RewardType } from '../api/loyalty.types'
import { rewardTypeLabel } from '../lib/loyalty'

const NO_VARIANT = 'none'
const digits = (value: string) => value.replace(/\D/g, '')

/** Whole numbers as typed; '' is "not set". */
const whole = (value: string) => (value === '' ? null : Number(value))

export function RewardFormDialog({
  reward,
  open,
  onOpenChange,
}: {
  reward?: Reward
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = useCopy()
  const save = useSaveRewardMutation()
  const products = useProductsQuery({})

  const schema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(1, copy('Nama wajib diisi.', 'Name is required.')),
          description: z.string(),
          type: z.enum(['DISCOUNT_FIXED', 'DISCOUNT_PERCENT', 'FREE_ITEM']),
          discountAmount: z.string(),
          discountPercent: z.string(),
          productId: z.string(),
          variantId: z.string(),
          pointsCost: z
            .string()
            .refine(
              (v) => Number(v) >= 1,
              copy('Minimal 1 poin.', 'At least 1 point.')
            ),
          minimumAmount: z.string(),
          maxRedemptions: z
            .string()
            .refine(
              (v) => v === '' || Number(v) >= 1,
              copy('Minimal 1, atau kosongkan.', 'At least 1, or leave empty.')
            ),
          expiresOn: z.string(),
        })
        .superRefine((values, ctx) => {
          if (
            values.type === 'DISCOUNT_FIXED' &&
            !(Number(values.discountAmount) > 0)
          )
            ctx.addIssue({
              code: 'custom',
              path: ['discountAmount'],
              message: copy(
                'Masukkan nilai potongan.',
                'Enter the amount off.'
              ),
            })
          if (
            values.type === 'DISCOUNT_PERCENT' &&
            !(
              Number(values.discountPercent) >= 1 &&
              Number(values.discountPercent) <= 100
            )
          )
            ctx.addIssue({
              code: 'custom',
              path: ['discountPercent'],
              message: copy('Antara 1 dan 100.', 'Between 1 and 100.'),
            })
          if (values.type === 'FREE_ITEM' && !values.productId)
            ctx.addIssue({
              code: 'custom',
              path: ['productId'],
              message: copy('Pilih produk.', 'Choose a product.'),
            })
        }),
    [copy]
  )
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: reward?.name ?? '',
      description: reward?.description ?? '',
      type: reward?.type ?? 'DISCOUNT_FIXED',
      discountAmount:
        reward?.discountAmount != null
          ? String(Number(reward.discountAmount))
          : '',
      discountPercent:
        reward?.discountPercent != null
          ? String(Number(reward.discountPercent))
          : '',
      productId: reward?.productId ?? '',
      variantId: reward?.variantId ?? NO_VARIANT,
      pointsCost: reward ? String(reward.pointsCost) : '',
      minimumAmount:
        reward?.minimumAmount != null
          ? String(Number(reward.minimumAmount))
          : '',
      maxRedemptions:
        reward?.maxRedemptions != null ? String(reward.maxRedemptions) : '',
      expiresOn: reward?.expiresAt
        ? format(new Date(reward.expiresAt), 'yyyy-MM-dd')
        : '',
    },
  })
  const type = useWatch({ control: form.control, name: 'type' })
  const productId = useWatch({ control: form.control, name: 'productId' })
  const productList = (products.data?.data ?? []).filter(
    (p) => p.isActive || p.id === reward?.productId
  )
  const variants = (
    productList.find((p) => p.id === productId)?.variants ?? []
  ).filter((v) => v.id && (v.isActive !== false || v.id === reward?.variantId))

  const onSubmit = async (values: Values) => {
    // A cleared optional field is sent as null so an edit removes it.
    const data: RewardRequest = {
      name: values.name,
      description: values.description.trim() || null,
      type: values.type,
      pointsCost: Number(values.pointsCost),
      minimumAmount: whole(values.minimumAmount),
      maxRedemptions: whole(values.maxRedemptions),
      // The reward stays usable through the whole chosen day.
      expiresAt: values.expiresOn
        ? new Date(`${values.expiresOn}T23:59:59`).toISOString()
        : null,
      ...(values.type === 'DISCOUNT_FIXED' && {
        discountAmount: Number(values.discountAmount),
      }),
      ...(values.type === 'DISCOUNT_PERCENT' && {
        discountPercent: Number(values.discountPercent),
      }),
      ...(values.type === 'FREE_ITEM' && {
        productId: values.productId,
        variantId: values.variantId === NO_VARIANT ? null : values.variantId,
      }),
    }
    if (!reward) {
      // Create has nothing to clear.
      for (const key of [
        'minimumAmount',
        'maxRedemptions',
        'expiresAt',
        'description',
        'variantId',
      ] as const)
        if (data[key] === null) delete data[key]
    }
    try {
      await save.mutateAsync({ id: reward?.id, data })
      onOpenChange(false)
    } catch {
      // Toast shown by the mutation
    }
  }

  const optional = (
    <span className='text-fg-muted font-normal'>
      {copy('(opsional)', '(optional)')}
    </span>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {reward
              ? copy('Ubah hadiah', 'Edit reward')
              : copy('Hadiah baru', 'New reward')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Pelanggan menukar poin dengan hadiah ini saat membayar di kasir.',
              'Customers spend points on this reward when they pay at the register.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='reward-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy('Nama hadiah', 'Name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={copy(
                        'mis. Gratis Es Kopi Susu',
                        'e.g. Free iced latte'
                      )}
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy('Jenis', 'Type')}</FormLabel>
                  <FormControl>
                    <SegmentedControl<RewardType>
                      aria-label={copy('Jenis hadiah', 'Reward type')}
                      value={field.value}
                      onValueChange={field.onChange}
                      options={(
                        [
                          'DISCOUNT_FIXED',
                          'DISCOUNT_PERCENT',
                          'FREE_ITEM',
                        ] as const
                      ).map((value) => ({
                        value,
                        label: rewardTypeLabel(value, copy),
                      }))}
                      className='w-fit'
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {type === 'DISCOUNT_FIXED' && (
              <FormField
                control={form.control}
                name='discountAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Nilai potongan (Rp)', 'Amount off (Rp)')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        className='tabular-nums'
                        {...field}
                        onChange={(e) => field.onChange(digits(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {type === 'DISCOUNT_PERCENT' && (
              <FormField
                control={form.control}
                name='discountPercent'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Diskon (%)', 'Percent off (%)')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        className='tabular-nums sm:w-32'
                        maxLength={3}
                        {...field}
                        onChange={(e) => field.onChange(digits(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {copy('Dari subtotal belanja.', 'Of the order subtotal.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {type === 'FREE_ITEM' && (
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='productId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{copy('Produk', 'Product')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('variantId', NO_VARIANT)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue
                              placeholder={
                                products.isLoading
                                  ? copy('Memuat…', 'Loading…')
                                  : copy('Pilih produk', 'Choose a product')
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='variantId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{copy('Varian', 'Variant')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={variants.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_VARIANT}>
                            {copy('Tanpa varian', 'No variant')}
                          </SelectItem>
                          {variants.map((v) => (
                            <SelectItem key={v.id} value={v.id!}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <p className='text-fg-muted -mt-2 text-[13px] sm:col-span-2'>
                  {copy(
                    'Produk gratis hanya bisa ditukar saat kasir online.',
                    'Free items can only be redeemed while the register is online.'
                  )}
                </p>
              </div>
            )}

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='pointsCost'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy('Harga poin', 'Points cost')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        className='tabular-nums'
                        {...field}
                        onChange={(e) => field.onChange(digits(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='minimumAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Minimal belanja (Rp)', 'Minimum spend (Rp)')}{' '}
                      {optional}
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        className='tabular-nums'
                        {...field}
                        onChange={(e) => field.onChange(digits(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='maxRedemptions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Kuota penukaran', 'Redemption limit')} {optional}
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode='numeric'
                        className='tabular-nums'
                        placeholder={copy('Tanpa batas', 'Unlimited')}
                        {...field}
                        onChange={(e) => field.onChange(digits(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {copy(
                        'Total untuk semua pelanggan. Hadiah berkuota hanya bisa ditukar saat kasir online.',
                        'Across all customers. Limited rewards can only be redeemed while the register is online.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='expiresOn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Berlaku sampai', 'Valid until')} {optional}
                    </FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormDescription>
                      {copy('Termasuk hari itu.', 'Including that day.')}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {copy('Keterangan', 'Description')} {optional}
                  </FormLabel>
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
          <Button type='submit' form='reward-form' disabled={save.isPending}>
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
