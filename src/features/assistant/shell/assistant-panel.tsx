import { useNavigate } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Edit, Maximize2, X } from '@/components/icons'
import { ChatThread } from '../components/chat-thread'
import { useOnAssistantPage } from '../hooks/use-assistant-access'
import { useAssistantStore } from '../store/assistant-store'

function PanelButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={label}
          onClick={onClick}
          className='size-8 rounded-lg [&_svg]:size-4'
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Ask Ansilum beside any page: the same conversation as the full page, docked on
 * the right without covering the menu or blocking the page, so the merchant can
 * check other menus while an analysis runs.
 */
export function AssistantPanel() {
  const copy = useCopy()
  const navigate = useNavigate()
  const open = useAssistantStore((s) => s.panelOpen)
  const title = useAssistantStore((s) => s.chat.turns[0]?.question ?? null)
  const onAssistantPage = useOnAssistantPage()
  if (!open || onAssistantPage) return null

  const close = () => useAssistantStore.getState().setPanelOpen(false)
  const openFullPage = () => {
    const { chat } = useAssistantStore.getState()
    close()
    void (chat.conversationId
      ? navigate({
          to: '/chats/$conversationId',
          params: { conversationId: chat.conversationId },
        })
      : navigate({ to: '/chats' }))
  }

  return (
    <aside
      aria-label={copy('Tanya Ansilum', 'Ask Ansilum')}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) close()
      }}
      className='bg-background border-divider aa-panel fixed inset-y-0 end-0 z-40 flex w-full flex-col border-s shadow-2xl sm:w-[420px]'
    >
      <header className='border-divider flex h-14 shrink-0 items-center gap-1 border-b ps-4 pe-2'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-sm font-semibold'>
            {copy('Tanya Ansilum', 'Ask Ansilum')}
          </h2>
          {title && <p className='text-fg-muted truncate text-xs'>{title}</p>}
        </div>
        <PanelButton
          label={copy('Percakapan baru', 'New conversation')}
          onClick={() => useAssistantStore.getState().newChat()}
        >
          <Edit aria-hidden />
        </PanelButton>
        <PanelButton
          label={copy('Buka halaman penuh', 'Open the full page')}
          onClick={openFullPage}
        >
          <Maximize2 aria-hidden />
        </PanelButton>
        <PanelButton label={copy('Tutup', 'Close')} onClick={close}>
          <X aria-hidden />
        </PanelButton>
      </header>
      <ChatThread variant='panel' />
    </aside>
  )
}
