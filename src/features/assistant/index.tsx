import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Clock, Edit } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useAssistantUsageQuery } from './api/assistant.queries'
import { ChatThread } from './components/chat-thread'
import { HistoryList } from './components/history-list'
import { UnitsBalance } from './components/units-balance'
import { useAssistantStore } from './store/assistant-store'

/**
 * Ask Ansilum: questions about the active business, answered from its own data.
 * The conversation lives in the assistant store, not in this page: leaving the
 * page (or opening another menu) never stops or forgets it.
 */
export function Assistant({ conversationId }: { conversationId?: string }) {
  const copy = useCopy()
  const navigate = useNavigate()
  const { data: balance } = useAssistantUsageQuery()
  const shownId = useAssistantStore((s) => s.chat.conversationId)
  const remainingUnits = useAssistantStore((s) => s.chat.remainingUnits)
  const hasTurns = useAssistantStore((s) => s.chat.turns.length > 0)
  const opening = useAssistantStore((s) => s.opening)
  const [historyOpen, setHistoryOpen] = useState(false)

  // The URL names the conversation: open it unless it is the one already shown.
  useEffect(() => {
    if (conversationId) void useAssistantStore.getState().open(conversationId)
  }, [conversationId])

  // And the shown conversation names the URL (a new chat gets its id on the first answer).
  useEffect(() => {
    const { chat, opening: pending } = useAssistantStore.getState()
    if (pending) return
    if (chat.conversationId && chat.conversationId !== conversationId)
      void navigate({
        to: '/chats/$conversationId',
        params: { conversationId: chat.conversationId },
        replace: true,
      })
    else if (!chat.conversationId && conversationId)
      void navigate({ to: '/chats', replace: true })
  }, [shownId, opening, conversationId, navigate])

  const newChat = () => {
    useAssistantStore.getState().newChat()
    void navigate({ to: '/chats' })
  }

  const history = (
    <HistoryList
      activeId={shownId ?? opening?.conversationId ?? null}
      onNavigate={() => setHistoryOpen(false)}
    />
  )

  return (
    <>
      <AppHeader />
      <Main fixed className='p-0 sm:p-0'>
        <div className='flex min-h-0 flex-1'>
          <aside
            className='border-divider hidden w-64 shrink-0 flex-col border-e md:flex'
            aria-label={copy('Riwayat', 'History')}
          >
            <div className='p-2'>
              <Button
                variant='ghost'
                className='w-full justify-start gap-2'
                onClick={newChat}
              >
                <Edit className='size-4' aria-hidden />
                {copy('Percakapan baru', 'New conversation')}
              </Button>
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-3'>
              {history}
            </div>
          </aside>

          <div className='flex min-w-0 flex-1 flex-col'>
            <header className='flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6'>
              <Button
                variant='ghost'
                size='icon'
                className='-ms-2 rounded-lg md:hidden'
                onClick={() => setHistoryOpen(true)}
                aria-label={copy('Riwayat percakapan', 'Conversation history')}
              >
                <Clock className='size-5' aria-hidden />
              </Button>
              <h1 className='text-base font-semibold'>
                {copy('Tanya Ansilum', 'Ask Ansilum')}
              </h1>
              <div className='ms-auto flex items-center gap-1.5'>
                <UnitsBalance
                  balance={balance}
                  remainingOverride={remainingUnits}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={newChat}
                      disabled={!hasTurns && !shownId}
                      aria-label={copy('Percakapan baru', 'New conversation')}
                      className='rounded-lg md:hidden'
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
            <ChatThread variant='page' />
          </div>
        </div>
      </Main>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side='left' className='w-72 p-0'>
          <SheetHeader className='border-divider border-b'>
            <SheetTitle>{copy('Riwayat', 'History')}</SheetTitle>
          </SheetHeader>
          <div className='p-2'>
            <Button
              variant='ghost'
              className='w-full justify-start gap-2'
              onClick={() => {
                setHistoryOpen(false)
                newChat()
              }}
            >
              <Edit className='size-4' aria-hidden />
              {copy('Percakapan baru', 'New conversation')}
            </Button>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto px-2 pb-3'>
            {history}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
