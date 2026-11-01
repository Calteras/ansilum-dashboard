import { useCallback, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Clock, Gift } from '@/components/icons'
import { TurnstileChallenge } from '@/features/auth/components/turnstile-challenge'
import { useLoyaltyDates } from '@/features/loyalty/hooks'
import type { TrialOffer as Offer, TrialView } from '../api/trial.api'
import {
  useActivateTrialMutation,
  useTrialEligibilityQuery,
  useTrialReviewMutation,
  useTrialUsageQuery,
} from '../api/trial.queries'
import { daysLeft, tierName, trialErrorMessage } from '../lib/trial'
import { PhoneVerificationDialog } from './phone-verification-dialog'

const challengeConfigured = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

/**
 * The free trial on the billing page: what it includes, the one action the
 * account can take now, and what happens next. Every decision is the server's.
 */
export function TrialOffer() {
  const copy = useCopy()
  const query = useTrialEligibilityQuery()
  const view = query.data
  if (!view) return null
  switch (view.state) {
    case 'ELIGIBLE':
    case 'REVIEW_REQUIRED':
      return <Activate view={view} />
    case 'VERIFICATION_REQUIRED':
      return <StepUp view={view} />
    case 'UNDER_REVIEW':
      return (
        <Panel
          icon={<Clock className='text-fg-muted size-5' />}
          title={copy(
            'Permintaan uji coba sedang ditinjau',
            'Your trial request is being reviewed'
          )}
        >
          {copy(
            'Tim kami memeriksa permintaan Anda, biasanya dalam 1 hari kerja. Kami kabari lewat email. Semua fitur paket Anda tetap bisa dipakai.',
            'Our team is checking your request, usually within one business day. We will email you. Everything in your current plan keeps working.'
          )}
        </Panel>
      )
    case 'ALREADY_CLAIMED':
      return <AlreadyClaimed view={view} />
    case 'NOT_ELIGIBLE':
      return (
        <Panel
          title={copy(
            'Uji coba tidak tersedia untuk akun ini',
            'A trial is not available for this account'
          )}
        >
          {copy(
            'Anda tetap bisa memakai paket Basic atau berlangganan kapan saja.',
            'You can keep using Basic or subscribe at any time.'
          )}
        </Panel>
      )
    case 'ACTIVE':
      return <Running view={view} />
    case 'ENDED':
      return <Ended view={view} />
    default:
      // UNAVAILABLE, EXISTING_CUSTOMER, BUSINESS_REQUIRED, EMAIL_VERIFICATION_REQUIRED
      return null
  }
}

function Panel({
  title,
  icon,
  tone = 'neutral',
  children,
  footer,
}: {
  title: string
  icon?: ReactNode
  tone?: 'accent' | 'neutral'
  children?: ReactNode
  footer?: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-lg border p-4 sm:p-5',
        tone === 'accent'
          ? 'border-primary/30 bg-primary/5'
          : 'bg-card shadow-surface'
      )}
    >
      <div className='flex gap-3'>
        {icon && <div className='mt-0.5 shrink-0'>{icon}</div>}
        <div className='min-w-0 flex-1 space-y-2'>
          <h4 className='font-medium'>{title}</h4>
          {children && (
            <div className='text-fg-secondary text-sm'>{children}</div>
          )}
          {footer}
        </div>
      </div>
    </section>
  )
}

function Includes({ offer }: { offer: Offer }) {
  const copy = useCopy()
  const items = [
    copy(
      `Semua fitur paket ${tierName(offer.tier)}: analitik, stok dan bahan baku, HPP, reservasi, meja`,
      `Everything in ${tierName(offer.tier)}: analytics, stock and ingredients, COGS, reservations, tables`
    ),
    ...(offer.aiUnits > 0
      ? [
          copy(
            `${offer.aiUnits} unit Tanya Ansilum`,
            `${offer.aiUnits} Ask Ansilum units`
          ),
        ]
      : []),
    copy(
      `${offer.maxOutlets} gerai selama uji coba, tanpa kartu`,
      `${offer.maxOutlets} outlet during the trial, no card needed`
    ),
  ]
  return (
    <ul className='space-y-1'>
      {items.map((item) => (
        <li key={item} className='flex gap-2'>
          <CheckCircle2 className='text-status-success mt-0.5 size-4 shrink-0' />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Activate({ view }: { view: TrialView }) {
  const copy = useCopy()
  const activate = useActivateTrialMutation()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // One key per attempt: a retried click after a timeout is the same request.
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [challengeRound, setChallengeRound] = useState(0)
  const onToken = useCallback((value: string | null) => setToken(value), [])
  const offer = view.offer!
  const needsReview = view.state === 'REVIEW_REQUIRED'

  const start = async () => {
    setError(null)
    try {
      await activate.mutateAsync({
        idempotencyKey: key,
        challengeToken: token ?? undefined,
      })
      setKey(crypto.randomUUID())
    } catch (e) {
      setError(trialErrorMessage(e, copy))
      // A token is single-use: any answer from the server spends it.
      setToken(null)
      setChallengeRound((n) => n + 1)
      setKey(crypto.randomUUID())
    }
  }

  return (
    <Panel
      tone='accent'
      icon={<Gift className='text-primary size-5' />}
      title={copy(
        `Coba paket ${tierName(offer.tier)} gratis ${offer.durationDays} hari`,
        `Try ${tierName(offer.tier)} free for ${offer.durationDays} days`
      )}
      footer={
        <div className='space-y-3 pt-1'>
          {challengeConfigured && (
            <TurnstileChallenge
              key={challengeRound}
              onToken={onToken}
              action='trial_activate'
            />
          )}
          {error && (
            <p role='alert' className='text-status-danger text-[13px]'>
              {error}
            </p>
          )}
          <Button
            onClick={() => void start()}
            disabled={activate.isPending || (challengeConfigured && !token)}
          >
            {activate.isPending
              ? copy('Memproses…', 'Starting…')
              : needsReview
                ? copy('Ajukan uji coba', 'Request the trial')
                : copy('Mulai uji coba', 'Start the trial')}
          </Button>
        </div>
      }
    >
      <div className='space-y-3'>
        <Includes offer={offer} />
        <p className='text-fg-muted text-[13px]'>
          {needsReview
            ? copy(
                'Permintaan ini akan ditinjau tim kami sebelum uji coba dimulai.',
                'Our team reviews this request before the trial starts.'
              )
            : copy(
                'Satu uji coba untuk setiap usaha. Setelah selesai, akun kembali ke paket Anda tanpa tagihan, dan semua data tetap tersimpan.',
                'One trial per business. Afterwards the account returns to its plan with no charge, and all data is kept.'
              )}
        </p>
      </div>
    </Panel>
  )
}

function StepUp({ view }: { view: TrialView }) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const offer = view.offer!
  return (
    <Panel
      tone='accent'
      icon={<Gift className='text-primary size-5' />}
      title={copy(
        `Satu langkah lagi untuk uji coba ${tierName(offer.tier)}`,
        `One more step to start your ${tierName(offer.tier)} trial`
      )}
      footer={
        <>
          <Button onClick={() => setOpen(true)}>
            {copy('Verifikasi nomor HP', 'Verify mobile number')}
          </Button>
          <PhoneVerificationDialog
            open={open}
            onOpenChange={setOpen}
            onVerified={() => undefined}
          />
        </>
      }
    >
      {copy(
        'Verifikasi nomor HP Anda agar kami bisa memastikan uji coba dipakai sekali per usaha. Setelah itu Anda bisa langsung memulai.',
        'Verify your mobile number so we can keep the trial to one per business. You can start right after.'
      )}
    </Panel>
  )
}

function AlreadyClaimed({ view }: { view: TrialView }) {
  const copy = useCopy()
  const review = useTrialReviewMutation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Panel
      title={copy(
        'Uji coba sudah pernah dipakai untuk usaha ini',
        'This business has already used its trial'
      )}
      footer={
        view.canRequestReview && (
          <>
            <Button variant='outline' onClick={() => setOpen(true)}>
              {copy('Ini usaha yang berbeda', 'This is a different business')}
            </Button>
            <Dialog
              open={open}
              onOpenChange={(next) => !review.isPending && setOpen(next)}
            >
              <DialogContent className='sm:max-w-md'>
                <DialogHeader className='text-start'>
                  <DialogTitle>
                    {copy('Ajukan peninjauan', 'Ask for a review')}
                  </DialogTitle>
                  <DialogDescription>
                    {copy(
                      'Ceritakan singkat usaha Anda, misalnya nama dan lokasinya. Tim kami akan memeriksa dan mengabari lewat email.',
                      'Tell us briefly about your business, such as its name and location. We will check and reply by email.'
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-2'>
                  <Label htmlFor='review-message'>
                    {copy('Keterangan', 'Details')}
                  </Label>
                  <Textarea
                    id='review-message'
                    rows={4}
                    maxLength={1000}
                    className='resize-none'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {error && (
                    <p role='alert' className='text-status-danger text-[13px]'>
                      {error}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setOpen(false)}
                    disabled={review.isPending}
                  >
                    {copy('Batal', 'Cancel')}
                  </Button>
                  <Button
                    disabled={review.isPending || message.trim().length < 10}
                    onClick={async () => {
                      setError(null)
                      try {
                        await review.mutateAsync(message.trim())
                        setOpen(false)
                      } catch (e) {
                        setError(trialErrorMessage(e, copy))
                      }
                    }}
                  >
                    {review.isPending
                      ? copy('Mengirim…', 'Sending…')
                      : copy('Kirim', 'Send')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )
      }
    >
      {copy(
        'Setiap usaha mendapat satu uji coba. Anda tetap bisa berlangganan paket di bawah kapan saja.',
        'Each business gets one trial. You can still subscribe to a plan below at any time.'
      )}
    </Panel>
  )
}

function Running({ view }: { view: TrialView }) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const usage = useTrialUsageQuery(true).data
  const trial = view.trial!
  const left = daysLeft(trial.expiresAt)
  return (
    <Panel
      tone='accent'
      icon={<Gift className='text-primary size-5' />}
      title={copy(
        `Uji coba ${tierName(trial.tier)} aktif · sisa ${left} hari`,
        `${tierName(trial.tier)} trial active · ${left} ${left === 1 ? 'day' : 'days'} left`
      )}
    >
      <div className='space-y-2'>
        <p>
          {copy(
            `Berakhir ${dates.dateTime(trial.expiresAt)}. Pilih paket di bawah agar fitur tetap aktif; tanpa paket, akun kembali ke Basic tanpa tagihan.`,
            `Ends ${dates.dateTime(trial.expiresAt)}. Choose a plan below to keep these features; otherwise the account returns to Basic with no charge.`
          )}
        </p>
        {usage?.active && usage.aiUnits && usage.aiUnits.granted > 0 && (
          <p className='text-fg-muted text-[13px] tabular-nums'>
            {usage.aiUnits.exhausted
              ? copy(
                  'Unit Tanya Ansilum dari uji coba sudah habis.',
                  'The trial’s Ask Ansilum units are used up.'
                )
              : copy(
                  `Unit Tanya Ansilum uji coba: ${usage.aiUnits.remaining} dari ${usage.aiUnits.granted}`,
                  `Trial Ask Ansilum units: ${usage.aiUnits.remaining} of ${usage.aiUnits.granted}`
                )}
          </p>
        )}
      </div>
    </Panel>
  )
}

function Ended({ view }: { view: TrialView }) {
  const copy = useCopy()
  const dates = useLoyaltyDates()
  const trial = view.trial!
  // A paid plan replaced it: nothing to say on the billing page.
  if (trial.status === 'CONSUMED') return null
  return (
    <Panel title={copy('Uji coba selesai', 'Trial ended')}>
      {trial.status === 'REVOKED'
        ? copy('Uji coba telah dihentikan.', 'The trial was stopped.')
        : copy(
            `Uji coba berakhir ${dates.date(trial.expiresAt)}. Data Anda tetap tersimpan; pilih paket untuk memakai fitur ${tierName(trial.tier)} lagi.`,
            `The trial ended on ${dates.date(trial.expiresAt)}. Your data is kept; choose a plan to use ${tierName(trial.tier)} features again.`
          )}
    </Panel>
  )
}
