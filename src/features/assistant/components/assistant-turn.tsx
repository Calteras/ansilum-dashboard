import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  X,
} from '@/components/icons'
import type { ChatTurn, ToolStep } from '../model/chat-reducer'
import { AnswerCards } from './answer-cards'
import { AnswerText } from './answer-text'

const TOOL_LABELS: Record<string, [string, string]> = {
  get_sales_summary: ['Ringkasan penjualan', 'Sales summary'],
  get_sales_timeseries: ['Tren penjualan', 'Sales trend'],
  get_top_products: ['Produk terlaris', 'Top products'],
  get_payment_method_summary: ['Metode pembayaran', 'Payment methods'],
  get_sales_for_range: ['Penjualan periode', 'Sales for the period'],
  compare_outlets: ['Perbandingan outlet', 'Outlet comparison'],
  get_product_performance: ['Kinerja produk', 'Product performance'],
  get_inventory_summary: ['Ringkasan stok', 'Inventory summary'],
  get_low_stock_items: ['Stok menipis', 'Low stock'],
  search_ansilum_knowledge: ['Panduan Ansilum', 'Ansilum guides'],
}

function ToolSteps({ steps }: { steps: ToolStep[] }) {
  const copy = useCopy()
  if (!steps.length) return null
  return (
    <ul
      className='flex flex-wrap gap-2'
      aria-label={copy('Data yang diperiksa', 'Data checked')}
    >
      {steps.map((step) => {
        const label = TOOL_LABELS[step.tool]
        return (
          <li
            key={step.callId}
            className='border-divider bg-surface-subtle text-fg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs'
          >
            {step.status === 'running' ? (
              <Loader2 className='size-3.5 animate-spin' aria-hidden />
            ) : step.status === 'done' ? (
              <Check className='text-leaf size-3.5' aria-hidden />
            ) : (
              <X className='text-brand-ink size-3.5' aria-hidden />
            )}
            {label ? copy(label[0], label[1]) : step.tool}
          </li>
        )
      })}
    </ul>
  )
}

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

export function AssistantTurn({ turn }: { turn: ChatTurn }) {
  const copy = useCopy()
  const errorText = useErrorText()
  const streaming = turn.status === 'streaming'
  const warnings = turn.warnings.filter((w) => w in WARNING_COPY)

  return (
    <article className='space-y-6'>
      <div className='ms-auto max-w-[88%] space-y-2'>
        <p className='text-muted-foreground text-right text-xs font-semibold'>
          {copy('Anda', 'You')}
          {turn.mode === 'DEEP_ANALYSIS' &&
            ` · ${copy('Analisis Mendalam', 'Deep Analysis')}`}
        </p>
        <p className='bg-ink rounded-2xl rounded-tr-sm px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap text-white'>
          {turn.question}
        </p>
      </div>

      <div className='flex items-start gap-3'>
        <span
          aria-hidden='true'
          className='bg-brand-soft text-brand-ink flex size-7 shrink-0 items-center justify-center rounded-full text-lg font-semibold'
        >
          a
        </span>
        <div
          className='min-w-0 flex-1 space-y-4'
          aria-live='polite'
          aria-busy={streaming}
        >
          <p className='text-sm font-semibold'>Ansilum</p>
          <ToolSteps steps={turn.tools} />

          {turn.text ? (
            <AnswerText text={turn.text} />
          ) : streaming ? (
            <p className='text-fg-muted flex items-center gap-2 text-sm'>
              <Loader2 className='size-4 animate-spin' aria-hidden />
              {copy('Menyiapkan jawaban…', 'Preparing the answer…')}
            </p>
          ) : null}

          <AnswerCards components={turn.components} />

          {turn.citations.length > 0 && (
            <section
              className='space-y-1'
              aria-label={copy('Sumber', 'Sources')}
            >
              <h3 className='text-fg-muted text-xs font-semibold'>
                {copy('Sumber', 'Sources')}
              </h3>
              <ul className='space-y-1 text-sm'>
                {turn.citations.map((citation) => (
                  <li
                    key={citation.source_id}
                    className='flex items-center gap-2'
                  >
                    <span className='bg-brand-soft text-brand-ink rounded px-1 text-[11px] font-semibold'>
                      {citation.source_id}
                    </span>
                    {citation.canonical_uri?.startsWith('http') ? (
                      <a
                        href={citation.canonical_uri}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
                      >
                        {citation.title}
                        <ExternalLink className='size-3.5' aria-hidden />
                      </a>
                    ) : (
                      <span>{citation.title}</span>
                    )}
                    {citation.section && (
                      <span className='text-fg-muted text-xs'>
                        · {citation.section}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(turn.error ||
            warnings.length > 0 ||
            turn.status === 'cancelled') && (
            <div
              role={turn.error ? 'alert' : undefined}
              className={cn(
                'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                turn.error
                  ? 'border-brand/40 text-brand-ink'
                  : 'border-divider text-fg-muted'
              )}
            >
              <AlertTriangle className='mt-0.5 size-4 shrink-0' aria-hidden />
              <div className='space-y-1'>
                {turn.error && (
                  <p>{errorText(turn.error.code, turn.error.message)}</p>
                )}
                {warnings.map((w) => (
                  <p key={w}>{copy(WARNING_COPY[w][0], WARNING_COPY[w][1])}</p>
                ))}
                {turn.status === 'cancelled' && (
                  <p>
                    {copy(
                      'Jawaban dihentikan. Unit tidak dipotong.',
                      'Stopped. No units were charged.'
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {turn.unitsCharged !== null && turn.unitsCharged > 0 && (
            <p className='text-fg-muted text-xs'>
              {copy(
                `${turn.unitsCharged} unit AI digunakan`,
                `${turn.unitsCharged} AI unit${turn.unitsCharged === 1 ? '' : 's'} used`
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
