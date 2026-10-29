import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUpdatePricingControlsMutation } from '../api/pricing.queries'
import type { PricingControls } from '../api/pricing.types'
import { formatRate, parseDecimal } from '../lib/pricing'

const PERCENT = /^\d{1,3}([.,]\d{1,2})?$/

/** Limits on reductions a cashier gives by hand (customSettings.pricingControls). */
export function ManualDiscountForm({
  controls,
  canEdit,
}: {
  controls: PricingControls
  canEdit: boolean
}) {
  const copy = useCopy()
  const save = useUpdatePricingControlsMutation()
  const [limit, setLimit] = useState(String(controls.maxManualPercent))
  const [requireReason, setRequireReason] = useState(controls.requireReason)
  const [allowOverride, setAllowOverride] = useState(
    controls.allowPriceOverride
  )

  const limitValue = parseDecimal(limit)
  const validLimit = PERCENT.test(limit) && limitValue >= 0 && limitValue <= 100
  const dirty =
    limitValue !== controls.maxManualPercent ||
    requireReason !== controls.requireReason ||
    allowOverride !== controls.allowPriceOverride

  const toggle = (
    id: string,
    label: string,
    description: string,
    checked: boolean,
    onChange: (next: boolean) => void
  ) => (
    <div className='flex items-start justify-between gap-4'>
      <div>
        <Label htmlFor={id} className='text-sm font-medium'>
          {label}
        </Label>
        <p className='text-fg-muted text-[13px]'>{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={!canEdit}
      />
    </div>
  )

  return (
    <form
      className='grid gap-5'
      onSubmit={(e) => {
        e.preventDefault()
        if (!validLimit) return
        save.mutate({
          maxManualPercent: limitValue,
          requireReason,
          allowPriceOverride: allowOverride,
        })
      }}
    >
      <div className='grid gap-2 sm:max-w-xs'>
        <Label htmlFor='max-manual-percent'>
          {copy('Batas diskon manual (%)', 'Manual discount limit (%)')}
        </Label>
        <Input
          id='max-manual-percent'
          inputMode='decimal'
          className='tabular-nums'
          value={limit}
          disabled={!canEdit}
          onChange={(e) =>
            setLimit(
              e.target.value
                .replace(/[^\d.,]/g, '')
                .replace(/([.,]\d{0,2}).*$/, '$1')
            )
          }
          aria-invalid={!validLimit}
          aria-describedby='max-manual-percent-help'
        />
        <p
          id='max-manual-percent-help'
          className={
            validLimit
              ? 'text-fg-muted text-[13px]'
              : 'text-status-danger text-[13px]'
          }
        >
          {validLimit
            ? limitValue >= 100
              ? copy('100 berarti tanpa batas.', '100 means no limit.')
              : copy(
                  `Diskon per item dan diskon pesanan yang diberikan kasir, digabung, paling besar ${formatRate(limitValue)} dari subtotal. Di atasnya perlu persetujuan pemilik, admin, atau supervisor.`,
                  `Line and order discounts a cashier gives, combined, up to ${formatRate(limitValue)} of the subtotal. Beyond it, an owner, admin or supervisor must approve.`
                )
            : copy('Antara 0 dan 100.', 'Between 0 and 100.')}
        </p>
      </div>

      {toggle(
        'require-reason',
        copy('Wajib isi alasan', 'Require a reason'),
        copy(
          'Kasir menulis alasan setiap memberi diskon manual atau mengubah harga. Alasan tersimpan di riwayat transaksi.',
          'Cashiers write a reason for every manual discount or price change. It is kept in the sale history.'
        ),
        requireReason,
        setRequireReason
      )}
      {toggle(
        'allow-price-override',
        copy('Kasir boleh mengubah harga', 'Cashiers may change prices'),
        copy(
          'Bila mati, harga hanya bisa diubah dengan persetujuan dan saat kasir online.',
          'Off: prices can only change with approval, while the register is online.'
        ),
        allowOverride,
        setAllowOverride
      )}

      {canEdit ? (
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={!dirty || !validLimit || save.isPending}
          >
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan aturan', 'Save rules')}
          </Button>
        </div>
      ) : (
        <p className='text-fg-muted text-[13px]'>
          {copy(
            'Hanya pemilik dan admin yang bisa mengubah aturan ini.',
            'Only owners and admins can change these rules.'
          )}
        </p>
      )}
    </form>
  )
}
