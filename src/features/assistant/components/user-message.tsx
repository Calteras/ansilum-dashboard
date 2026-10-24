import { useCopy } from '@/hooks/use-copy'
import { Sparkles } from '@/components/icons'
import type { ChatTurn } from '../model/chat-reducer'
import { CopyButton } from './message-actions'

export function UserMessage({ turn }: { turn: ChatTurn }) {
  const copy = useCopy()
  return (
    <div className='group aa-rise flex flex-col items-end gap-1'>
      {turn.mode === 'DEEP_ANALYSIS' && (
        <span className='text-fg-muted inline-flex items-center gap-1 px-2 text-xs font-medium'>
          <Sparkles className='size-3.5' aria-hidden />
          {copy('Analisis Mendalam', 'Deep Analysis')}
        </span>
      )}
      <p className='bg-muted max-w-[85%] rounded-3xl px-5 py-2.5 text-[15px] leading-7 break-words whitespace-pre-wrap'>
        <span className='sr-only'>{copy('Anda: ', 'You: ')}</span>
        {turn.question}
      </p>
      <div className='opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
        <CopyButton
          text={turn.question}
          label={copy('Salin pertanyaan', 'Copy question')}
        />
      </div>
    </div>
  )
}
