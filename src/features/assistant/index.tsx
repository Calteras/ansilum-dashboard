import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowDown, Edit } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useAssistantUsageQuery } from './api/assistant.queries'
import type { AssistantMode } from './api/assistant.types'
import './assistant.css'
import { AgentOrb } from './components/agent-orb'
import { AssistantTurn } from './components/assistant-turn'
import { Composer } from './components/composer'
import { UnitsBalance } from './components/units-balance'
import { useAssistantChat } from './hooks/use-assistant-chat'
import { useStickToBottom } from './hooks/use-stick-to-bottom'
import type { TurnStatus } from './model/chat-reducer'

const SUGGESTIONS: [string, string][] = [
  ['Berapa omzet hari ini?', 'How are sales today?'],
  [
    'Produk apa yang paling laku minggu ini?',
    'What were the best-selling products this week?',
  ],
  [
    'Bandingkan penjualan semua outlet bulan lalu.',
    'Compare sales across all outlets last month.',
  ],
  ['Bahan apa yang stoknya menipis?', 'Which ingredients are running low?'],
]

const RETRYABLE: TurnStatus[] = ['failed', 'cancelled', 'limit_reached']

/** Ask Ansilum: questions about the active business, answered from its own data. */
export function Assistant() {
  const copy = useCopy()
  const { data: balance } = useAssistantUsageQuery()
  const { state, isStreaming, ask, stop, retry, reset, getSurface } =
    useAssistantChat()
  const [draft, setDraft] = useState('')
  const { scrollRef, contentRef, atEnd, scrollToEnd } = useStickToBottom<
    HTMLDivElement,
    HTMLDivElement
  >()
  const empty = state.turns.length === 0
  const lastId = state.turns[state.turns.length - 1]?.id

  const submit = (question: string, mode: AssistantMode) => {
    setDraft('')
    scrollToEnd('auto')
    void ask(question, mode)
  }

  const composer = (
    <Composer
      value={draft}
      onChange={setDraft}
      onSubmit={submit}
      onStop={stop}
      streaming={isStreaming}
      units={balance?.units_per_request ?? null}
      deepAnalysisAvailable={balance?.deep_analysis_available ?? false}
      autoFocus
    />
  )

  return (
    <>
      <AppHeader />
      <Main fixed className='p-0 sm:p-0'>
        <div className='flex min-h-0 flex-1 flex-col'>
          <header className='flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6'>
            <h1 className='text-base font-semibold'>
              {copy('Tanya Ansilum', 'Ask Ansilum')}
            </h1>
            <div className='ms-auto flex items-center gap-1.5'>
              <UnitsBalance
                balance={balance}
                remainingOverride={state.remainingUnits}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={reset}
                    disabled={empty}
                    aria-label={copy('Percakapan baru', 'New conversation')}
                    className='rounded-lg'
                  >
                    <Edit className='size-5' aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  {copy('Percakapan baru', 'New conversation')}
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto'>
            <div
              ref={contentRef}
              className='mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6'
            >
              {empty ? (
                <section
                  aria-labelledby='assistant-greeting'
                  className='flex flex-1 flex-col items-center justify-center gap-6 pt-6 pb-[14vh]'
                >
                  <AgentOrb state='breathing' />
                  <h2
                    id='assistant-greeting'
                    className='text-center text-2xl font-semibold tracking-tight sm:text-[28px]'
                  >
                    {copy(
                      'Ada yang bisa saya bantu hari ini?',
                      'What can I help you with today?'
                    )}
                  </h2>
                  <div className='w-full'>{composer}</div>
                  <ul
                    className='flex flex-wrap justify-center gap-2'
                    aria-label={copy('Coba tanyakan', 'Try asking')}
                  >
                    {SUGGESTIONS.map(([id, en]) => (
                      <li key={en}>
                        <button
                          type='button'
                          onClick={() => {
                            setDraft(copy(id, en))
                            document
                              .getElementById('assistant-question')
                              ?.focus()
                          }}
                          className='border-divider text-fg-muted hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring/50 rounded-full border px-4 py-2 text-sm transition-colors outline-none focus-visible:ring-2'
                        >
                          {copy(id, en)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <div className='space-y-10 pt-4 pb-10'>
                  {state.turns.map((turn) => (
                    <AssistantTurn
                      key={turn.id}
                      turn={turn}
                      getSurface={getSurface}
                      onRetry={
                        turn.id === lastId && RETRYABLE.includes(turn.status)
                          ? () => retry(turn.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {!empty && (
            <div className='relative shrink-0 px-4 pb-3 sm:px-6'>
              {!atEnd && (
                <button
                  type='button'
                  onClick={() => scrollToEnd()}
                  aria-label={copy(
                    'Ke pesan terbaru',
                    'Jump to the latest message'
                  )}
                  className='bg-card border-divider text-fg-muted hover:text-foreground aa-fade absolute -top-12 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full border shadow-md transition-colors'
                >
                  <ArrowDown className='size-4' aria-hidden />
                </button>
              )}
              <div className='mx-auto w-full max-w-3xl'>
                {composer}
                <p className='text-fg-muted mt-2 text-center text-xs'>
                  {copy(
                    'Angka berasal dari data usaha Anda. Asisten hanya membaca data, tidak mengubahnya.',
                    'Figures come from your business data. The assistant only reads data and never changes it.'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
