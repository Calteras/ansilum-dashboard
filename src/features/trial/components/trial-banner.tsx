import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Gift, X } from '@/components/icons'
import { useTrialEligibilityQuery } from '../api/trial.queries'
import { daysLeft, tierName } from '../lib/trial'

const dismissedKey = (code: string, kind: string) =>
  `ansilum.trial-banner.${code}.${kind}`

function isDismissed(key: string) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/**
 * A one-line pointer to the trial on the dashboard: the offer while it can be
 * started, and a reminder in its last three days. The flow itself lives on
 * the billing page.
 */
export function TrialBanner() {
  const copy = useCopy()
  const { data: view } = useTrialEligibilityQuery()
  const [hidden, setHidden] = useState<string | null>(null)
  if (!view?.offer) return null

  const offer = view.offer
  const canStart = [
    'ELIGIBLE',
    'VERIFICATION_REQUIRED',
    'REVIEW_REQUIRED',
  ].includes(view.state)
  const ending =
    view.state === 'ACTIVE' && view.trial && daysLeft(view.trial.expiresAt) <= 3
  if (!canStart && !ending) return null
  const key = dismissedKey(offer.code, canStart ? 'offer' : 'ending')
  if (hidden === key || isDismissed(key)) return null

  const text = canStart
    ? copy(
        `Coba semua fitur ${tierName(offer.tier)} gratis ${offer.durationDays} hari, tanpa kartu.`,
        `Try every ${tierName(offer.tier)} feature free for ${offer.durationDays} days, no card needed.`
      )
    : copy(
        `Uji coba ${tierName(offer.tier)} berakhir dalam ${daysLeft(view.trial!.expiresAt)} hari. Pilih paket agar fitur tetap aktif.`,
        `Your ${tierName(offer.tier)} trial ends in ${daysLeft(view.trial!.expiresAt)} days. Choose a plan to keep its features.`
      )

  return (
    <div className='border-primary/30 bg-primary/5 mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm'>
      <Gift className='text-primary size-4 shrink-0' aria-hidden />
      <p className='min-w-0 flex-1'>{text}</p>
      <Button size='sm' asChild>
        <Link to='/settings/subscription'>
          {canStart
            ? copy('Lihat penawaran', 'See the offer')
            : copy('Pilih paket', 'Choose a plan')}
        </Link>
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='size-8'
        aria-label={copy('Tutup', 'Dismiss')}
        onClick={() => {
          try {
            localStorage.setItem(key, '1')
          } catch {
            // Hidden for this visit only.
          }
          setHidden(key)
        }}
      >
        <X className='size-4' />
      </Button>
    </div>
  )
}
