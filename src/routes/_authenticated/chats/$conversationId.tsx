import { createFileRoute } from '@tanstack/react-router'
import { Assistant } from '@/features/assistant'

export const Route = createFileRoute('/_authenticated/chats/$conversationId')({
  component: AssistantConversation,
})

function AssistantConversation() {
  const { conversationId } = Route.useParams()
  return <Assistant conversationId={conversationId} />
}
