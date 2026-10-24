import { useState } from 'react'
import { A2uiSurface, type ReactCatalogComponent } from '@a2ui/react/v0_9'
import type { SurfaceModel } from '@a2ui/web_core/v0_9'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  X,
} from '@/components/icons'
import { useSmoothText } from '../hooks/use-smooth-text'
import {
  turnPhase,
  type ChatTurn,
  type ToolStep,
  type TurnPhase,
} from '../model/chat-reducer'
import { TOOL_LABELS } from '../model/tool-labels'
import { AgentOrb } from './agent-orb'
import { AnswerCards } from './answer-cards'
import { AnswerText } from './answer-text'
import { ActionButton, CopyButton } from './message-actions'

function useErrorText() {
  const copy = useCopy()
  return (code: string | null, fallback: string) => {
    switch (code) {
      case 'ai_units_exhausted':
        return copy(
          'Unit AI untuk periode ini sudah habis. Unit akan diisi ulang pada awal bulan.',
          'No AI units are left for this period. They refill at the start of the month.'
        )
      case 'deep_analysis_not_in_plan':
        return copy(
          'Analisis Mendalam tidak termasuk dalam paket Anda.',
          'Deep Analysis is not included in your plan.'
        )
      case 'ai_not_configured':
      case 'ai_unavailable':
      case 'model_not_configured':
        return copy(
          'Asisten sedang tidak tersedia. Silakan coba lagi nanti.',
          'The assistant is unavailable right now. Please try again later.'
        )
      case 'run_in_progress':
        return copy(
          'Jawaban sebelumnya masih diproses.',
          'The previous answer is still being prepared.'
        )
      case 'network_error':
        return copy(
          'Koneksi terputus. Periksa jaringan Anda dan coba lagi.',
          'The connection was lost. Check your network and try again.'
        )
      default:
        return fallback
    }
  }
}

const WARNING_COPY: Record<string, [string, string]> = {
  answer_truncated: [
    'Jawaban terpotong karena terlalu panjang.',
    'The answer was cut short because it was too long.',
  ],
  model_call_limit_reached: [
    'Pertanyaan ini butuh lebih banyak langkah dari batas. Coba pertanyaan yang lebih spesifik.',
    'This question needed more steps than allowed. Try a narrower question.',
  ],
  context_limit_reached: [
    'Datanya terlalu besar untuk satu pertanyaan. Coba satu periode atau satu outlet.',
    'The data was too large for one question. Try one period or one outlet.',
  ],
}

function ToolChips({ steps }: { steps: ToolStep[] }) {
  const copy = useCopy()
  return (
    <ul
      className='flex flex-wrap gap-1.5 pt-2'
      aria-label={copy('Data yang diperiksa', 'Data checked')}
    >
      {steps.map((step) => {
        const label = TOOL_LABELS[step.tool]
        return (
          <li
            key={step.callId}
            className='border-divider text-fg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs'
          >
            {step.status === 'failed' ? (
              <X className='text-brand-ink size-3.5' aria-hidden />
            ) : (
              <Check className='text-leaf size-3.5' aria-hidden />
            )}
            {label ? copy(label[0], label[1]) : step.tool}
          </li>
        )
      })}
    </ul>
  )
}

/** The orb and what the agent is doing, while the answer is on its way. */
function LiveStatus({
  turn,
  phase,
}: {
  turn: ChatTurn
  phase: TurnPhase | null
}) {
  const copy = useCopy()
  const live = phase !== null
  const [mounted, setMounted] = useState(live)
  const shown = phase ?? 'composing'
  const running = [...turn.tools]
    .reverse()
    .find((step) => step.status === 'running')
  const tool = running && TOOL_LABELS[running.tool]
  const label = turn.detached
    ? copy(
        'Masih menjawab. Anda boleh meninggalkan halaman ini.',
        'Still answering. You can leave this page.'
      )
    : shown === 'working'
      ? tool
        ? copy(tool[2], tool[3])
        : copy('Memeriksa data…', 'Checking the data…')
      : shown === 'composing'
        ? copy('Menulis jawaban…', 'Writing the answer…')
        : copy('Berpikir…', 'Thinking…')
  if (!mounted) return null
  return (
    <div
      className='aa-collapse'
      data-open={live}
      onTransitionEnd={(event) => {
        if (!live && event.target === event.currentTarget) setMounted(false)
      }}
    >
      <div aria-hidden={!live}>
        <div className='flex items-center gap-3'>
          <AgentOrb state={shown} paused={!live} className='-ms-2 shrink-0' />
          <span role='status' className='text-sm font-medium'>
            <span key={label} className='aa-status-text inline-block'>
              {label}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** After the answer: how long it took and which data it read. */
function ThoughtSummary({ turn }: { turn: ChatTurn }) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const count = turn.tools.length
  const seconds =
    turn.thoughtMs === null
      ? null
      : Math.max(1, Math.round(turn.thoughtMs / 1000))
  const parts = [
    seconds !== null &&
      copy(`Berpikir selama ${seconds} detik`, `Thought for ${seconds}s`),
    count > 0 &&
      copy(
        `${count} data diperiksa`,
        `${count} data source${count === 1 ? '' : 's'} checked`
      ),
  ].filter(Boolean)
  if (!parts.length) return null
  const text = parts.join(' · ')
  if (!count) return <p className='text-fg-muted aa-fade text-sm'>{text}</p>
  return (
    <div className='aa-fade'>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='text-fg-muted hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded-md px-1 text-sm transition-colors outline-none focus-visible:ring-2'
      >
        {text}
        <ChevronRight
          className={cn('size-4 transition-transform', open && 'rotate-90')}
          aria-hidden
        />
      </button>
      <div className='aa-collapse' data-open={open}>
        <div aria-hidden={!open}>
          <ToolChips steps={turn.tools} />
        </div>
      </div>
    </div>
  )
}

function Sources({ turn }: { turn: ChatTurn }) {
  const copy = useCopy()
  if (!turn.citations.length) return null
  return (
    <section className='space-y-2' aria-label={copy('Sumber', 'Sources')}>
      <h3 className='text-fg-muted text-xs font-semibold'>
        {copy('Sumber', 'Sources')}
      </h3>
      <ul className='flex flex-wrap gap-1.5 text-sm'>
        {turn.citations.map((citation) => {
          const body = (
            <>
              <span className='bg-brand-soft text-brand-ink rounded px-1 text-[11px] font-semibold'>
                {citation.source_id}
              </span>
              <span className='max-w-64 truncate'>{citation.title}</span>
              {citation.section && (
                <span className='text-fg-muted max-w-40 truncate text-xs'>
                  · {citation.section}
                </span>
              )}
            </>
          )
          const chip =
            'border-divider inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1'
          return (
            <li key={citation.source_id}>
              {citation.canonical_uri?.startsWith('http') ? (
                <a
                  href={citation.canonical_uri}
                  target='_blank'
                  rel='noreferrer'
                  className={cn(
                    chip,
                    'hover:bg-surface-hover transition-colors'
                  )}
                >
                  {body}
                  <ExternalLink
                    className='text-fg-muted size-3.5'
                    aria-hidden
                  />
                </a>
              ) : (
                <span className={chip}>{body}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Notice({ turn }: { turn: ChatTurn }) {
  const copy = useCopy()
  const errorText = useErrorText()
  const warnings = turn.warnings.filter((w) => w in WARNING_COPY)
  if (turn.status === 'cancelled' && !turn.error && !warnings.length)
    return (
      <p className='text-fg-muted text-sm'>
        {copy(
          'Jawaban dihentikan. Unit tidak dipotong.',
          'Stopped. No units were charged.'
        )}
      </p>
    )
  if (!turn.error && !warnings.length) return null
  return (
    <div
      role={turn.error ? 'alert' : undefined}
      className={cn(
        'aa-fade flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm',
        turn.error
          ? 'border-brand/30 bg-brand-soft/40 text-brand-ink'
          : 'border-divider text-fg-muted'
      )}
    >
      <AlertTriangle className='mt-0.5 size-4 shrink-0' aria-hidden />
      <div className='space-y-1'>
        {turn.error && <p>{errorText(turn.error.code, turn.error.message)}</p>}
        {warnings.map((w) => (
          <p key={w}>{copy(WARNING_COPY[w][0], WARNING_COPY[w][1])}</p>
        ))}
      </div>
    </div>
  )
}

interface AssistantMessageProps {
  turn: ChatTurn
  getSurface: (
    surfaceId: string
  ) => SurfaceModel<ReactCatalogComponent> | undefined
  /** Offered on the last answer when it failed, stopped or hit a limit. */
  onRetry?: () => void
}

export function AssistantMessage({
  turn,
  getSurface,
  onRetry,
}: AssistantMessageProps) {
  const copy = useCopy()
  const phase = turnPhase(turn)
  const streaming = phase !== null
  const text = useSmoothText(turn.text, streaming)
  // A2UI surfaces when every card arrived as one; else the plain cards.
  const surfaces = turn.surfaceIds.map(getSurface)
  const renderable = surfaces.filter((surface) => surface !== undefined)
  const useSurfaces =
    renderable.length > 0 &&
    renderable.length === surfaces.length &&
    renderable.length >= turn.components.length

  return (
    <article
      className='space-y-4'
      aria-busy={streaming}
      aria-label={copy('Jawaban Ansilum', 'Ansilum’s answer')}
    >
      <LiveStatus turn={turn} phase={phase} />
      {!streaming && <ThoughtSummary turn={turn} />}

      {text && <AnswerText text={text} caret={streaming} />}

      {useSurfaces ? (
        <div className='space-y-4'>
          {renderable.map((surface) => (
            <div key={surface.id} className='aa-rise'>
              <A2uiSurface surface={surface} />
            </div>
          ))}
        </div>
      ) : (
        <AnswerCards components={turn.components} />
      )}

      <Sources turn={turn} />
      <Notice turn={turn} />

      {!streaming && (
        <div className='text-fg-muted -ms-2 flex items-center gap-0.5'>
          {turn.text && (
            <CopyButton
              text={turn.text}
              label={copy('Salin jawaban', 'Copy answer')}
            />
          )}
          {onRetry && (
            <ActionButton
              label={copy('Coba lagi', 'Try again')}
              onClick={onRetry}
            >
              <RotateCcw aria-hidden />
            </ActionButton>
          )}
          {turn.unitsCharged !== null && turn.unitsCharged > 0 && (
            <span className='ps-2 text-xs tabular-nums'>
              {copy(
                `${turn.unitsCharged} unit AI`,
                `${turn.unitsCharged} AI unit${turn.unitsCharged === 1 ? '' : 's'}`
              )}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
