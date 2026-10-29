import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSaveServiceChargeMutation } from '../api/pricing.queries'
import type { ServiceCharge } from '../api/pricing.types'
import { parseDecimal } from '../lib/pricing'

const RATE = /^\d{1,3}([.,]\d{1,2})?$/

export function ServiceChargeFormDialog({
  service,
  open,
  onOpenChange,
}: {
  service?: ServiceCharge
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const copy = useCopy()
  const save = useSaveServiceChargeMutation()
  const [name, setName] = useState(
    service?.name ?? copy('Biaya layanan', 'Service charge')
  )
  const [rate, setRate] = useState(service ? String(Number(service.rate)) : '')
  const [submitted, setSubmitted] = useState(false)
  const nameOk = name.trim().length > 0 && name.trim().length <= 100
  const rateOk =
    RATE.test(rate) && parseDecimal(rate) > 0 && parseDecimal(rate) <= 100

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !save.isPending && onOpenChange(next)}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {service
              ? copy('Ubah biaya layanan', 'Edit service charge')
              : copy('Biaya layanan baru', 'New service charge')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              'Dihitung dari harga setelah diskon, tanpa pajak yang sudah termasuk harga. Berlaku di semua gerai.',
              'Charged on prices after discounts, excluding tax already in prices. Applies at every outlet.'
            )}
          </DialogDescription>
        </DialogHeader>
        <form
          id='service-charge-form'
          className='grid gap-4 sm:grid-cols-[1fr_120px]'
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitted(true)
            if (!nameOk || !rateOk) return
            try {
              await save.mutateAsync({
                id: service?.id,
                data: { name: name.trim(), rate: parseDecimal(rate) },
              })
              onOpenChange(false)
            } catch {
              // Toast shown by the mutation
            }
          }}
        >
          <div className='grid content-start gap-2'>
            <Label htmlFor='service-name'>{copy('Nama', 'Name')}</Label>
            <Input
              id='service-name'
              value={name}
              autoComplete='off'
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={submitted && !nameOk}
            />
            {submitted && !nameOk && (
              <p className='text-status-danger text-[13px]'>
                {copy('Nama wajib diisi.', 'Name is required.')}
              </p>
            )}
          </div>
          <div className='grid content-start gap-2'>
            <Label htmlFor='service-rate'>
              {copy('Tarif (%)', 'Rate (%)')}
            </Label>
            <Input
              id='service-rate'
              inputMode='decimal'
              className='tabular-nums'
              value={rate}
              onChange={(e) =>
                setRate(
                  e.target.value
                    .replace(/[^\d.,]/g, '')
                    .replace(/([.,]\d{0,2}).*$/, '$1')
                )
              }
              aria-invalid={submitted && !rateOk}
            />
            {submitted && !rateOk && (
              <p className='text-status-danger text-[13px]'>
                {copy('Antara 0 dan 100.', 'Between 0 and 100.')}
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          <Button
            type='submit'
            form='service-charge-form'
            disabled={save.isPending}
          >
            {save.isPending
              ? copy('Menyimpan…', 'Saving…')
              : copy('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
