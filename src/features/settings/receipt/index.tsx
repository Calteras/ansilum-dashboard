import { useCallback, useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye } from '@/components/icons'
import { useAuth, useHasAnyRole } from '@/features/auth/hooks/use-auth'
import { useOutletsQuery } from '@/features/outlets/api/outlets.queries'
import { ReceiptPreview } from './components/receipt-preview'
import { ReceiptSettingsForm } from './components/receipt-settings-form'
import type { ReceiptTemplate } from './layout/receipt-template'
import {
  useReceiptSettingsQuery,
  useUpdateReceiptSettingsMutation,
} from './receipt-settings.queries'

/**
 * Settings → Struk & cetak: how receipts look and when they print, for every
 * register of the business. The POS app loads these with its configuration;
 * printers are set up on each device.
 */
export function SettingsReceipt() {
  const copy = useCopy()
  const { activeTenant } = useAuth()
  const canEdit = useHasAnyRole(['OWNER', 'ADMIN'])
  const tenantId = activeTenant?.id
  const settings = useReceiptSettingsQuery(tenantId)
  const outlets = useOutletsQuery({ pageSize: 100 })
  const save = useUpdateReceiptSettingsMutation(tenantId, {
    saved: copy('Struk & cetak tersimpan', 'Receipt and printing saved'),
    failed: copy('Belum tersimpan', 'Not saved'),
  })
  const [template, setTemplate] = useState<ReceiptTemplate | null>(null)
  const onTemplateChange = useCallback(
    (next: ReceiptTemplate) => setTemplate(next),
    []
  )

  const preview =
    template === null ? null : (
      <ReceiptPreview
        template={template}
        businessName={activeTenant?.name ?? ''}
        logoUrl={activeTenant?.logo}
        outlets={(outlets.data?.data ?? []).filter((o) => o.isActive)}
      />
    )

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex flex-none items-start justify-between gap-4'>
        <div>
          <h3 className='text-lg font-medium'>
            {copy('Struk & cetak', 'Receipt & printing')}
          </h3>
          <p className='text-muted-foreground text-sm'>
            {copy(
              'Atur tampilan struk dan kapan dicetak, untuk semua perangkat kasir.',
              'Set how receipts look and when they print, on every register.'
            )}
          </p>
        </div>
        {preview && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm' className='2xl:hidden'>
                <Eye size={16} />
                {copy('Pratinjau', 'Preview')}
              </Button>
            </SheetTrigger>
            <SheetContent className='w-full overflow-y-auto sm:max-w-[30rem]'>
              <SheetHeader>
                <SheetTitle>
                  {copy('Pratinjau struk', 'Receipt preview')}
                </SheetTitle>
                <SheetDescription>
                  {copy(
                    'Mengikuti perubahan yang belum disimpan.',
                    'Shows your unsaved changes.'
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className='px-4 pb-6'>{preview}</div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        {!activeTenant ? (
          <p className='text-muted-foreground text-sm'>
            {copy('Belum ada usaha dipilih.', 'No business selected.')}
          </p>
        ) : settings.isPending ? (
          <div className='max-w-xl space-y-3 px-1.5'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        ) : settings.isError ? (
          <Alert variant='destructive' className='max-w-xl'>
            <AlertTitle>
              {copy(
                'Pengaturan struk tidak bisa dimuat',
                'Receipt settings could not load'
              )}
            </AlertTitle>
            <AlertDescription className='space-y-3'>
              <p>{settings.error.message}</p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => settings.refetch()}
              >
                {copy('Coba lagi', 'Try again')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className='grid gap-8 px-1.5 2xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]'>
            <div className='max-w-xl space-y-6'>
              {!canEdit && (
                <Alert>
                  <AlertDescription>
                    {copy(
                      'Hanya pemilik dan admin yang dapat mengubah struk dan aturan cetak.',
                      'Only owners and admins can change receipts and printing rules.'
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <ReceiptSettingsForm
                settings={settings.data}
                canEdit={canEdit}
                saving={save.isPending}
                businessName={activeTenant.name}
                hasLogo={Boolean(activeTenant.logo)}
                onSave={(values) => save.mutate(values)}
                onTemplateChange={onTemplateChange}
              />
            </div>
            <aside className='hidden 2xl:block'>
              <div className='sticky top-0'>{preview}</div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
