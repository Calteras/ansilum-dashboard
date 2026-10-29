import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  useForm,
  useWatch,
  type Control,
  type FieldPathByValue,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useSavePromotionMutation } from '../api/pricing.queries'
import {
  PAYMENT_METHODS,
  PROMOTION_TYPES,
  type PaymentMethod,
  type Promotion,
  type PromotionType,
} from '../api/pricing.types'
import {
  FormSection,
  Optional,
  TargetPicker,
  ToggleChips,
} from '../components/pricing-ui'
import { useTargetOptions } from '../hooks'
import {
  WEEK,
  paymentMethodLabel,
  promotionFormDefaults,
  promotionRequest,
  promotionTypeLabel,
  suggestCode,
  timeToMinutes,
  weekdayLabel,
  type PromotionFormValues,
} from '../lib/pricing'

const digits = (value: string) => value.replace(/\D/g, '')
/** Up to three digits and two decimals; a comma reads as the decimal mark. */
const decimal = (value: string) =>
  value.replace(/[^\d.,]/g, '').replace(/([.,]\d{0,2}).*$/, '$1')
const PERCENT = /^\d{1,3}([.,]\d{1,2})?$/
const percentOk = (v: string) =>
  PERCENT.test(v) &&
  Number(v.replace(',', '.')) > 0 &&
  Number(v.replace(',', '.')) <= 100

export function PromotionFormDialog({
  promotion,
  timezone,
  open,
  onOpenChange,
}: {
  promotion?: Promotion
  timezone: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = useCopy()
  const save = useSavePromotionMutation()
  const targets = useTargetOptions()
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Already redeemed or held uses; the limit cannot go below them.
  const usedCount = promotion?.usedCount ?? 0
  const schema = useMemo(() => {
    const whole = (min: number, message: string) =>
      z.string().refine((v) => v === '' || Number(v) >= min, message)
    return z
      .object({
        name: z
          .string()
          .trim()
          .min(1, copy('Nama wajib diisi.', 'Name is required.'))
          .max(100),
        code: z
          .string()
          .regex(
            /^[A-Z0-9_-]{3,20}$/,
            copy(
              '3–20 karakter: huruf, angka, tanda - atau _.',
              '3–20 letters, digits, - or _.'
            )
          ),
        description: z.string().max(500),
        type: z.enum(PROMOTION_TYPES as [PromotionType, ...PromotionType[]]),
        value: z.string(),
        buyQuantity: z.string(),
        getQuantity: z.string(),
        bundleQuantity: z.string(),
        maxDiscount: whole(1, copy('Minimal Rp1.', 'At least Rp1.')),
        minPurchase: z.string(),
        validFrom: z
          .string()
          .min(1, copy('Pilih tanggal mulai.', 'Choose a start date.')),
        validUntil: z.string(),
        scheduled: z.boolean(),
        weekdays: z.array(z.number()),
        startTime: z.string(),
        endTime: z.string(),
        usageLimit: whole(
          Math.max(1, usedCount),
          usedCount
            ? copy(
                `Minimal ${usedCount}, jumlah yang sudah dipakai atau ditahan.`,
                `At least ${usedCount}, the uses already redeemed or on hold.`
              )
            : copy('Minimal 1, atau kosongkan.', 'At least 1, or leave empty.')
        ),
        perCustomerLimit: whole(
          1,
          copy('Minimal 1, atau kosongkan.', 'At least 1, or leave empty.')
        ),
        budgetAmount: whole(1, copy('Minimal Rp1.', 'At least Rp1.')),
        outletIds: z.array(z.string()),
        categoryIds: z.array(z.string()),
        productIds: z.array(z.string()),
        automatic: z.boolean(),
        stackable: z.boolean(),
        priority: z
          .string()
          .refine(
            (v) => v === '' || Number(v) <= 10000,
            copy('Paling besar 10.000.', 'At most 10,000.')
          ),
        firstPurchaseOnly: z.boolean(),
        restoreOnRefund: z.boolean(),
        paymentMethods: z.array(
          z.enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]])
        ),
      })
      .superRefine((v, ctx) => {
        const issue = (path: keyof PromotionFormValues, message: string) =>
          ctx.addIssue({ code: 'custom', path: [path], message })
        if (
          (v.type === 'PERCENTAGE' || v.type === 'BUY_X_GET_Y') &&
          !percentOk(v.value)
        )
          issue(
            'value',
            copy(
              'Antara 0 dan 100, paling banyak dua desimal.',
              'Between 0 and 100, up to two decimals.'
            )
          )
        if (
          (v.type === 'FIXED_AMOUNT' || v.type === 'BUNDLE_PRICE') &&
          !(Number(v.value) >= 1)
        )
          issue('value', copy('Masukkan nilai rupiah.', 'Enter an amount.'))
        if (v.type === 'BUY_X_GET_Y') {
          if (!(Number(v.buyQuantity) >= 1))
            issue('buyQuantity', copy('Minimal 1.', 'At least 1.'))
          if (!(Number(v.getQuantity) >= 1))
            issue('getQuantity', copy('Minimal 1.', 'At least 1.'))
        }
        if (v.type === 'BUNDLE_PRICE' && !(Number(v.bundleQuantity) >= 2))
          issue('bundleQuantity', copy('Minimal 2 item.', 'At least 2 items.'))
        if (v.validUntil && v.validFrom && v.validUntil < v.validFrom)
          issue(
            'validUntil',
            copy(
              'Tidak boleh sebelum tanggal mulai.',
              'Cannot be before the start date.'
            )
          )
        if (v.scheduled) {
          if (v.weekdays.length === 0)
            issue(
              'weekdays',
              copy('Pilih minimal satu hari.', 'Pick at least one day.')
            )
          const start = timeToMinutes(v.startTime, 'start')
          const end = timeToMinutes(v.endTime, 'end')
          if (start === null || end === null || end <= start)
            issue(
              'endTime',
              copy(
                'Jam selesai harus sesudah jam mulai, di hari yang sama.',
                'The end time must be after the start time, on the same day.'
              )
            )
        }
      })
  }, [copy, usedCount])

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: promotionFormDefaults(promotion, today),
  })
  const control = form.control
  const type = useWatch({ control, name: 'type' })
  const automatic = useWatch({ control, name: 'automatic' })
  const scheduled = useWatch({ control, name: 'scheduled' })

  const onSubmit = async (values: PromotionFormValues) => {
    try {
      await save.mutateAsync({
        id: promotion?.id,
        data: promotionRequest(values, promotion, timezone),
      })
      onOpenChange(false)
    } catch {
      // Toast shown by the mutation
    }
  }

  const money = (
    name: FieldPathByValue<PromotionFormValues, string>,
    label: ReactNode,
    description?: string,
    placeholder?: string
  ) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              inputMode='numeric'
              className='tabular-nums'
              placeholder={placeholder}
              {...field}
              onChange={(e) => field.onChange(digits(e.target.value))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const percent = (label: string, description?: string) => (
    <FormField
      control={control}
      name='value'
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              inputMode='decimal'
              className='tabular-nums'
              {...field}
              onChange={(e) => field.onChange(decimal(e.target.value))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const count = (
    name: FieldPathByValue<PromotionFormValues, string>,
    label: ReactNode,
    description?: string,
    placeholder?: string
  ) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              inputMode='numeric'
              className='tabular-nums'
              maxLength={7}
              placeholder={placeholder}
              {...field}
              onChange={(e) => field.onChange(digits(e.target.value))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const unlimited = copy('Tanpa batas', 'Unlimited')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {promotion
              ? copy('Ubah promo', 'Edit promotion')
              : copy('Promo baru', 'New promotion')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Potongan dihitung server saat transaksi dihitung online, dan dicatat per transaksi.',
              'The server applies the discount when a sale is priced online and records it on the sale.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='promotion-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-5'
          >
            <div className='grid items-start gap-4 sm:grid-cols-[1fr_200px]'>
              <FormField
                control={control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy('Nama promo', 'Name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={copy(
                          'mis. Happy hour kopi',
                          'e.g. Coffee happy hour'
                        )}
                        autoComplete='off'
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          if (!promotion && !form.getFieldState('code').isDirty)
                            form.setValue('code', suggestCode(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy('Kode', 'Code')}</FormLabel>
                    <FormControl>
                      <Input
                        className='font-mono uppercase'
                        autoComplete='off'
                        maxLength={20}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9_-]/g, '')
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {copy('Keterangan', 'Description')} <Optional />
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} className='resize-none' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormSection title={copy('Potongan', 'Discount')}>
              <FormField
                control={control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SegmentedControl<PromotionType>
                        aria-label={copy('Jenis promo', 'Promotion type')}
                        value={field.value}
                        onValueChange={(next) => {
                          field.onChange(next)
                          form.setValue(
                            'value',
                            next === 'BUY_X_GET_Y' ? '100' : ''
                          )
                          form.clearErrors('value')
                        }}
                        options={PROMOTION_TYPES.map((value) => ({
                          value,
                          label: promotionTypeLabel(value, copy),
                        }))}
                        className='w-fit max-w-full overflow-x-auto'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='grid items-start gap-4 sm:grid-cols-2'>
                {type === 'PERCENTAGE' && (
                  <>
                    {percent(
                      copy('Diskon (%)', 'Percent off (%)'),
                      copy(
                        'Dari subtotal item yang memenuhi syarat.',
                        'Of the eligible items’ subtotal.'
                      )
                    )}
                    {money(
                      'maxDiscount',
                      <>
                        {copy(
                          'Potongan maksimal (Rp)',
                          'Maximum discount (Rp)'
                        )}{' '}
                        <Optional />
                      </>,
                      undefined,
                      unlimited
                    )}
                  </>
                )}
                {type === 'FIXED_AMOUNT' &&
                  money(
                    'value',
                    copy('Nilai potongan (Rp)', 'Amount off (Rp)'),
                    copy(
                      'Tidak melebihi subtotal item yang memenuhi syarat.',
                      'Never more than the eligible items’ subtotal.'
                    )
                  )}
                {type === 'BUY_X_GET_Y' && (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      {count('buyQuantity', copy('Beli', 'Buy'))}
                      {count('getQuantity', copy('Gratis', 'Get'))}
                    </div>
                    {percent(
                      copy(
                        'Potongan item gratis (%)',
                        'Off the free items (%)'
                      ),
                      copy(
                        '100 berarti gratis. Yang dipotong item termurah, dan item itu harus ada di keranjang.',
                        '100 means free. The cheapest qualifying items are reduced; they must be in the basket.'
                      )
                    )}
                  </>
                )}
                {type === 'BUNDLE_PRICE' && (
                  <>
                    {count(
                      'bundleQuantity',
                      copy('Item per paket', 'Items per bundle')
                    )}
                    {money(
                      'value',
                      copy('Harga paket (Rp)', 'Bundle price (Rp)'),
                      copy(
                        'Item termahal yang memenuhi syarat dipaketkan lebih dulu.',
                        'The highest-priced qualifying items are bundled first.'
                      )
                    )}
                  </>
                )}
                {money(
                  'minPurchase',
                  <>
                    {copy('Minimal belanja (Rp)', 'Minimum spend (Rp)')}{' '}
                    <Optional />
                  </>,
                  copy(
                    'Dihitung dari item yang memenuhi syarat.',
                    'Counted on the eligible items.'
                  )
                )}
              </div>
            </FormSection>

            <FormSection title={copy('Waktu berlaku', 'When it runs')}>
              <div className='grid items-start gap-4 sm:grid-cols-2'>
                <FormField
                  control={control}
                  name='validFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{copy('Mulai', 'Starts')}</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='validUntil'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {copy('Sampai', 'Ends')} <Optional />
                      </FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormDescription>
                        {copy('Termasuk hari itu.', 'Including that day.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <SwitchRow
                control={control}
                name='scheduled'
                label={copy(
                  'Hanya pada hari dan jam tertentu',
                  'Only on certain days and hours'
                )}
                description={copy(
                  `Waktu ${timezone}. Untuk jam lewat tengah malam, buat dua promo.`,
                  `${timezone} time. For hours past midnight, create two promotions.`
                )}
              />
              {scheduled && (
                <div className='grid gap-4 sm:grid-cols-[auto_1fr_1fr] sm:items-start'>
                  <FormField
                    control={control}
                    name='weekdays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy('Hari', 'Days')}</FormLabel>
                        <FormControl>
                          <ToggleChips<number>
                            aria-label={copy('Hari', 'Days')}
                            value={field.value}
                            onChange={field.onChange}
                            options={WEEK.map((day) => ({
                              value: day,
                              label: weekdayLabel(day, copy),
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='startTime'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy('Dari jam', 'From')}</FormLabel>
                        <FormControl>
                          <Input type='time' {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='endTime'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy('Sampai jam', 'Until')}</FormLabel>
                        <FormControl>
                          <Input type='time' {...field} />
                        </FormControl>
                        <FormDescription>
                          {copy(
                            '00:00 berarti tengah malam.',
                            '00:00 means midnight.'
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </FormSection>

            <FormSection
              title={copy('Berlaku untuk', 'Applies to')}
              description={copy(
                'Kosongkan untuk semua. Bila kategori dan produk sama-sama diisi, item harus cocok dengan keduanya.',
                'Leave empty for all. When both categories and products are set, an item must match both.'
              )}
            >
              <div className='grid items-start gap-4 sm:grid-cols-3'>
                <TargetField
                  control={control}
                  name='outletIds'
                  label={copy('Gerai', 'Outlets')}
                  options={targets.outlets}
                  isLoading={targets.isLoading.outlets}
                  allLabel={copy('Semua gerai', 'All outlets')}
                  countLabel={(n) => copy(`${n} gerai`, `${n} outlets`)}
                  searchPlaceholder={copy('Cari gerai…', 'Search outlets…')}
                />
                <TargetField
                  control={control}
                  name='categoryIds'
                  label={copy('Kategori', 'Categories')}
                  options={targets.categories}
                  isLoading={targets.isLoading.categories}
                  allLabel={copy('Semua kategori', 'All categories')}
                  countLabel={(n) => copy(`${n} kategori`, `${n} categories`)}
                  searchPlaceholder={copy(
                    'Cari kategori…',
                    'Search categories…'
                  )}
                />
                <TargetField
                  control={control}
                  name='productIds'
                  label={copy('Produk', 'Products')}
                  options={targets.products}
                  isLoading={targets.isLoading.products}
                  allLabel={copy('Semua produk', 'All products')}
                  countLabel={(n) => copy(`${n} produk`, `${n} products`)}
                  searchPlaceholder={copy('Cari produk…', 'Search products…')}
                />
              </div>
            </FormSection>

            <FormSection title={copy('Batas pemakaian', 'Limits')}>
              <div className='grid items-start gap-4 sm:grid-cols-3'>
                {count(
                  'usageLimit',
                  <>
                    {copy('Kuota total', 'Total uses')} <Optional />
                  </>,
                  copy(
                    'Termasuk yang sedang ditahan transaksi terbuka.',
                    'Includes uses held by open sales.'
                  ),
                  unlimited
                )}
                {count(
                  'perCustomerLimit',
                  <>
                    {copy('Per pelanggan', 'Per customer')} <Optional />
                  </>,
                  copy(
                    'Transaksi harus memilih pelanggan.',
                    'The sale must have a customer.'
                  ),
                  unlimited
                )}
                {money(
                  'budgetAmount',
                  <>
                    {copy('Anggaran (Rp)', 'Budget (Rp)')} <Optional />
                  </>,
                  copy(
                    'Promo berhenti saat total potongan mencapai angka ini.',
                    'The promotion stops once its total discount reaches this.'
                  ),
                  unlimited
                )}
              </div>
            </FormSection>

            <FormSection title={copy('Cara berlaku', 'How it applies')}>
              <SwitchRow
                control={control}
                name='automatic'
                label={copy('Terapkan otomatis', 'Apply automatically')}
                description={copy(
                  'Diterapkan tanpa kode bila syaratnya terpenuhi. Bila mati, kode harus dimasukkan.',
                  'Applied without a code whenever the conditions are met. Off: the code must be entered.'
                )}
              />
              {automatic && (
                <div className='sm:w-1/3'>
                  {count(
                    'priority',
                    <>
                      {copy('Prioritas', 'Priority')} <Optional />
                    </>,
                    copy(
                      'Angka lebih besar diterapkan lebih dulu.',
                      'Higher numbers apply first.'
                    ),
                    '0'
                  )}
                </div>
              )}
              <SwitchRow
                control={control}
                name='stackable'
                label={copy(
                  'Bisa digabung dengan promo lain',
                  'Combines with other promotions'
                )}
                description={copy(
                  'Bila mati, promo ini tidak digabung dengan promo lain, diskon manual, atau hadiah poin.',
                  'Off: this promotion is never combined with other promotions, manual discounts or rewards.'
                )}
              />
              <SwitchRow
                control={control}
                name='firstPurchaseOnly'
                label={copy('Hanya pembelian pertama', 'First purchase only')}
                description={copy(
                  'Untuk pelanggan yang belum pernah membayar transaksi. Transaksi harus memilih pelanggan.',
                  'For customers who have never paid for a sale. The sale must have a customer.'
                )}
              />
              <SwitchRow
                control={control}
                name='restoreOnRefund'
                label={copy(
                  'Kembalikan kuota saat refund penuh',
                  'Return the use on a full refund'
                )}
                description={copy(
                  'Refund sebagian tidak mengembalikan kuota.',
                  'Partial refunds keep the use.'
                )}
              />
              <FormField
                control={control}
                name='paymentMethods'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy('Metode pembayaran', 'Payment methods')}{' '}
                      <Optional />
                    </FormLabel>
                    <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method}
                          className='flex items-center gap-2 text-[13px]'
                        >
                          <Checkbox
                            checked={field.value.includes(method)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, method]
                                  : field.value.filter((m) => m !== method)
                              )
                            }
                          />
                          {paymentMethodLabel(method, copy)}
                        </label>
                      ))}
                    </div>
                    <FormDescription>
                      {copy(
                        'Kosongkan untuk semua metode. Bila diisi, metode bayar harus dipilih sebelum harga dihitung.',
                        'Leave empty for any method. When set, the payment method must be chosen before pricing.'
                      )}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </FormSection>
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
          <Button type='submit' form='promotion-form' disabled={save.isPending}>
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SwitchRow({
  control,
  name,
  label,
  description,
}: {
  control: Control<PromotionFormValues>
  name: FieldPathByValue<PromotionFormValues, boolean>
  label: string
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-start justify-between gap-4'>
          <div className='space-y-0.5'>
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function TargetField({
  control,
  name,
  label,
  ...picker
}: {
  control: Control<PromotionFormValues>
  name: 'outletIds' | 'categoryIds' | 'productIds'
  label: string
} & Omit<ComponentProps<typeof TargetPicker>, 'value' | 'onChange' | 'id'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <TargetPicker
              {...picker}
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
