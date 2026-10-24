import type { ComponentProps } from 'react'
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
  getSurface: ComponentProps<typeof AssistantMessage>['getSurface']
  onRetry?: () => void
}) {
  return (
    <div className='space-y-6'>
      <UserMessage turn={turn} />
      <AssistantMessage turn={turn} getSurface={getSurface} onRetry={onRetry} />
    </div>
  )
}
