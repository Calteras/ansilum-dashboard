import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
import type { StorefrontSettings } from './online-store.api'

type Copy = ReturnType<typeof useCopy>

const RESERVED = new Set([
  'admin',
  'ansilum',
  'api',
  'app',
  'apps',
  'assets',
  'auth',
  'billing',
  'cart',
  'checkout',
  'dashboard',
  'help',
  'login',
  'logout',
  'me',
  'new',
  'o',
  'order',
  'orders',
  'outlet',
  'outlets',
  'pos',
  'pricing',
  'public',
  'register',
  'settings',
  'sign-in',
  'sign-up',
  'signin',
  'signup',
  'static',
  'store',
  'stores',
  'support',
  'terrapos',
  'www',
])

const EXPIRY_CHOICES = [15, 30, 45, 60, 90, 120]

function schema(copy: Copy) {
  return z.object({
    enabled: z.boolean(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, copy('Minimal 3 karakter.', 'At least 3 characters.'))
      .max(40, copy('Maksimal 40 karakter.', 'At most 40 characters.'))
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        copy(
          'Gunakan huruf kecil, angka, dan tanda hubung tunggal.',
          'Use lowercase letters, numbers and single hyphens.'
        )
      )
      .refine(
        (value) => !RESERVED.has(value),
        copy(
          'Alamat ini sudah dipakai sistem. Pilih yang lain.',
          'This address is reserved. Choose another one.'
        )
      ),
    displayName: z.string().max(80),
    description: z.string().max(280),
    primaryColor: z
      .string()
      .regex(
        /^(#[0-9a-fA-F]{6})?$/,
        copy('Gunakan format #RRGGBB.', 'Use the #RRGGBB format.')
      ),
    showSoldOutProducts: z.boolean(),
    orderExpiryMinutes: z.number().int().min(5).max(240),
  })
}
type Values = z.infer<ReturnType<typeof schema>>

const toValues = (s: StorefrontSettings): Values => ({
  enabled: s.enabled,
  slug: s.slug,
  displayName: s.displayName ?? '',
  description: s.description ?? '',
  primaryColor: s.primaryColor ?? '',
  showSoldOutProducts: s.showSoldOutProducts,
  orderExpiryMinutes: s.orderExpiryMinutes,
})

export function StorefrontSettingsForm({
  settings,
  businessName,
  canEdit,
  saving,
  onSave,
}: {
  settings: StorefrontSettings
  businessName: string
  canEdit: boolean
  saving: boolean
  onSave: (settings: StorefrontSettings) => void
}) {
  const copy = useCopy()
  const form = useForm<Values>({
    resolver: zodResolver(schema(copy)),
    defaultValues: toValues(settings),
  })
  useEffect(() => form.reset(toValues(settings)), [settings, form])

  const submit = form.handleSubmit((values) =>
    onSave({
      ...values,
      displayName: values.displayName.trim() || null,
      description: values.description.trim() || null,
      primaryColor: values.primaryColor || null,
    })
  )

  return (
    <Form {...form}>
      <form onSubmit={submit} className='space-y-6'>
        <fieldset disabled={!canEdit} className='space-y-6'>
          <FormField
            control={form.control}
            name='enabled'
            render={({ field }) => (
              <FormItem className='bg-card shadow-surface flex items-start justify-between gap-4 rounded-lg border p-4'>
                <div className='space-y-1'>
                  <FormLabel className='text-[15px]'>
                    {copy('Terima pesanan online', 'Take online orders')}
                  </FormLabel>
                  <FormDescription>
                    {copy(
                      'Pelanggan memesan dari ponsel dan membayar di kasir. Hanya outlet yang Anda aktifkan yang tampil.',
                      'Customers order from their phone and pay at the counter. Only the outlets you switch on are listed.'
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

          <FormField
            control={form.control}
            name='slug'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy('Alamat toko', 'Store address')}</FormLabel>
                <div className='bg-card focus-within:ring-ring/50 flex items-center rounded-md border focus-within:ring-[3px]'>
                  <span className='text-fg-muted ps-3 text-sm whitespace-nowrap'>
                    {window.location.host}/store/
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      className='border-0 ps-0.5 shadow-none focus-visible:ring-0'
                      autoCapitalize='none'
                      spellCheck={false}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  {copy(
                    'Mengubah alamat membuat tautan dan kode QR lama tidak berlaku.',
                    'Changing the address breaks links and QR codes you already shared.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name='displayName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy('Nama toko', 'Store name')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={businessName} maxLength={80} />
                </FormControl>
                <FormDescription>
                  {copy(
                    'Kosongkan untuk memakai nama usaha. Logo diambil dari Pengaturan → Usaha.',
                    'Leave empty to use your business name. The logo comes from Settings → Business.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {copy('Deskripsi singkat', 'Short description')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    maxLength={280}
                    className='resize-none'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='primaryColor'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy('Warna utama', 'Brand colour')}</FormLabel>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    aria-label={copy('Pilih warna', 'Pick a colour')}
                    value={field.value || '#111418'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className='size-9 cursor-pointer rounded-md border bg-transparent p-0.5'
                  />
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='#111418'
                      className='w-32 font-mono'
                      maxLength={7}
                    />
                  </FormControl>
                  {field.value && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => field.onChange('')}
                    >
                      {copy('Pakai bawaan', 'Use default')}
                    </Button>
                  )}
                </div>
                <FormDescription>
                  {copy(
                    'Dipakai untuk tombol dan sorotan di toko online.',
                    'Used for buttons and highlights on your store.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name='showSoldOutProducts'
            render={({ field }) => (
              <FormItem className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <FormLabel>
                    {copy('Tampilkan menu yang habis', 'Show sold-out items')}
                  </FormLabel>
                  <FormDescription>
                    {copy(
                      'Ditandai Habis dan tidak bisa dipesan. Matikan untuk menyembunyikannya.',
                      'Marked Sold out and can’t be ordered. Turn off to hide them.'
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
          <FormField
            control={form.control}
            name='orderExpiryMinutes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {copy('Batas waktu bayar', 'Time to pay')}
                </FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger className='w-48'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[...new Set([...EXPIRY_CHOICES, field.value])]
                      .sort((a, b) => a - b)
                      .map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {copy(`${m} menit`, `${m} minutes`)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {copy(
                    'Pesanan yang belum dibayar dalam waktu ini kedaluwarsa dan tidak bisa dibayar lagi.',
                    'Orders not paid within this time expire and can no longer be paid.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {canEdit && (
          <Button type='submit' disabled={saving}>
            {saving ? copy('Menyimpan…', 'Saving…') : copy('Simpan', 'Save')}
          </Button>
        )}
      </form>
    </Form>
  )
}
