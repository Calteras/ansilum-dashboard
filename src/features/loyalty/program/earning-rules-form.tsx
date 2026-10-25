import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useHasAnyRole } from '@/features/auth/hooks/use-auth'
import { useUpdateLoyaltyConfigMutation } from '../api/loyalty.queries'
import type { LoyaltyConfig } from '../api/loyalty.types'
import { formatPoints, pointsForSpend } from '../lib/loyalty'

/** A sale size that makes the worked example read naturally. */
const EXAMPLE_SALE = 45_000
const digits = (value: string) => value.replace(/\D/g, '')

export function EarningRulesForm({ config }: { config: LoyaltyConfig }) {
  const copy = useCopy()
  const canEdit = useHasAnyRole(['OWNER', 'ADMIN'])
  const save = useUpdateLoyaltyConfigMutation()
  const [isEnabled, setEnabled] = useState(config.isEnabled)
  const [perPoint, setPerPoint] = useState(
    String(Number(config.pointsPerAmount))
  )
  const [minimum, setMinimum] = useState(
    String(Number(config.minimumAmountForPoints))
  )

  const perPointValue = Number(perPoint)
  const validPerPoint = Number.isInteger(perPointValue) && perPointValue >= 1
  const rule = {
    isEnabled,
    pointsPerAmount: validPerPoint ? perPointValue : 0,
    minimumAmountForPoints: Number(minimum || 0),
  }
  const example = Math.max(EXAMPLE_SALE, rule.minimumAmountForPoints)
  const dirty =
    isEnabled !== config.isEnabled ||
    perPointValue !== Number(config.pointsPerAmount) ||
    Number(minimum || 0) !== Number(config.minimumAmountForPoints)

  return (
    <form
      className='grid gap-5'
      onSubmit={(e) => {
        e.preventDefault()
        if (!validPerPoint) return
        save.mutate({
          isEnabled,
          pointsPerAmount: perPointValue,
          minimumAmountForPoints: Number(minimum || 0),
        })
      }}
    >
      <label className='flex items-start justify-between gap-4'>
        <span>
          <span className='block text-sm font-medium'>
            {copy('Program poin aktif', 'Program on')}
          </span>
          <span className='text-fg-muted block text-[13px]'>
            {copy(
              'Saat dijeda, saldo dan hadiah tetap ada tetapi tidak ada poin baru.',
              'While paused, balances and rewards stay but no new points are earned.'
            )}
          </span>
        </span>
        <Switch
          checked={isEnabled}
          onCheckedChange={setEnabled}
          disabled={!canEdit}
          aria-label={copy('Program poin aktif', 'Program on')}
        />
      </label>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='grid gap-2'>
          <Label htmlFor='points-per-amount'>
            {copy('Belanja untuk 1 poin (Rp)', 'Spend for 1 point (Rp)')}
          </Label>
          <Input
            id='points-per-amount'
            inputMode='numeric'
            className='tabular-nums'
            value={perPoint}
            disabled={!canEdit}
            onChange={(e) => setPerPoint(digits(e.target.value))}
            aria-invalid={!validPerPoint}
          />
          {!validPerPoint && (
            <p className='text-status-danger text-[13px]'>
              {copy('Minimal Rp1.', 'At least Rp1.')}
            </p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='minimum-for-points'>
            {copy('Minimal belanja (Rp)', 'Minimum spend (Rp)')}
          </Label>
          <Input
            id='minimum-for-points'
            inputMode='numeric'
            className='tabular-nums'
            value={minimum}
            disabled={!canEdit}
            onChange={(e) => setMinimum(digits(e.target.value))}
          />
          <p className='text-fg-muted text-[13px]'>
            {copy(
              'Di bawah ini tidak mendapat poin.',
              'Sales below this earn nothing.'
            )}
          </p>
        </div>
      </div>

      <p className='bg-surface-subtle border-divider rounded-md border px-3 py-2 text-[13px]'>
        {isEnabled && validPerPoint
          ? copy(
              `Contoh: belanja ${formatMoney(example)} mendapat ${formatPoints(pointsForSpend(example, rule))} poin.`,
              `Example: a ${formatMoney(example)} sale earns ${formatPoints(pointsForSpend(example, rule))} points.`
            )
          : copy(
              'Tidak ada poin yang didapat saat program dijeda.',
              'No points are earned while the program is paused.'
            )}{' '}
        <span className='text-fg-muted'>
          {copy(
            'Perubahan berlaku di kasir setelah perangkat memperbarui aturan.',
            'Registers apply changes once they refresh their rules.'
          )}
        </span>
      </p>

      {canEdit ? (
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={!dirty || !validPerPoint || save.isPending}
          >
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan aturan', 'Save rules')}
          </Button>
        </div>
      ) : (
        <p className='text-fg-muted text-[13px]'>
          {copy(
            'Hanya pemilik dan admin yang bisa mengubah aturan poin.',
            'Only owners and admins can change the earning rules.'
          )}
        </p>
      )}
    </form>
  )
}
