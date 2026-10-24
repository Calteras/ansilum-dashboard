import { ThinkingOrb } from 'thinking-orbs'
import { useCopy } from '@/hooks/use-copy'
import { useOnAssistantPage } from '../hooks/use-assistant-access'
import { selectStreaming, useAssistantStore } from '../store/assistant-store'

/** The sidebar's Ask Ansilum entry shows that an answer is running elsewhere. */
export function AssistantNavIndicator() {
  const copy = useCopy()
  const streaming = useAssistantStore(selectStreaming)
  const onAssistantPage = useOnAssistantPage()
  if (!streaming || onAssistantPage) return null
  return (
    <ThinkingOrb
      state='working'
      size={20}
      aria-label={copy('Sedang menjawab', 'Answering')}
      className='ms-auto shrink-0'
    />
  )
}
