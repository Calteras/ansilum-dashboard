import { useMemo, type ComponentProps } from 'react'
import { z } from 'zod'
import { useForm, useWatch, type Control } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { useSaveTaxMutation } from '../api/pricing.queries'
import type { TaxConfig } from '../api/pricing.types'
import { FormSection, Optional, TargetPicker } from '../components/pricing-ui'
import { useTargetOptions } from '../hooks'
import { taxFormDefaults, taxRequest, type TaxFormValues } from '../lib/pricing'

const RATE = /^\d{1,3}([.,]\d{1,2})?$/
const decimal = (value: string) =>
  value.replace(/[^\d.,]/g, '').replace(/([.,]\d{0,2}).*$/, '$1')

export function TaxFormDialog({
  tax,
  open,
  onOpenChange,
}: {
  tax?: TaxConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = useCopy()
  const save = useSaveTaxMutation()
  const targets = useTargetOptions()

  const schema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(1, copy('Nama wajib diisi.', 'Name is required.'))
            .max(100),
          rate: z
            .string()
            .refine(
              (v) =>
                RATE.test(v) &&
                Number(v.replace(',', '.')) > 0 &&
                Number(v.replace(',', '.')) <= 100,
              copy(
                'Antara 0 dan 100, paling banyak dua desimal.',
                'Between 0 and 100, up to two decimals.'
              )
            ),
          inclusive: z.boolean(),
          taxService: z.boolean(),
          outletIds: z.array(z.string()),
          categoryIds: z.array(z.string()),
          productIds: z.array(z.string()),
          exemptProductIds: z.array(z.string()),
          validFrom: z.string(),
          validUntil: z.string(),
        })
        .superRefine((v, ctx) => {
          if (v.validFrom && v.validUntil && v.validUntil < v.validFrom)
            ctx.addIssue({
              code: 'custom',
              path: ['validUntil'],
              message: copy(
                'Tidak boleh sebelum tanggal mulai.',
                'Cannot be before the start date.'
              ),
            })
        }),
    [copy]
  )

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(schema),
    defaultValues: taxFormDefaults(tax),
  })
  const control = form.control
  const inclusive = useWatch({ control, name: 'inclusive' })

  const onSubmit = async (values: TaxFormValues) => {
    try {
      await save.mutateAsync({ id: tax?.id, data: taxRequest(values, tax) })
      onOpenChange(false)
    } catch {
      // Toast shown by the mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {tax
              ? copy('Ubah pajak', 'Edit tax')
              : copy('Pajak baru', 'New tax')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Dihitung dari harga setelah diskon. Pajak tidak dikenakan pada pajak lain.',
              'Charged on prices after discounts. Taxes are never charged on other taxes.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='tax-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid gap-5'
          >
            <div className='grid items-start gap-4 sm:grid-cols-[1fr_140px]'>
              <FormField
                control={control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy('Nama pajak', 'Name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={copy(
                          'mis. PB1 atau PPN',
                          'e.g. PB1 or VAT'
                        )}
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {copy('Tampil di struk.', 'Shown on receipts.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='rate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy('Tarif (%)', 'Rate (%)')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode='decimal'
                        className='tabular-nums'
                        {...field}
                        onChange={(e) =>
                          field.onChange(decimal(e.target.value))
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
              name='inclusive'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {copy('Cara hitung', 'How it is charged')}
                  </FormLabel>
                  <FormControl>
                    <SegmentedControl<'added' | 'included'>
                      aria-label={copy('Cara hitung', 'How it is charged')}
                      value={field.value ? 'included' : 'added'}
                      onValueChange={(next) => {
                        field.onChange(next === 'included')
                        if (next === 'included')
                          form.setValue('taxService', false)
                      }}
                      options={[
                        {
                          value: 'added',
                          label: copy(
                            'Ditambahkan ke harga',
                            'Added to prices'
                          ),
                        },
                        {
                          value: 'included',
                          label: copy(
                            'Sudah termasuk harga',
                            'Included in prices'
                          ),
                        },
                      ]}
                      className='w-fit'
                    />
                  </FormControl>
                  <FormDescription>
                    {inclusive
                      ? copy(
                          'Harga menu tidak berubah; pajaknya dihitung dari dalam harga dan dirinci di struk.',
                          'Menu prices stay the same; the tax is worked out from inside the price and itemised.'
                        )
                      : copy(
                          'Pajak dihitung dari harga dan ditambahkan ke total.',
                          'The tax is worked out from the price and added to the total.'
                        )}
                  </FormDescription>
                </FormItem>
              )}
            />
            {!inclusive && (
              <FormField
                control={control}
                name='taxService'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start justify-between gap-4'>
                    <div className='space-y-0.5'>
                      <FormLabel>
                        {copy(
                          'Kenakan juga pada biaya layanan',
                          'Also charge it on the service charge'
                        )}
                      </FormLabel>
                      <FormDescription>
                        {copy(
                          'Dasar pajak menjadi harga ditambah biaya layanan.',
                          'The tax base becomes the price plus the service charge.'
                        )}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormSection
              title={copy('Berlaku untuk', 'Applies to')}
              description={copy(
                'Kosongkan untuk semua. Produk yang dikecualikan tidak pernah dikenai pajak ini.',
                'Leave empty for all. Excluded products are never charged this tax.'
              )}
            >
              <div className='grid items-start gap-4 sm:grid-cols-2'>
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
                <TargetField
                  control={control}
                  name='exemptProductIds'
                  label={copy('Kecuali produk', 'Except products')}
                  options={targets.products}
                  isLoading={targets.isLoading.products}
                  allLabel={copy('Tidak ada', 'None')}
                  countLabel={(n) => copy(`${n} produk`, `${n} products`)}
                  searchPlaceholder={copy('Cari produk…', 'Search products…')}
                />
              </div>
            </FormSection>

            <FormSection
              title={copy('Periode', 'Period')}
              description={copy(
                'Untuk tarif yang mulai atau berhenti pada tanggal tertentu, misalnya perubahan tarif tahun depan.',
                'For a rate that starts or stops on a date, such as next year’s rate change.'
              )}
            >
              <div className='grid items-start gap-4 sm:grid-cols-2'>
                <FormField
                  control={control}
                  name='validFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {copy('Mulai', 'Starts')} <Optional />
                      </FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
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
          <Button type='submit' form='tax-form' disabled={save.isPending}>
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TargetField({
  control,
  name,
  label,
  ...picker
}: {
  control: Control<TaxFormValues>
  name: 'outletIds' | 'categoryIds' | 'productIds' | 'exemptProductIds'
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
