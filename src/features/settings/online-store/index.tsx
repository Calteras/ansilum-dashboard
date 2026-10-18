import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, ExternalLink } from '@/components/icons'
import { useAuth, useHasAnyRole } from '@/features/auth/hooks/use-auth'
import { useProductsQuery } from '@/features/products/api/products.queries'
import { storefrontUrl } from './online-store.api'
import {
  useOnlineStoreQuery,
  useOutletStorefrontMutation,
  useProductStorefrontMutation,
  useSaveOnlineStoreMutation,
} from './online-store.queries'
import { StorefrontSettingsForm } from './storefront-settings-form'

/**
 * Settings → Online store: the public storefront where customers order ahead
 * and pay at the counter. Orders arrive on the POS under Online orders.
 */
export function SettingsOnlineStore() {
  const copy = useCopy()
  const { activeTenant } = useAuth()
  const canEdit = useHasAnyRole(['OWNER', 'ADMIN'])
  const tenantId = activeTenant?.id
  const overview = useOnlineStoreQuery(tenantId)
  const save = useSaveOnlineStoreMutation(tenantId, {
    saved: copy('Toko online tersimpan', 'Online store saved'),
    failed: copy('Belum tersimpan', 'Not saved'),
  })
  const outlet = useOutletStorefrontMutation(
    tenantId,
    copy('Outlet belum diubah', 'Outlet not changed')
  )
  const [copied, setCopied] = useState(false)

  const data = overview.data
  const url = data ? storefrontUrl(data.config.slug) : ''
  const listed =
    data?.outlets.filter((o) => o.isActive && o.storefrontEnabled).length ?? 0
  const live = Boolean(data?.exists && data.config.enabled && listed > 0)

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>
          {copy('Toko online', 'Online store')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {copy(
            'Pelanggan memesan dari ponsel, lalu membayar di kasir. Pesanan masuk ke POS di menu Pesanan online.',
            'Customers order from their phone and pay at the counter. Orders arrive on the POS under Online orders.'
          )}
        </p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        {!activeTenant ? (
          <p className='text-muted-foreground text-sm'>
            {copy('Belum ada usaha dipilih.', 'No business selected.')}
          </p>
        ) : overview.isPending ? (
          <div className='max-w-xl space-y-3 px-1.5'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : overview.isError ? (
          <Alert variant='destructive' className='max-w-xl'>
            <AlertTitle>
              {copy(
                'Pengaturan toko online tidak bisa dimuat',
                'Online store settings could not load'
              )}
            </AlertTitle>
            <AlertDescription className='space-y-3'>
              <p>{overview.error.message}</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => overview.refetch()}
              >
                {copy('Coba lagi', 'Try again')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !data ? null : (
          <div className='max-w-xl space-y-6 px-1.5'>
            {!canEdit && (
              <Alert>
                <AlertDescription>
                  {copy(
                    'Hanya pemilik dan admin yang dapat mengubah toko online.',
                    'Only owners and admins can change the online store.'
                  )}
                </AlertDescription>
              </Alert>
            )}
            {!data.pricingValid && (
              <Alert variant='destructive'>
                <AlertTitle>
                  {copy(
                    'Pesanan online tidak bisa diterima',
                    'Online orders can’t be taken'
                  )}
                </AlertTitle>
                <AlertDescription>
                  {copy(
                    'Pengaturan pajak atau biaya layanan tidak valid. Perbaiki agar total online sama dengan total di kasir.',
                    'Your tax or service charge setting is invalid. Fix it so online totals match the register.'
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className='rounded-lg border p-4'>
              <p className='text-sm font-medium'>
                {live
                  ? copy('Toko online aktif', 'Your online store is live')
                  : copy(
                      'Toko online belum aktif',
                      'Your online store is not live'
                    )}
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {live
                  ? copy(
                      `${listed} outlet menerima pesanan.`,
                      `${listed} ${listed === 1 ? 'outlet is' : 'outlets are'} taking orders.`
                    )
                  : !data.exists || !data.config.enabled
                    ? copy(
                        'Aktifkan di tab Toko, lalu pilih outlet.',
                        'Switch it on under Store, then choose outlets.'
                      )
                    : copy(
                        'Aktifkan minimal satu outlet di tab Outlet.',
                        'Switch on at least one outlet under Outlets.'
                      )}
              </p>
              {data.exists && (
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <code className='bg-muted rounded px-2 py-1 text-[13px] break-all'>
                    {url}
                  </code>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(url)
                        .then(() => setCopied(true))
                    }}
                  >
                    <Copy size={14} />
                    {copied
                      ? copy('Disalin', 'Copied')
                      : copy('Salin tautan', 'Copy link')}
                  </Button>
                  {live && (
                    <Button asChild variant='outline' size='sm'>
                      <a href={url} target='_blank' rel='noreferrer'>
                        <ExternalLink size={14} />
                        {copy('Buka toko', 'Open store')}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Tabs defaultValue='store'>
              <TabsList variant='line'>
                <TabsTrigger value='store'>{copy('Toko', 'Store')}</TabsTrigger>
                <TabsTrigger value='outlets'>
                  {copy('Outlet', 'Outlets')}
                </TabsTrigger>
                <TabsTrigger value='menu'>{copy('Menu', 'Menu')}</TabsTrigger>
              </TabsList>

              <TabsContent value='store' className='pt-4'>
                <StorefrontSettingsForm
                  settings={data.config}
                  businessName={data.business.name}
                  canEdit={canEdit}
                  saving={save.isPending}
                  onSave={(values) => save.mutate(values)}
                />
              </TabsContent>

              <TabsContent value='outlets' className='pt-4'>
                <p className='text-muted-foreground pb-3 text-sm'>
                  {copy(
                    'Pilih outlet yang tampil di toko online. Gudang atau dapur pusat sebaiknya tetap mati.',
                    'Choose which outlets appear on your store. Keep warehouses and central kitchens off.'
                  )}
                </p>
                <ul className='divide-y rounded-lg border'>
                  {data.outlets.map((o) => (
                    <li
                      key={o.id}
                      className='flex items-center justify-between gap-4 px-4 py-3'
                    >
                      <div className='min-w-0'>
                        <p className='font-medium'>{o.name}</p>
                        <p className='text-muted-foreground truncate text-sm'>
                          {!o.isActive
                            ? copy('Outlet nonaktif', 'Outlet inactive')
                            : o.address || '—'}
                        </p>
                      </div>
                      <Switch
                        aria-label={copy(
                          `Pesanan online untuk ${o.name}`,
                          `Online orders for ${o.name}`
                        )}
                        checked={o.storefrontEnabled}
                        disabled={!canEdit || !o.isActive || outlet.isPending}
                        onCheckedChange={(enabled) =>
                          outlet.mutate({ outletId: o.id, enabled })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value='menu' className='pt-4'>
                <MenuVisibility tenantId={tenantId} canEdit={canEdit} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

/** Which active products customers can see. Prices and options come from the POS menu. */
function MenuVisibility({
  tenantId,
  canEdit,
}: {
  tenantId: string | undefined
  canEdit: boolean
}) {
  const copy = useCopy()
  const products = useProductsQuery({ productType: ['READY', 'COMPOSED'] })
  const toggle = useProductStorefrontMutation(
    tenantId,
    copy('Menu belum diubah', 'Menu not changed')
  )
  const [search, setSearch] = useState('')

  if (products.isPending) return <Skeleton className='h-40 w-full' />
  if (products.isError) {
    return (
      <p className='text-muted-foreground text-sm'>
        {copy('Menu tidak bisa dimuat.', 'The menu could not load.')}
      </p>
    )
  }
  const rows = (products.data?.data ?? [])
    .filter((p) => p.isActive)
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground text-sm'>
        {copy(
          'Menu aktif tampil otomatis dengan harga dan pilihan yang sama seperti di kasir. Sembunyikan item internal.',
          'Active menu items show automatically, with the same prices and options as the register. Hide internal items.'
        )}
      </p>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={copy('Cari menu', 'Search menu')}
        aria-label={copy('Cari menu', 'Search menu')}
      />
      <ul className='divide-y rounded-lg border'>
        {rows.length === 0 && (
          <li className='text-muted-foreground px-4 py-6 text-sm'>
            {copy('Tidak ada menu.', 'No menu items.')}
          </li>
        )}
        {rows.map((p) => (
          <li
            key={p.id}
            className='flex items-center justify-between gap-4 px-4 py-3'
          >
            <div className='min-w-0'>
              <p className='truncate font-medium'>{p.name}</p>
              <p className='text-muted-foreground text-sm'>
                {p.category?.name} · {formatMoney(p.basePrice)}
              </p>
            </div>
            <Switch
              aria-label={copy(`Tampilkan ${p.name}`, `Show ${p.name}`)}
              checked={p.storefrontVisible !== false}
              disabled={!canEdit || toggle.isPending}
              onCheckedChange={(visible) =>
                toggle.mutate({ productId: p.id, visible })
              }
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
