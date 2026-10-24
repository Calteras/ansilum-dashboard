import { useEffect, useRef, useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Plus } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useAssistantUsageQuery } from './api/assistant.queries'
import { AssistantTurn } from './components/assistant-turn'
import { Composer } from './components/composer'
import { UnitsBalance } from './components/units-balance'
import { useAssistantChat } from './hooks/use-assistant-chat'

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

/** Ask Ansilum: questions about the active business, answered from its own data. */
export function Assistant() {
  const copy = useCopy()
  const { data: balance } = useAssistantUsageQuery()
  const { state, isStreaming, ask, stop, reset } = useAssistantChat()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const lastTurn = state.turns[state.turns.length - 1]
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [state.turns.length, lastTurn?.text, lastTurn?.status])

  const submit = (question: string, mode: 'ASK' | 'DEEP_ANALYSIS') => {
    setDraft('')
    void ask(question, mode)
  }

  return (
    <>
      <AppHeader />
      <Main className='flex w-full flex-1 flex-col gap-6'>
        <PageHeader
          title={copy('Tanya Ansilum', 'Ask Ansilum')}
          description={copy(
            'Tanyakan penjualan dan stok usaha Anda dengan bahasa sehari-hari',
            'Ask about your business’s sales and stock in plain language'
          )}
          actions={
            <div className='flex items-center gap-2'>
              <UnitsBalance
                balance={balance}
                remainingOverride={state.remainingUnits}
              />
              {state.turns.length > 0 && (
                <Button variant='outline' size='sm' onClick={reset}>
                  <Plus className='size-4' aria-hidden />
                  {copy('Percakapan baru', 'New conversation')}
                </Button>
              )}
            </div>
          }
        />

        <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8'>
          {state.turns.length === 0 ? (
            <section
              aria-labelledby='assistant-suggestions'
              className='space-y-3'
            >
              <h2 id='assistant-suggestions' className='text-sm font-semibold'>
                {copy('Coba tanyakan', 'Try asking')}
              </h2>
              <div className='flex flex-wrap gap-2'>
                {SUGGESTIONS.map(([id, en]) => (
                  <Button
                    key={en}
                    variant='outline'
                    className='h-auto text-start text-sm whitespace-normal'
                    onClick={() => setDraft(copy(id, en))}
                  >
                    {copy(id, en)}
                  </Button>
                ))}
              </div>
            </section>
          ) : (
            <div className='space-y-10'>
              {state.turns.map((turn) => (
                <AssistantTurn key={turn.id} turn={turn} />
              ))}
            </div>
          )}
          <div ref={endRef} />

          <div className='bg-background sticky bottom-0 pb-4'>
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              onStop={stop}
              streaming={isStreaming}
              units={balance?.units_per_request ?? null}
              deepAnalysisAvailable={balance?.deep_analysis_available ?? false}
            />
            <p className='text-fg-muted mt-2 text-center text-xs'>
              {copy(
                'Angka berasal dari data usaha Anda. Asisten hanya membaca data, tidak mengubahnya.',
                'Figures come from your business data. The assistant only reads data and never changes it.'
              )}
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
