import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, Sparkles, Square } from '@/components/icons'
import type { AssistantMode } from '../api/assistant.types'

/** The backend refuses longer questions (AiQueryDto, MaxLength 8000). */
export const MAX_QUESTION_CHARS = 8000

/** The question box grows with its text up to this height, then scrolls. */
const MAX_HEIGHT_PX = 208

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (question: string, mode: AssistantMode) => void
  onStop: () => void
  streaming: boolean
  units: Record<AssistantMode, number> | null
  deepAnalysisAvailable: boolean
  autoFocus?: boolean
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  units,
  deepAnalysisAvailable,
  autoFocus,
}: ComposerProps) {
  const copy = useCopy()
  const isMobile = useIsMobile()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [deep, setDeep] = useState(false)
  const mode: AssistantMode =
    deep && deepAnalysisAvailable ? 'DEEP_ANALYSIS' : 'ASK'
  const tooLong = value.length > MAX_QUESTION_CHARS
  const canSend = !streaming && value.trim().length > 0 && !tooLong

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [value])

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (canSend) onSubmit(value, mode)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape' && streaming) {
      event.preventDefault()
      onStop()
    }
    // On phones Enter is a new line; the send button sends.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !isMobile &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  const deepHint = !deepAnalysisAvailable
    ? copy('Tidak termasuk dalam paket Anda', 'Not included in your plan')
    : units
      ? copy(
          `Jawaban lebih teliti · ${units.DEEP_ANALYSIS} unit per pertanyaan`,
          `A more thorough answer · ${units.DEEP_ANALYSIS} units per question`
        )
      : copy('Jawaban lebih teliti', 'A more thorough answer')

  return (
    <form
      onSubmit={submit}
      onClick={(event) => {
        if (event.target === event.currentTarget) inputRef.current?.focus()
      }}
      className={cn(
        'bg-card border-divider rounded-[28px] border px-3 pt-3 pb-2.5 shadow-[0_4px_24px_-8px_rgb(15_23_42/0.12)] transition-[border-color,box-shadow]',
        'focus-within:border-divider-strong focus-within:shadow-[0_6px_28px_-8px_rgb(15_23_42/0.18)]',
        tooLong && 'border-brand/50'
      )}
    >
      <label htmlFor='assistant-question' className='sr-only'>
        {copy('Pertanyaan Anda', 'Your question')}
      </label>
      <textarea
        ref={inputRef}
        id='assistant-question'
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={copy(
          'Tanyakan penjualan, produk, outlet, atau stok',
          'Ask about sales, products, outlets or stock'
        )}
        aria-invalid={tooLong || undefined}
        className='placeholder:text-fg-muted block max-h-52 min-h-10 w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-6 outline-none'
      />
      <div className='mt-1 flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='inline-flex'>
              <button
                type='button'
                aria-pressed={mode === 'DEEP_ANALYSIS'}
                disabled={!deepAnalysisAvailable}
                onClick={() => setDeep((on) => !on)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors outline-none',
                  'focus-visible:ring-ring/50 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
                  mode === 'DEEP_ANALYSIS'
                    ? 'border-brand/40 bg-brand-soft text-brand-ink'
                    : 'border-divider text-fg-muted hover:bg-surface-hover hover:text-foreground'
                )}
              >
                <Sparkles className='size-4' aria-hidden />
                {copy('Analisis Mendalam', 'Deep Analysis')}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>{deepHint}</TooltipContent>
        </Tooltip>

        <div className='ms-auto flex items-center gap-3'>
          {tooLong && (
            <span className='text-brand-ink text-xs' role='status'>
              {copy('Pertanyaan terlalu panjang', 'Question is too long')}
            </span>
          )}
          {streaming ? (
            <Button
              type='button'
              size='icon'
              onClick={onStop}
              aria-label={copy('Hentikan jawaban', 'Stop answering')}
              className='aa-fade rounded-full'
            >
              <Square className='size-3.5 fill-current' aria-hidden />
            </Button>
          ) : (
            <Button
              type='submit'
              size='icon'
              disabled={!canSend}
              aria-label={copy('Kirim pertanyaan', 'Send question')}
              className='rounded-full transition-opacity disabled:opacity-30'
            >
              <ArrowUp className='size-5' aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
