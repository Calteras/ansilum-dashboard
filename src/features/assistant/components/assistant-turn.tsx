import type { A2uiSurfaces } from '../a2ui/use-a2ui-surfaces'
import type { ChatTurn } from '../model/chat-reducer'
import { AssistantMessage } from './assistant-message'
import { UserMessage } from './user-message'

/** One question and its answer. */
export function AssistantTurn({
  turn,
  getSurface,
  onRetry,
}: {
  turn: ChatTurn
  getSurface: A2uiSurfaces['getSurface']
  onRetry?: () => void
}) {
  return (
    <div className='space-y-6'>
      <UserMessage turn={turn} />
      <AssistantMessage turn={turn} getSurface={getSurface} onRetry={onRetry} />
    </div>
  )
}
