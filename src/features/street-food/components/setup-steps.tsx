import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Check } from '@/components/icons'
import type { ConnectionState } from '../street-food.logic'

type StepState = 'done' | 'current' | 'todo'

/** Where the owner is in the three things that put an outlet in front of customers. */
export function SetupSteps({ state }: { state: ConnectionState }) {
  const copy = useCopy()
  const connected = state !== 'not_connected'
  const published = connected && state !== 'needs_outlet'
  const confirmed = state === 'connected' || state === 'delayed'

  const steps: { title: string; hint: string; state: StepState }[] = [
    {
      title: copy('Hubungkan usaha', 'Connect your business'),
      hint: copy('POS membuat kunci rahasia', 'Your POS makes a private key'),
      state: connected ? 'done' : 'current',
    },
    {
      title: copy('Pilih outlet', 'Choose outlets'),
      hint: copy('Yang tampil bagi pelanggan', 'What customers see'),
      state: published ? 'done' : connected ? 'current' : 'todo',
    },
    {
      title: copy('Platform menerima', 'Platform confirms'),
      hint: copy(
        'Operator mendaftarkan usaha Anda',
        'The operator registers your business'
      ),
      state: confirmed ? 'done' : published ? 'current' : 'todo',
    },
  ]

  return (
    <ol
      className='grid gap-2 sm:grid-cols-3'
      aria-label={copy('Langkah persiapan', 'Setup steps')}
    >
      {steps.map((step, index) => (
        <li
          key={step.title}
          aria-current={step.state === 'current' ? 'step' : undefined}
          className={cn(
            'bg-card flex items-start gap-3 rounded-lg border p-3',
            step.state === 'current' &&
              'border-primary/50 ring-primary/15 ring-2',
            step.state === 'todo' && 'opacity-60'
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
              step.state === 'done' &&
                'bg-status-success/10 text-status-success border-status-success/25',
              step.state === 'current' &&
                'bg-primary text-primary-foreground border-primary'
            )}
          >
            {step.state === 'done' ? (
              <Check size={14} aria-hidden />
            ) : (
              index + 1
            )}
          </span>
          <div className='min-w-0'>
            <p className='text-sm leading-5 font-medium'>{step.title}</p>
            <p className='text-fg-muted text-[13px] leading-5'>{step.hint}</p>
            <span className='sr-only'>
              {step.state === 'done'
                ? copy('Selesai', 'Done')
                : step.state === 'current'
                  ? copy('Langkah sekarang', 'Current step')
                  : copy('Belum', 'Not yet')}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
