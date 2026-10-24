import { ThinkingOrb } from 'thinking-orbs'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sparkles } from '@/components/icons'
import {
  useAssistantAccess,
  useOnAssistantPage,
} from '../hooks/use-assistant-access'
import { selectStreaming, useAssistantStore } from '../store/assistant-store'

const SHORTCUT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘J'
    : 'Ctrl+J'

/** Header button for the Ask Ansilum panel; shows the orb while an answer runs. */
export function AssistantLauncher() {
  const copy = useCopy()
  const allowed = useAssistantAccess()
  const onAssistantPage = useOnAssistantPage()
  const open = useAssistantStore((s) => s.panelOpen)
  const streaming = useAssistantStore(selectStreaming)
  if (!allowed || onAssistantPage) return null
  const label = copy('Tanya Ansilum', 'Ask Ansilum')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={label}
          aria-pressed={open}
          aria-keyshortcuts={SHORTCUT === '⌘J' ? 'Meta+J' : 'Control+J'}
          onClick={() => useAssistantStore.getState().setPanelOpen(!open)}
          className='rounded-lg'
        >
          {streaming ? (
            <ThinkingOrb state='working' size={20} aria-hidden='true' />
          ) : (
            <Sparkles className='size-5' aria-hidden />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>
        {label} · {SHORTCUT}
      </TooltipContent>
    </Tooltip>
  )
}
