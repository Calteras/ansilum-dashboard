import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square } from '@/components/icons'
import type { AssistantMode } from '../api/assistant.types'

/** The backend refuses longer questions (AiQueryDto, MaxLength 8000). */
export const MAX_QUESTION_CHARS = 8000

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (question: string, mode: AssistantMode) => void
  onStop: () => void
  streaming: boolean
  units: Record<AssistantMode, number> | null
  deepAnalysisAvailable: boolean
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  units,
  deepAnalysisAvailable,
}: ComposerProps) {
  const copy = useCopy()
  const [mode, setMode] = useState<AssistantMode>('ASK')
  const effectiveMode = deepAnalysisAvailable ? mode : 'ASK'
  const tooLong = value.length > MAX_QUESTION_CHARS
  const canSend = !streaming && value.trim().length > 0 && !tooLong

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (canSend) onSubmit(value, effectiveMode)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }
  const cost = (m: AssistantMode) =>
    units
      ? ` · ${units[m]} ${copy('unit', units[m] === 1 ? 'unit' : 'units')}`
      : ''

  return (
    <form
      onSubmit={submit}
      className='border-divider bg-card space-y-3 rounded-lg border p-3'
    >
      <label htmlFor='assistant-question' className='sr-only'>
        {copy('Pertanyaan Anda', 'Your question')}
      </label>
      <Textarea
        id='assistant-question'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={copy(
          'Tanyakan penjualan, produk, outlet, atau stok…',
          'Ask about sales, products, outlets or stock…'
        )}
        className='max-h-48 min-h-14 resize-none border-0 px-1 shadow-none focus-visible:ring-0'
        aria-invalid={tooLong || undefined}
      />
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SegmentedControl<AssistantMode>
          aria-label={copy('Mode jawaban', 'Answer mode')}
          value={effectiveMode}
          onValueChange={setMode}
          options={[
            { value: 'ASK', label: copy('Tanya', 'Ask') + cost('ASK') },
            {
              value: 'DEEP_ANALYSIS',
              label:
                copy('Analisis Mendalam', 'Deep Analysis') +
                cost('DEEP_ANALYSIS'),
              disabled: !deepAnalysisAvailable,
            },
          ]}
        />
        <div className='flex items-center gap-3'>
          {tooLong && (
            <span className='text-brand-ink text-xs'>
              {copy('Pertanyaan terlalu panjang', 'Question is too long')}
            </span>
          )}
          {streaming ? (
            <Button type='button' variant='outline' onClick={onStop}>
              <Square className='size-4' aria-hidden />
              {copy('Hentikan', 'Stop')}
            </Button>
          ) : (
            <Button type='submit' disabled={!canSend}>
              <Send className='size-4' aria-hidden />
              {copy('Kirim', 'Send')}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
