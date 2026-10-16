import { type ReactNode, useEffect, useMemo } from 'react'
import { z } from 'zod'
import {
  type Control,
  type FieldPathByValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  defaultReceiptTemplate,
  RECEIPT_TEXT_LIMITS as LIMIT,
  readReceiptTemplate,
  type ReceiptTemplate,
} from '../layout/receipt-template'
import type { ReceiptSettings } from '../receipt-settings.api'

type Copy = ReturnType<typeof useCopy>

function receiptSettingsSchema(copy: Copy) {
  const text = (limit: number) =>
    z
      .string()
      .max(
        limit,
        copy(
          `Maksimal ${limit} karakter.`,
          `Keep it to ${limit} characters or fewer.`
        )
      )
  return z.object({
    printReceipt: z.boolean(),
    autoPrintOnPayment: z.boolean(),
    printKitchenOrder: z.boolean(),
    enableBackupPrinter: z.boolean(),
    receiptCopies: z.number().int().min(1).max(3),
    openCashDrawer: z.boolean(),
    autoCutPaper: z.boolean(),
    receiptTemplate: z.object({
      version: z.literal(1),
      language: z.enum(['id', 'en']),
      header: z.object({
        showLogo: z.boolean(),
        businessName: text(LIMIT.businessName),
        showOutletName: z.boolean(),
        showAddress: z.boolean(),
        showPhone: z.boolean(),
        taxId: text(LIMIT.taxId),
        note: text(LIMIT.headerNote),
      }),
      transaction: z.object({
        showCashier: z.boolean(),
        showCustomer: z.boolean(),
        showTable: z.boolean(),
        showOrderType: z.boolean(),
      }),
      items: z.object({
        showModifiers: z.boolean(),
        showNotes: z.boolean(),
        showUnitPrice: z.boolean(),
      }),
      footer: z
        .object({
          thankYou: text(LIMIT.thankYou),
          policy: text(LIMIT.policy),
          social: text(LIMIT.social),
          website: text(LIMIT.website),
          note: text(LIMIT.footerNote),
          showQr: z.boolean(),
          qrValue: text(LIMIT.qrValue),
          showPoweredBy: z.boolean(),
        })
        .refine((footer) => !footer.showQr || footer.qrValue.trim() !== '', {
          path: ['qrValue'],
          message: copy(
            'Isi tautan untuk kode QR, atau matikan kode QR.',
            'Enter a link for the QR code, or turn the QR code off.'
          ),
        }),
    }),
  })
}

type FormValues = z.infer<ReturnType<typeof receiptSettingsSchema>>

interface ReceiptSettingsFormProps {
  settings: ReceiptSettings
  canEdit: boolean
  saving: boolean
  businessName: string
  hasLogo: boolean
  onSave: (settings: ReceiptSettings) => void
  /** Called with the template as it is being edited, for the preview. */
  onTemplateChange: (template: ReceiptTemplate) => void
}

/**
 * The receipt design and the printing rules. Saved together with one
 * "Simpan"; nothing is saved while typing.
 */
export function ReceiptSettingsForm({
  settings,
  canEdit,
  saving,
  businessName,
  hasLogo,
  onSave,
  onTemplateChange,
}: ReceiptSettingsFormProps) {
  const copy = useCopy()
  const schema = useMemo(() => receiptSettingsSchema(copy), [copy])
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings,
  })
  const { control, formState } = form

  // A save returns the stored settings; start from them again.
  useEffect(() => {
    form.reset(settings)
  }, [form, settings])

  const template = useWatch({ control, name: 'receiptTemplate' })
  useEffect(() => {
    onTemplateChange(readReceiptTemplate(template))
  }, [template, onTemplateChange])

  const printReceipt = useWatch({ control, name: 'printReceipt' })
  const showQr = useWatch({ control, name: 'receiptTemplate.footer.showQr' })
  const disabled = !canEdit || saving

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSave(values))}
        className='space-y-8'
      >
        <fieldset disabled={disabled} className='space-y-8'>
          <Section title={copy('Identitas usaha', 'Business details')}>
            <SwitchField
              control={control}
              name='receiptTemplate.header.showLogo'
              label={copy('Logo', 'Logo')}
              description={
                hasLogo
                  ? copy(
                      'Logo usaha dari Pengaturan → Usaha.',
                      'The business logo from Settings → Business.'
                    )
                  : copy(
                      'Belum ada logo. Tambahkan di Pengaturan → Usaha.',
                      'No logo yet. Add one in Settings → Business.'
                    )
              }
            />
            <TextField
              control={control}
              name='receiptTemplate.header.businessName'
              label={copy('Nama di struk', 'Name on the receipt')}
              placeholder={businessName}
              description={copy(
                'Kosongkan untuk memakai nama usaha.',
                'Leave empty to use the business name.'
              )}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.header.showOutletName'
              label={copy('Nama outlet', 'Outlet name')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.header.showAddress'
              label={copy('Alamat outlet', 'Outlet address')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.header.showPhone'
              label={copy('Telepon outlet', 'Outlet phone')}
            />
            <TextField
              control={control}
              name='receiptTemplate.header.taxId'
              label={copy('NPWP', 'Tax ID (NPWP)')}
              description={copy(
                'Dicetak di bawah nama bila diisi.',
                'Printed under the name when filled in.'
              )}
            />
            <TextField
              control={control}
              name='receiptTemplate.header.note'
              label={copy('Catatan di bawah nama', 'Note under the name')}
              placeholder={copy(
                'Contoh: Buka 07.00-22.00',
                'For example: Open 07:00-22:00'
              )}
              multiline
            />
          </Section>

          <Section
            title={copy('Detail transaksi', 'Transaction details')}
            description={copy(
              'Nomor struk, tanggal, dan waktu selalu dicetak.',
              'The receipt number, date and time always print.'
            )}
          >
            <SwitchField
              control={control}
              name='receiptTemplate.transaction.showCashier'
              label={copy('Kasir', 'Cashier')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.transaction.showCustomer'
              label={copy('Pelanggan', 'Customer')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.transaction.showTable'
              label={copy('Meja', 'Table')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.transaction.showOrderType'
              label={copy('Jenis pesanan', 'Order type')}
            />
          </Section>

          <Section
            title={copy('Item', 'Items')}
            description={copy(
              'Nama, jumlah, dan total tiap item selalu dicetak.',
              'Each item’s name, quantity and total always print.'
            )}
          >
            <SwitchField
              control={control}
              name='receiptTemplate.items.showModifiers'
              label={copy('Tambahan (modifier)', 'Add-ons (modifiers)')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.items.showNotes'
              label={copy('Catatan item', 'Item notes')}
            />
            <SwitchField
              control={control}
              name='receiptTemplate.items.showUnitPrice'
              label={copy('Harga satuan', 'Unit price')}
            />
          </Section>

          <Section title={copy('Penutup', 'Footer')}>
            <TextField
              control={control}
              name='receiptTemplate.footer.thankYou'
              label={copy('Ucapan terima kasih', 'Thank-you message')}
            />
            <TextField
              control={control}
              name='receiptTemplate.footer.policy'
              label={copy('Kebijakan pengembalian', 'Return or refund policy')}
              multiline
            />
            <TextField
              control={control}
              name='receiptTemplate.footer.social'
              label={copy('Media sosial', 'Social media')}
              placeholder='@namausaha'
            />
            <TextField
              control={control}
              name='receiptTemplate.footer.website'
              label={copy('Situs web', 'Website')}
            />
            <TextField
              control={control}
              name='receiptTemplate.footer.note'
              label={copy('Catatan lain', 'Other note')}
              multiline
            />
            <SwitchField
              control={control}
              name='receiptTemplate.footer.showQr'
              label={copy('Kode QR', 'QR code')}
              description={copy(
                'Misalnya tautan ulasan atau menu. Printer tanpa kode QR mencetak tautannya.',
                'For example a review or menu link. Printers without QR codes print the link.'
              )}
            />
            {showQr && (
              <TextField
                control={control}
                name='receiptTemplate.footer.qrValue'
                label={copy('Tautan kode QR', 'QR code link')}
                placeholder='https://'
              />
            )}
            <SwitchField
              control={control}
              name='receiptTemplate.footer.showPoweredBy'
              label='Powered by Ansilum'
            />
          </Section>

          <Section title={copy('Bahasa struk', 'Receipt language')}>
            <FormField
              control={control}
              name='receiptTemplate.language'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className='flex flex-col gap-2 sm:flex-row sm:gap-6'
                    >
                      <FormItem className='flex items-center gap-2'>
                        <FormControl>
                          <RadioGroupItem value='id' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          Bahasa Indonesia
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center gap-2'>
                        <FormControl>
                          <RadioGroupItem value='en' />
                        </FormControl>
                        <FormLabel className='font-normal'>English</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </Section>

          <Separator />

          <Section
            title={copy('Aturan cetak', 'Printing rules')}
            description={copy(
              'Berlaku di semua perangkat kasir. Printer dipasang di setiap perangkat lewat aplikasi Ansilum POS.',
              'Apply to every register. Printers are set up on each device in the Ansilum POS app.'
            )}
          >
            <SwitchField
              control={control}
              name='printReceipt'
              label={copy('Cetak struk pelanggan', 'Print customer receipts')}
            />
            <SwitchField
              control={control}
              name='autoPrintOnPayment'
              label={copy(
                'Cetak otomatis setelah pembayaran',
                'Print automatically after payment'
              )}
              disabled={!printReceipt}
            />
            <FormField
              control={control}
              name='receiptCopies'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between gap-4 rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      {copy('Jumlah salinan', 'Copies')}
                    </FormLabel>
                    <FormDescription>
                      {copy(
                        'Salinan setelah yang pertama ditandai SALINAN.',
                        'Copies after the first are marked COPY.'
                      )}
                    </FormDescription>
                  </div>
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={disabled || !printReceipt}
                  >
                    <FormControl>
                      <SelectTrigger className='w-20'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <SwitchField
              control={control}
              name='openCashDrawer'
              label={copy(
                'Buka laci uang untuk pembayaran tunai',
                'Open the cash drawer for cash payments'
              )}
              description={copy(
                'Untuk printer yang tersambung ke laci uang.',
                'For printers connected to a cash drawer.'
              )}
            />
            <SwitchField
              control={control}
              name='autoCutPaper'
              label={copy(
                'Potong kertas otomatis',
                'Cut the paper automatically'
              )}
              description={copy(
                'Untuk printer yang punya pemotong kertas.',
                'For printers with a paper cutter.'
              )}
            />
            <SwitchField
              control={control}
              name='printKitchenOrder'
              label={copy('Cetak tiket dapur', 'Print kitchen tickets')}
              description={copy(
                'Saat pesanan dikirim ke dapur.',
                'When an order is sent to the kitchen.'
              )}
            />
            <SwitchField
              control={control}
              name='enableBackupPrinter'
              label={copy('Pakai printer cadangan', 'Use a backup printer')}
              description={copy(
                'Jika printer struk gagal, struk dicetak di printer cadangan perangkat itu.',
                'When the receipt printer fails, the receipt prints on that device’s backup printer.'
              )}
            />
          </Section>
        </fieldset>

        {canEdit && (
          <div className='flex flex-wrap items-center gap-3'>
            <Button type='submit' disabled={saving || !formState.isDirty}>
              {saving ? copy('Menyimpan…', 'Saving…') : copy('Simpan', 'Save')}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() =>
                form.setValue('receiptTemplate', defaultReceiptTemplate(), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              {copy('Pakai desain bawaan', 'Use the default design')}
            </Button>
            {formState.isDirty && !saving && (
              <span className='text-muted-foreground text-sm'>
                {copy(
                  'Ada perubahan yang belum disimpan.',
                  'You have unsaved changes.'
                )}
              </span>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <h4 className='text-base font-medium'>{title}</h4>
        {description && (
          <p className='text-muted-foreground text-sm'>{description}</p>
        )}
      </div>
      <div className='space-y-3'>{children}</div>
    </section>
  )
}

function SwitchField({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<FormValues>
  name: FieldPathByValue<FormValues, boolean>
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-center justify-between gap-4 rounded-lg border p-4'>
          <div className='space-y-0.5'>
            <FormLabel className='text-base'>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function TextField({
  control,
  name,
  label,
  description,
  placeholder,
  multiline,
}: {
  control: Control<FormValues>
  name: FieldPathByValue<FormValues, string>
  label: string
  description?: string
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea rows={2} placeholder={placeholder} {...field} />
            ) : (
              <Input placeholder={placeholder} {...field} />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
