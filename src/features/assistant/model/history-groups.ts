import { differenceInCalendarDays } from 'date-fns'
import type { ConversationSummary } from '../api/assistant.types'

export type HistoryBucket = 'today' | 'yesterday' | 'week' | 'month' | 'older'

/** Conversations by when they were last active, newest bucket first (input is newest first). */
export function groupConversations(
  conversations: ConversationSummary[],
  now: number
): { bucket: HistoryBucket; conversations: ConversationSummary[] }[] {
  const groups: {
    bucket: HistoryBucket
    conversations: ConversationSummary[]
  }[] = []
  for (const conversation of conversations) {
    const days = differenceInCalendarDays(
      now,
      new Date(conversation.updated_at)
    )
    const bucket: HistoryBucket =
      days <= 0
        ? 'today'
        : days === 1
          ? 'yesterday'
          : days <= 7
            ? 'week'
            : days <= 30
              ? 'month'
              : 'older'
    const last = groups[groups.length - 1]
    if (last?.bucket === bucket) last.conversations.push(conversation)
    else groups.push({ bucket, conversations: [conversation] })
  }
  return groups
}
