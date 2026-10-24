import type {
  A2uiSurfaceMessages,
  ConversationView,
  MessageView,
} from '../api/assistant.types'
import { newTurn, type ChatTurn, type TurnStatus } from './chat-reducer'

/**
 * The branch on screen: from the newest message back to its first question.
 * Conversations are trees (a retry is a sibling); the newest leaf is the branch the
 * user last saw.
 */
export function activePath(messages: MessageView[]): MessageView[] {
  if (!messages.length) return []
  const byId = new Map(messages.map((message) => [message.id, message]))
  let current: MessageView | undefined = messages.reduce((newest, message) =>
    message.created_at >= newest.created_at ? message : newest
  )
  const path: MessageView[] = []
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.push(current)
    current = current.parent_message_id
      ? byId.get(current.parent_message_id)
      : undefined
  }
  return path.reverse()
}

function answered(
  question: MessageView,
  reply: MessageView
): Partial<ChatTurn> {
  const answer = reply.answer
  const status: TurnStatus = answer
    ? answer.status
    : reply.status === 'cancelled'
      ? 'cancelled'
      : 'failed'
  const failed = status === 'failed'
  return {
    status,
    // A stopped answer keeps the draft written so far; a failed one its message.
    text: failed ? '' : (answer?.text ?? reply.content),
    error: failed
      ? { code: null, message: answer?.text || reply.content }
      : null,
    components: (answer?.components ?? []).filter((c) => c.type !== 'text'),
    surfaceIds: (answer?.a2ui ?? []).map((surface) => surface.surface_id),
    citations: answer?.citations ?? [],
    warnings: answer?.warnings ?? [],
    tools: reply.tools.map((tool, index) => ({
      callId: `${reply.id}:${index}`,
      tool,
      status: 'done' as const,
    })),
    thoughtMs: reply.latency_ms,
    // Only a completed answer is charged.
    unitsCharged:
      status === 'completed'
        ? (reply.billing_units ?? question.billing_units)
        : 0,
    messageId: reply.id,
  }
}

/** A saved conversation as chat turns, with the A2UI surfaces its cards need. */
export function turnsFromConversation(view: ConversationView): {
  turns: ChatTurn[]
  surfaces: A2uiSurfaceMessages[]
} {
  const path = activePath(view.messages)
  const turns: ChatTurn[] = []
  const surfaces: A2uiSurfaceMessages[] = []
  path.forEach((message, index) => {
    if (message.role !== 'user') return
    const base = newTurn({
      id: message.id,
      question: message.content,
      mode: message.mode ?? 'ASK',
      startedAt: Date.parse(message.created_at),
      userMessageId: message.id,
      parentId: message.parent_message_id,
    })
    const reply = path[index + 1]
    if (reply?.role === 'assistant') {
      surfaces.push(...(reply.answer?.a2ui ?? []))
      turns.push({ ...base, ...answered(message, reply) })
    } else if (view.active_run?.user_message_id === message.id) {
      // Still answering on the server: shown live until the answer is saved.
      turns.push({
        ...base,
        status: 'streaming',
        detached: true,
        runId: view.active_run.run_id,
      })
    } else {
      // Interrupted before an answer was saved; never charged.
      turns.push({ ...base, status: 'cancelled', unitsCharged: 0 })
    }
  })
  return { turns, surfaces }
}
