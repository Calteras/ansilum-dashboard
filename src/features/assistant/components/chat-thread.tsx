import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ArrowDown } from '@/components/icons'
import { useAssistantUsageQuery } from '../api/assistant.queries'
import type { AssistantMode } from '../api/assistant.types'
import '../assistant.css'
import { useStickToBottom } from '../hooks/use-stick-to-bottom'
import type { TurnStatus } from '../model/chat-reducer'
import {
  getSurface,
  selectStreaming,
  useAssistantStore,
} from '../store/assistant-store'
import { AgentOrb } from './agent-orb'
import { AssistantTurn } from './assistant-turn'
import { Composer } from './composer'

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

const PAGE_SUGGESTIONS: [string, string][] = [
  ['Jelaskan angka di halaman ini.', 'Explain the figures on this page.'],
  [
    'Apa yang perlu saya perhatikan di sini?',
    'What should I pay attention to here?',
  ],
]

const RETRYABLE: TurnStatus[] = ['failed', 'cancelled', 'limit_reached']

/**
 * One Ask Ansilum conversation: the messages and the composer. The full page and
 * the side panel show the same conversation from the assistant store, so it keeps
 * running whichever menu is open.
 */
export function ChatThread({ variant }: { variant: 'page' | 'panel' }) {
  const copy = useCopy()
  const panel = variant === 'panel'
  const { data: balance } = useAssistantUsageQuery()
  const chat = useAssistantStore((s) => s.chat)
  const opening = useAssistantStore((s) => s.opening)
  const streaming = useAssistantStore(selectStreaming)
  const draft = useAssistantStore((s) => s.draft)
  const deepAnalysis = useAssistantStore((s) => s.deepAnalysis)
  const pageContext = useAssistantStore((s) => (panel ? s.pageContext : null))
  const attach = useAssistantStore((s) => s.attachPageContext)
  const actions = useAssistantStore(
    useShallow((s) => ({
      ask: s.ask,
      stop: s.stop,
      retry: s.retry,
      open: s.open,
      newChat: s.newChat,
      setDraft: s.setDraft,
      setDeepAnalysis: s.setDeepAnalysis,
      setAttachPageContext: s.setAttachPageContext,
    }))
  )
  const { scrollRef, contentRef, atEnd, scrollToEnd } = useStickToBottom<
    HTMLDivElement,
    HTMLDivElement
  >()
  const empty = chat.turns.length === 0 && !opening
  const lastId = chat.turns[chat.turns.length - 1]?.id
  const withPage = pageContext && attach ? pageContext : null

  const submit = (question: string, mode: AssistantMode) => {
    actions.setDraft('')
    scrollToEnd('auto')
    void actions.ask(
      question,
      mode,
      withPage
        ? { uiContext: withPage.context, outletId: withPage.outletId }
        : undefined
    )
  }
  const pick = (question: string) => {
    actions.setDraft(question)
    document.getElementById('assistant-question')?.focus()
  }

  const composer = (
    <Composer
      value={draft}
      onChange={actions.setDraft}
      onSubmit={submit}
      onStop={actions.stop}
      streaming={streaming}
      units={balance?.units_per_request ?? null}
      deepAnalysisAvailable={balance?.deep_analysis_available ?? false}
      deepAnalysis={deepAnalysis}
      onDeepAnalysisChange={actions.setDeepAnalysis}
      pageContext={
        pageContext
          ? {
              label: pageContext.label,
              attached: attach,
              onAttachedChange: actions.setAttachPageContext,
            }
          : undefined
      }
      autoFocus
    />
  )
  const suggestions = (pageContext ? PAGE_SUGGESTIONS : SUGGESTIONS).map(
    ([id, en]) => copy(id, en)
  )

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto'>
        <div
          ref={contentRef}
          className={cn(
            'mx-auto flex min-h-full w-full flex-col',
            panel ? 'px-4' : 'max-w-3xl px-4 sm:px-6'
          )}
        >
          {opening ? (
            <Opening
              error={opening.error}
              onRetry={() => void actions.open(opening.conversationId)}
              onNewChat={actions.newChat}
            />
          ) : empty ? (
            <section
              aria-labelledby={`assistant-greeting-${variant}`}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-6',
                panel ? 'py-8' : 'pt-6 pb-[14vh]'
              )}
            >
              <AgentOrb state='breathing' />
              <h2
                id={`assistant-greeting-${variant}`}
                className={cn(
                  'text-center font-semibold tracking-tight',
                  panel ? 'text-lg' : 'text-2xl sm:text-[28px]'
                )}
              >
                {copy(
                  'Ada yang bisa saya bantu hari ini?',
                  'What can I help you with today?'
                )}
              </h2>
              {!panel && <div className='w-full'>{composer}</div>}
              <ul
                className='flex flex-wrap justify-center gap-2'
                aria-label={copy('Coba tanyakan', 'Try asking')}
              >
                {suggestions.map((question) => (
                  <li key={question}>
                    <button
                      type='button'
                      onClick={() => pick(question)}
                      className='border-divider text-fg-muted hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring/50 rounded-full border px-4 py-2 text-sm transition-colors outline-none focus-visible:ring-2'
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className={cn('space-y-10 pt-4', panel ? 'pb-6' : 'pb-10')}>
              {chat.turns.map((turn) => (
                <AssistantTurn
                  key={turn.id}
                  turn={turn}
                  getSurface={getSurface}
                  onRetry={
                    turn.id === lastId && RETRYABLE.includes(turn.status)
                      ? () => actions.retry(turn.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(!empty || panel) && !opening && (
        <div
          className={cn(
            'relative shrink-0 pb-3',
            panel ? 'px-3' : 'px-4 sm:px-6'
          )}
        >
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
          <div className={cn('mx-auto w-full', !panel && 'max-w-3xl')}>
            {composer}
            <p className='text-fg-muted mt-2 text-center text-xs'>
              {panel
                ? copy(
                    'Jawaban tetap berjalan saat Anda berpindah menu.',
                    'Answers keep running while you switch menus.'
                  )
                : copy(
                    'Angka berasal dari data usaha Anda. Asisten hanya membaca data, tidak mengubahnya.',
                    'Figures come from your business data. The assistant only reads data and never changes it.'
                  )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Opening({
  error,
  onRetry,
  onNewChat,
}: {
  error: string | null
  onRetry: () => void
  onNewChat: () => void
}) {
  const copy = useCopy()
  if (!error)
    return (
      <div
        className='space-y-10 pt-6'
        role='status'
        aria-label={copy('Membuka percakapan', 'Opening the conversation')}
      >
        {[0, 1].map((row) => (
          <div key={row} className='space-y-4'>
            <Skeleton className='ms-auto h-10 w-2/5 rounded-3xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-11/12' />
              <Skeleton className='h-4 w-4/5' />
              <Skeleton className='h-4 w-3/5' />
            </div>
          </div>
        ))}
      </div>
    )
  return (
    <div
      role='alert'
      className='flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center'
    >
      <AlertTriangle className='text-fg-muted size-6' aria-hidden />
      <p className='text-sm'>
        {error === 'not_found'
          ? copy(
              'Percakapan ini sudah tidak ada.',
              'This conversation no longer exists.'
            )
          : copy(
              'Percakapan ini tidak dapat dibuka.',
              'This conversation could not be opened.'
            )}
      </p>
      <div className='flex gap-2'>
        {error !== 'not_found' && (
          <Button variant='outline' size='sm' onClick={onRetry}>
            {copy('Coba lagi', 'Try again')}
          </Button>
        )}
        <Button size='sm' onClick={onNewChat}>
          {copy('Percakapan baru', 'New conversation')}
        </Button>
      </div>
    </div>
  )
}
