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
import { Switch } from '@/components/ui/switch'
import { Copy, Loader2, Plus, X } from '@/components/icons'
import {
  copyDayToAll,
  DAY_ORDER,
  defaultSpan,
  hoursProblem,
  toIntervals,
  toWeek,
  type HoursProblem,
  type WeekHours,
} from '../street-food.logic'
import type { HoursInterval } from '../street-food.types'

const MAX_SPANS = 3

/**
 * The weekly opening hours, one row per day. Mistakes the server would refuse are shown next
 * to the day before saving. Closing after midnight is allowed (open 18:00, close 02:00).
 */
export function HoursDialog({
  open,
  outletName,
  hours,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean
  outletName: string
  hours: HoursInterval[]
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (intervals: HoursInterval[]) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        {/* Remounts with the saved hours each time it opens, so a cancelled draft is dropped. */}
        {open && (
          <Editor
            outletName={outletName}
            hours={hours}
            saving={saving}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Editor({
  outletName,
  hours,
  saving,
  onCancel,
  onSave,
}: {
  outletName: string
  hours: HoursInterval[]
  saving: boolean
  onCancel: () => void
  onSave: (intervals: HoursInterval[]) => void
}) {
  const copy = useCopy()
  const [week, setWeek] = useState<WeekHours>(() => toWeek(hours))
  const names = copy(
    'Min,Sen,Sel,Rab,Kam,Jum,Sab',
    'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
  ).split(',')
  const long = copy(
    'Minggu,Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
    'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'
  ).split(',')
  const problem = hoursProblem(week)

  const message: Record<HoursProblem, string> = {
    TIME: copy('Isi jam dengan benar.', 'Enter valid times.'),
    SAME: copy(
      'Jam buka dan tutup tidak boleh sama.',
      'Opening and closing times cannot be the same.'
    ),
    DUPLICATE: copy(
      'Dua jadwal memulai di jam yang sama.',
      'Two spans start at the same time.'
    ),
    EMPTY_DAY: copy(
      'Tambahkan jam, atau matikan hari ini.',
      'Add hours, or switch this day off.'
    ),
  }

  const update = (day: number, next: Partial<WeekHours[number]>) =>
    setWeek((current) => ({ ...current, [day]: { ...current[day], ...next } }))

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {copy('Jam buka', 'Opening hours')} · {outletName}
        </DialogTitle>
        <DialogDescription>
          {copy(
            'Dipakai saat status pesanan Otomatis. Tutup lewat tengah malam? Isi mis. buka 18:00, tutup 02:00.',
            'Used when order status is Auto. Open past midnight? Enter e.g. open 18:00, close 02:00.'
          )}
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() =>
            setWeek(
              copyDayToAll(
                { ...week, 1: { open: true, spans: [defaultSpan()] } },
                1
              )
            )
          }
        >
          {copy('Sama setiap hari 08:00–17:00', 'Same every day 08:00–17:00')}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setWeek(copyDayToAll(week, 1))}
        >
          <Copy size={14} />
          {copy('Salin Senin ke semua hari', 'Copy Monday to every day')}
        </Button>
      </div>

      <ul className='divide-y rounded-md border'>
        {DAY_ORDER.map((day) => {
          const row = week[day]
          const bad = problem?.day === day ? problem.problem : null
          return (
            <li
              key={day}
              className='flex flex-wrap items-start gap-x-4 gap-y-2 px-3 py-2.5'
            >
              <label className='flex w-28 shrink-0 items-center gap-2 pt-1.5 text-sm font-medium'>
                <Switch
                  checked={row.open}
                  onCheckedChange={(open) =>
                    update(day, {
                      open,
                      spans:
                        open && row.spans.length === 0
                          ? [defaultSpan()]
                          : row.spans,
                    })
                  }
                  aria-label={copy(`${long[day]} buka`, `${long[day]} open`)}
                />
                {names[day]}
              </label>

              {row.open ? (
                <div className='min-w-0 flex-1 space-y-2'>
                  {row.spans.map((span, index) => (
                    <div
                      key={index}
                      className='flex flex-wrap items-center gap-2'
                    >
                      <Input
                        type='time'
                        className='w-32'
                        value={span.opensAt}
                        aria-label={copy(
                          `${long[day]} buka`,
                          `${long[day]} opens`
                        )}
                        onChange={(event) =>
                          update(day, {
                            spans: row.spans.map((s, i) =>
                              i === index
                                ? { ...s, opensAt: event.target.value }
                                : s
                            ),
                          })
                        }
                      />
                      <span aria-hidden>–</span>
                      <Input
                        type='time'
                        className='w-32'
                        value={span.closesAt}
                        aria-label={copy(
                          `${long[day]} tutup`,
                          `${long[day]} closes`
                        )}
                        onChange={(event) =>
                          update(day, {
                            spans: row.spans.map((s, i) =>
                              i === index
                                ? { ...s, closesAt: event.target.value }
                                : s
                            ),
                          })
                        }
                      />
                      {row.spans.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          aria-label={copy('Hapus jadwal', 'Remove span')}
                          onClick={() =>
                            update(day, {
                              spans: row.spans.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {row.spans.length < MAX_SPANS && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='-ms-2'
                      onClick={() =>
                        update(day, {
                          spans: [
                            ...row.spans,
                            { opensAt: '13:00', closesAt: '17:00' },
                          ],
                        })
                      }
                    >
                      <Plus size={14} />
                      {copy(
                        'Tambah jam (mis. istirahat siang)',
                        'Add hours (e.g. a lunch break)'
                      )}
                    </Button>
                  )}
                  {bad && (
                    <p role='alert' className='text-destructive text-[13px]'>
                      {message[bad]}
                    </p>
                  )}
                </div>
              ) : (
                <span className='text-fg-muted pt-1.5 text-sm'>
                  {copy('Tutup', 'Closed')}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={saving}
        >
          {copy('Batal', 'Cancel')}
        </Button>
        <Button
          type='button'
          disabled={saving || problem !== null}
          onClick={() => onSave(toIntervals(week))}
        >
          {saving && <Loader2 className='animate-spin' size={16} />}
          {copy('Simpan jam buka', 'Save hours')}
        </Button>
      </DialogFooter>
    </>
  )
}
