import { useState, type ReactNode } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { CircleOff, Pencil, Plus, RotateCcw } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useHasAnyRole } from '@/features/auth/hooks/use-auth'
import {
  usePricingSettingsQuery,
  useServiceChargeActiveMutation,
  useServiceChargesQuery,
  useSyncRegisterRatesMutation,
  useTaxActiveMutation,
  useTaxesQuery,
} from '../api/pricing.queries'
import type { ServiceCharge, TaxConfig } from '../api/pricing.types'
import { ChargeStateBadge, Notice } from '../components/pricing-ui'
import { usePricingDates, useTargetOptions } from '../hooks'
import {
  formatRate,
  namedRegisterRates,
  reachesRegister,
  registerRates,
  taxState,
} from '../lib/pricing'
import { BillPreview } from './bill-preview'
import { ServiceChargeFormDialog } from './service-charge-form-dialog'
import { TaxFormDialog } from './tax-form-dialog'

type Open =
  | { kind: 'tax'; tax?: TaxConfig }
  | { kind: 'service'; service?: ServiceCharge }
  | { kind: 'deactivateTax'; tax: TaxConfig }
  | { kind: 'deactivateService'; service: ServiceCharge }
  | null

export function Taxes() {
  const copy = useCopy()
  const dates = usePricingDates()
  const canManage = useHasAnyRole(['OWNER', 'ADMIN'])
  const taxes = useTaxesQuery()
  const services = useServiceChargesQuery()
  const settings = usePricingSettingsQuery()
  const targets = useTargetOptions()
  const toggleTax = useTaxActiveMutation()
  const toggleService = useServiceChargeActiveMutation()
  const [open, setOpen] = useState<Open>(null)
  const [now] = useState(() => Date.now())
  const close = (next: boolean) => !next && setOpen(null)

  const taxRows = taxes.data ?? []
  const serviceRows = services.data ?? []

  const scope = (tax: TaxConfig) => {
    const r = tax.rules ?? {}
    const parts = [
      r.outletIds?.length
        ? copy(`${r.outletIds.length} gerai`, `${r.outletIds.length} outlets`)
        : copy('Semua gerai', 'All outlets'),
    ]
    if (r.categoryIds?.length)
      parts.push(
        copy(
          `${r.categoryIds.length} kategori`,
          `${r.categoryIds.length} categories`
        )
      )
    if (r.productIds?.length)
      parts.push(
        copy(`${r.productIds.length} produk`, `${r.productIds.length} products`)
      )
    if (!r.categoryIds?.length && !r.productIds?.length)
      parts.push(copy('semua produk', 'all products'))
    if (r.exemptProductIds?.length)
      parts.push(
        copy(
          `kecuali ${r.exemptProductIds.length} produk`,
          `except ${r.exemptProductIds.length} products`
        )
      )
    if (r.validFrom && r.validUntil)
      parts.push(`${dates.date(r.validFrom)} – ${dates.date(r.validUntil)}`)
    else if (r.validFrom)
      parts.push(
        copy(
          `mulai ${dates.date(r.validFrom)}`,
          `from ${dates.date(r.validFrom)}`
        )
      )
    else if (r.validUntil)
      parts.push(
        copy(
          `s.d. ${dates.date(r.validUntil)}`,
          `until ${dates.date(r.validUntil)}`
        )
      )
    return parts.join(' · ')
  }

  return (
    <>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4'>
        <PageHeader
          title={copy('Pajak & biaya layanan', 'Taxes & service charge')}
          description={copy(
            'Tarif yang ditagihkan pada setiap penjualan',
            'The rates charged on every sale'
          )}
        />

        {taxes.data && services.data && settings.data && (
          <RegisterNotice
            taxes={taxRows}
            services={serviceRows}
            settings={settings.data}
            canManage={canManage}
          />
        )}

        <div className='grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'>
          <div className='grid min-w-0 gap-4'>
            <ChargePanel
              title={copy('Pajak', 'Taxes')}
              description={copy(
                'Dihitung dari harga setelah diskon. Pajak tidak dikenakan pada pajak lain.',
                'Charged on prices after discounts. Taxes are never charged on other taxes.'
              )}
              action={
                canManage && (
                  <Button size='sm' onClick={() => setOpen({ kind: 'tax' })}>
                    <Plus size={16} />
                    {copy('Tambah pajak', 'Add tax')}
                  </Button>
                )
              }
              query={taxes}
              empty={copy('Belum ada pajak', 'No taxes yet')}
              emptyDescription={copy(
                'Tambahkan PB1, PPN, atau pajak lain yang Anda tagihkan.',
                'Add PB1, VAT or any other tax you charge.'
              )}
              columns={[
                copy('Pajak', 'Tax'),
                copy('Tarif', 'Rate'),
                copy('Berlaku untuk', 'Applies to'),
                copy('Status', 'Status'),
              ]}
            >
              {taxRows.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className='whitespace-normal'>
                    <div className='font-medium'>{tax.name}</div>
                    <div className='text-fg-muted text-[13px]'>
                      {tax.isInclusive
                        ? copy('Sudah termasuk harga', 'Included in prices')
                        : tax.rules?.taxService
                          ? copy(
                              'Ditambahkan, juga atas biaya layanan',
                              'Added, also on the service charge'
                            )
                          : copy('Ditambahkan ke harga', 'Added to prices')}
                    </div>
                    <div className='mt-1 sm:hidden'>
                      <ChargeStateBadge state={taxState(tax, now)} />
                    </div>
                    {tax.isActive &&
                      !tax.isInclusive &&
                      !reachesRegister(tax) && (
                        <div className='text-status-warning text-xs'>
                          {copy(
                            'Belum diterapkan kasir versi saat ini',
                            'Not applied by the current register app yet'
                          )}
                        </div>
                      )}
                  </TableCell>
                  <TableCell className='text-end font-medium tabular-nums'>
                    {formatRate(tax.rate)}
                  </TableCell>
                  <TableCell className='text-fg-secondary max-w-64 whitespace-normal max-md:hidden'>
                    {scope(tax)}
                  </TableCell>
                  <TableCell className='max-sm:hidden'>
                    <ChargeStateBadge state={taxState(tax, now)} />
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <RowActions
                        isActive={tax.isActive}
                        onEdit={() => setOpen({ kind: 'tax', tax })}
                        onDeactivate={() =>
                          setOpen({ kind: 'deactivateTax', tax })
                        }
                        onActivate={() =>
                          toggleTax.mutate({ id: tax.id, isActive: true })
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </ChargePanel>

            <ChargePanel
              title={copy('Biaya layanan', 'Service charge')}
              description={copy(
                'Dihitung dari harga setelah diskon, di semua gerai.',
                'Charged on prices after discounts, at every outlet.'
              )}
              action={
                canManage && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setOpen({ kind: 'service' })}
                  >
                    <Plus size={16} />
                    {copy('Tambah biaya layanan', 'Add service charge')}
                  </Button>
                )
              }
              query={services}
              empty={copy('Tidak ada biaya layanan', 'No service charge')}
              emptyDescription={copy(
                'Tambahkan bila Anda menagih biaya layanan, misalnya 5% untuk makan di tempat.',
                'Add one if you charge for service, such as 5% for dine-in.'
              )}
              columns={[
                copy('Nama', 'Name'),
                copy('Tarif', 'Rate'),
                null,
                copy('Status', 'Status'),
              ]}
            >
              {serviceRows.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className='font-medium'>{service.name}</div>
                    <div className='mt-1 sm:hidden'>
                      <ChargeStateBadge
                        state={service.isActive ? 'active' : 'inactive'}
                      />
                    </div>
                  </TableCell>
                  <TableCell className='text-end font-medium tabular-nums'>
                    {formatRate(service.rate)}
                  </TableCell>
                  <TableCell className='max-sm:hidden'>
                    <ChargeStateBadge
                      state={service.isActive ? 'active' : 'inactive'}
                    />
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <RowActions
                        isActive={service.isActive}
                        onEdit={() => setOpen({ kind: 'service', service })}
                        onDeactivate={() =>
                          setOpen({ kind: 'deactivateService', service })
                        }
                        onActivate={() =>
                          toggleService.mutate({
                            id: service.id,
                            isActive: true,
                          })
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </ChargePanel>
          </div>

          <div className='lg:sticky lg:top-[calc(var(--app-header-height)+1rem)]'>
            {taxes.data && services.data ? (
              <BillPreview
                taxes={taxRows}
                services={serviceRows}
                settings={settings.data}
                outlets={targets.activeOutlets}
              />
            ) : (
              <DataPanel className='bg-surface-hover h-72 animate-pulse' />
            )}
          </div>
        </div>
      </Main>

      {open?.kind === 'tax' && (
        <TaxFormDialog tax={open.tax} open onOpenChange={close} />
      )}
      {open?.kind === 'service' && (
        <ServiceChargeFormDialog
          service={open.service}
          open
          onOpenChange={close}
        />
      )}
      <ConfirmDialog
        open={open?.kind === 'deactivateTax'}
        onOpenChange={close}
        title={copy('Nonaktifkan pajak?', 'Deactivate this tax?')}
        desc={copy(
          'Penjualan baru tidak lagi dikenai pajak ini. Penjualan lama tetap memakai tarif saat itu, dan Anda bisa mengaktifkannya lagi.',
          'New sales stop being charged this tax. Past sales keep the rate they were charged, and you can activate it again.'
        )}
        confirmText={copy('Nonaktifkan', 'Deactivate')}
        cancelBtnText={copy('Batal', 'Cancel')}
        destructive
        isLoading={toggleTax.isPending}
        handleConfirm={async () => {
          if (open?.kind !== 'deactivateTax') return
          try {
            await toggleTax.mutateAsync({ id: open.tax.id, isActive: false })
            setOpen(null)
          } catch {
            // Toast shown by the mutation
          }
        }}
      />
      <ConfirmDialog
        open={open?.kind === 'deactivateService'}
        onOpenChange={close}
        title={copy(
          'Nonaktifkan biaya layanan?',
          'Deactivate this service charge?'
        )}
        desc={copy(
          'Penjualan baru tidak lagi dikenai biaya ini. Penjualan lama tidak berubah, dan Anda bisa mengaktifkannya lagi.',
          'New sales stop being charged it. Past sales are unchanged, and you can activate it again.'
        )}
        confirmText={copy('Nonaktifkan', 'Deactivate')}
        cancelBtnText={copy('Batal', 'Cancel')}
        destructive
        isLoading={toggleService.isPending}
        handleConfirm={async () => {
          if (open?.kind !== 'deactivateService') return
          try {
            await toggleService.mutateAsync({
              id: open.service.id,
              isActive: false,
            })
            setOpen(null)
          } catch {
            // Toast shown by the mutation
          }
        }}
      />
    </>
  )
}

/** What registers on the current app charge, and whether it matches the rows. */
function RegisterNotice({
  taxes,
  services,
  settings,
  canManage,
}: {
  taxes: TaxConfig[]
  services: ServiceCharge[]
  settings: NonNullable<ReturnType<typeof usePricingSettingsQuery>['data']>
  canManage: boolean
}) {
  const copy = useCopy()
  const sync = useSyncRegisterRatesMutation()
  const register = registerRates(settings)
  const named = namedRegisterRates(taxes, services)
  const taxDrift = named.tax !== null && named.tax !== register.tax
  const serviceDrift =
    named.service !== null && named.service !== register.service
  const limited = taxes.some(
    (t) => t.isActive && (t.isInclusive || !reachesRegister(t))
  )
  const rates = copy(
    `pajak ${formatRate(register.tax)} dan biaya layanan ${formatRate(register.service)}`,
    `${formatRate(register.tax)} tax and ${formatRate(register.service)} service charge`
  )

  if (taxDrift || serviceDrift)
    return (
      <Notice
        tone='warning'
        title={copy(
          'Kasir belum memakai tarif di halaman ini',
          'Registers are not using the rates on this page'
        )}
        action={
          canManage && (
            <Button
              size='sm'
              variant='outline'
              disabled={sync.isPending}
              onClick={() =>
                sync.mutate({
                  ...(taxDrift && { taxPercentage: named.tax! }),
                  ...(serviceDrift && {
                    serviceChargePercentage: named.service!,
                  }),
                })
              }
            >
              {copy('Samakan kasir', 'Update registers')}
            </Button>
          )
        }
      >
        {copy(
          `Kasir versi saat ini menambahkan ${rates} ke setiap item, sedangkan tarif di bawah berjumlah pajak ${formatRate(named.tax ?? register.tax)} dan biaya layanan ${formatRate(named.service ?? register.service)}.`,
          `Registers on the current app add ${rates} to every item, while the rates below add up to ${formatRate(named.tax ?? register.tax)} tax and ${formatRate(named.service ?? register.service)} service charge.`
        )}
      </Notice>
    )

  return (
    <Notice title={copy('Di kasir', 'At the register')}>
      <p>
        {copy(
          `Kasir versi saat ini menambahkan ${rates} ke setiap item. Perubahan sampai ke kasir saat perangkat memperbarui katalognya.`,
          `Registers on the current app add ${rates} to every item. Changes reach a register when it refreshes its catalog.`
        )}
      </p>
      {limited && (
        <p className='mt-1'>
          {copy(
            'Pajak yang sudah termasuk harga belum dirinci di struk kasir, dan pajak khusus gerai, produk, kategori, atau periode belum diterapkan kasir. Toko online dan transaksi yang dihitung online sudah menghitung semuanya.',
            'Tax included in prices is not itemised on register receipts yet, and taxes limited to outlets, products, categories or dates are not applied by registers yet. The online store and sales priced online already apply all of them.'
          )}
        </p>
      )}
    </Notice>
  )
}

function ChargePanel({
  title,
  description,
  action,
  query,
  empty,
  emptyDescription,
  columns,
  children,
}: {
  title: string
  description: string
  action: ReactNode
  query: {
    isLoading: boolean
    isError: boolean
    isFetching: boolean
    error: Error | null
    data?: unknown[]
    refetch: () => unknown
  }
  empty: string
  emptyDescription: string
  /** Name, rate, an optional scope column, status. */
  columns: [string, string, string | null, string]
  children: ReactNode
}) {
  const copy = useCopy()
  const span = columns[2] ? 5 : 4
  return (
    <DataPanel className='overflow-hidden'>
      <SectionHeader
        title={title}
        description={description}
        actions={action}
        className='p-4 pb-3 sm:px-5'
      />
      {query.isError ? (
        <ErrorState
          title={copy('Belum termuat', "Couldn't load")}
          description={query.error?.message}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : !query.isLoading && query.data?.length === 0 ? (
        <EmptyState title={empty} description={emptyDescription} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{columns[0]}</TableHead>
              <TableHead className='text-end'>{columns[1]}</TableHead>
              {columns[2] && (
                <TableHead className='max-md:hidden'>{columns[2]}</TableHead>
              )}
              <TableHead className='max-sm:hidden'>{columns[3]}</TableHead>
              <TableHead className='w-10'>
                <span className='sr-only'>{copy('Aksi', 'Actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading
              ? Array.from({ length: 2 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={span}>
                      <span className='bg-surface-hover block h-5 animate-pulse rounded' />
                    </TableCell>
                  </TableRow>
                ))
              : children}
          </TableBody>
        </Table>
      )}
    </DataPanel>
  )
}

function RowActions({
  isActive,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  isActive: boolean
  onEdit: () => void
  onDeactivate: () => void
  onActivate: () => void
}) {
  const copy = useCopy()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>{copy('Buka menu', 'Open menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[170px]'>
        <DropdownMenuItem onClick={onEdit}>
          {copy('Ubah', 'Edit')}
          <DropdownMenuShortcut>
            <Pencil size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isActive ? (
          <DropdownMenuItem
            onClick={onDeactivate}
            className='text-status-danger!'
          >
            {copy('Nonaktifkan', 'Deactivate')}
            <DropdownMenuShortcut>
              <CircleOff size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onActivate}>
            {copy('Aktifkan', 'Activate')}
            <DropdownMenuShortcut>
              <RotateCcw size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
