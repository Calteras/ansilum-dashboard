import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { OutletSelect } from '@/components/outlet-select'
import type {
  PricingSettings,
  ServiceCharge,
  TaxConfig,
} from '../api/pricing.types'
import {
  billPreview,
  formatRate,
  previewPolicy,
  registerBill,
  registerRates,
} from '../lib/pricing'

const EXAMPLE = '100000'
const digits = (value: string) => value.replace(/\D/g, '').slice(0, 10)

/** A worked bill for one menu price at one outlet, as the server prices it. */
export function BillPreview({
  taxes,
  services,
  settings,
  outlets,
}: {
  taxes: TaxConfig[]
  services: ServiceCharge[]
  settings: PricingSettings | undefined
  outlets: { id: string; name: string }[]
}) {
  const copy = useCopy()
  const [amount, setAmount] = useState(EXAMPLE)
  const [picked, setPicked] = useState<string | null>(null)
  const outletId = picked ?? outlets[0]?.id ?? null
  const [now] = useState(() => Date.now())

  const policy = previewPolicy({ taxes, services, settings, outletId, now })
  const price = Number(amount || 0)
  const bill = billPreview(policy, price)
  const register = registerBill(price, registerRates(settings))
  const rate = (bps: number) => formatRate(bps / 100)
  const legacyName = (id: string, name: string) =>
    id === 'legacy-tax'
      ? copy('Pajak', 'Tax')
      : id === 'legacy-service'
        ? copy('Biaya layanan', 'Service charge')
        : name

  const line = (
    key: string,
    label: string,
    value: number,
    options: { muted?: boolean; sign?: string } = {}
  ) => (
    <div
      key={key}
      className={cn(
        'flex items-baseline justify-between gap-4 py-1.5',
        options.muted && 'text-fg-muted ps-3 text-[13px]'
      )}
    >
      <dt>{label}</dt>
      <dd className='tabular-nums'>
        {options.sign}
        {formatMoney(value)}
      </dd>
    </div>
  )

  return (
    <DataPanel className='p-4 sm:p-5'>
      <SectionHeader
        title={copy('Contoh tagihan', 'Example bill')}
        description={copy(
          'Satu item tanpa diskon, dihitung seperti di server.',
          'One undiscounted item, priced the way the server does.'
        )}
        actions={
          outlets.length > 1 && (
            <OutletSelect
              outlets={outlets}
              value={outletId ?? ''}
              onValueChange={setPicked}
            />
          )
        }
        className='mb-4'
      />
      <div className='mb-3 grid gap-2'>
        <Label htmlFor='example-price'>
          {copy('Harga menu (Rp)', 'Menu price (Rp)')}
        </Label>
        <Input
          id='example-price'
          inputMode='numeric'
          className='tabular-nums sm:w-48'
          value={amount}
          onChange={(e) => setAmount(digits(e.target.value))}
        />
      </div>
      <dl className='divide-divider divide-y text-sm'>
        <div>
          {line('subtotal', copy('Harga menu', 'Menu price'), bill.subtotal)}
          {bill.includedTax.map((t) =>
            line(
              t.id,
              copy(
                `Termasuk ${t.name} ${rate(t.rate)}`,
                `Includes ${t.name} ${rate(t.rate)}`
              ),
              t.amount,
              { muted: true }
            )
          )}
        </div>
        {(bill.services.length > 0 || bill.addedTax.length > 0) && (
          <div>
            {bill.services.map((s) =>
              line(
                s.id,
                `${legacyName(s.id, s.name)} ${rate(s.rate)}`,
                s.amount,
                { sign: '+' }
              )
            )}
            {bill.addedTax.map((t) =>
              line(
                t.id,
                `${legacyName(t.id, t.name)} ${rate(t.rate)}`,
                t.amount,
                { sign: '+' }
              )
            )}
          </div>
        )}
        <div className='flex items-baseline justify-between gap-4 pt-2 font-semibold'>
          <dt>{copy('Total dibayar', 'Total to pay')}</dt>
          <dd className='tabular-nums'>{formatMoney(bill.total)}</dd>
        </div>
      </dl>

      <div className='text-fg-muted mt-4 grid gap-1.5 text-[13px]'>
        {policy.productTaxes.length > 0 && (
          <p>
            {copy(
              `Hanya untuk produk atau kategori tertentu, tidak ada dalam contoh: ${policy.productTaxes.map((t) => `${t.name} ${formatRate(t.rate)}`).join(', ')}.`,
              `Only for some products or categories, so not in the example: ${policy.productTaxes.map((t) => `${t.name} ${formatRate(t.rate)}`).join(', ')}.`
            )}
          </p>
        )}
        {(policy.legacyTax || policy.legacyService) && (
          <p>
            {copy(
              'Tarif dari pengaturan lama dipakai sampai Anda menambahkan pajak atau biaya layanan di halaman ini.',
              'Rates from the older settings apply until you add a tax or service charge on this page.'
            )}
          </p>
        )}
        {register.total !== bill.total && (
          <p className='text-foreground'>
            {copy(
              `Kasir versi saat ini menagih ${formatMoney(register.total)} untuk item yang sama.`,
              `A register on the current app charges ${formatMoney(register.total)} for the same item.`
            )}
          </p>
        )}
      </div>
    </DataPanel>
  )
}
