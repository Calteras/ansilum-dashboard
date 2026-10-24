import { describe, expect, it } from 'vitest'
import type { ConversationView, MessageView } from '../api/assistant.types'
import { activePath, turnsFromConversation } from './history'
import { groupConversations } from './history-groups'

const message = (
  id: string,
  parent: string | null,
  role: 'user' | 'assistant',
  minute: number,
  extra: Partial<MessageView> = {}
): MessageView => ({
  id,
  parent_message_id: parent,
  role,
  status: 'completed',
  content: `${role} ${id}`,
  answer: null,
  created_at: `2026-10-24T10:${String(minute).padStart(2, '0')}:00Z`,
  mode: 'ASK',
  latency_ms: null,
  tools: [],
  billing_units: 1,
  ...extra,
})

const view = (
  messages: MessageView[],
  extra: Partial<ConversationView> = {}
): ConversationView => ({
  id: 'c-1',
  title: 'Omzet?',
  created_at: '2026-10-24T10:00:00Z',
  updated_at: '2026-10-24T10:30:00Z',
  messages,
  truncated: false,
  active_run: null,
  ...extra,
})

const answer = (
  text: string,
  status: 'completed' | 'limit_reached' = 'completed'
) => ({
  text,
  status,
  citations: [],
  components: [],
  warnings: [],
  a2ui: [
    {
      surface_id: `a2ui-${text}`,
      messages: [{ version: 'v0.9' }],
    },
  ],
})

describe('activePath', () => {
  it('follows the newest branch back to its first question', () => {
    // u1 → a1 (failed) and the retry u1b → a1b, a sibling root.
    const messages = [
      message('u1', null, 'user', 1),
      message('a1', 'u1', 'assistant', 2, { status: 'failed' }),
      message('u1b', null, 'user', 3),
      message('a1b', 'u1b', 'assistant', 4),
      message('u2', 'a1b', 'user', 5),
      message('a2', 'u2', 'assistant', 6),
    ]
    expect(activePath(messages).map((m) => m.id)).toEqual([
      'u1b',
      'a1b',
      'u2',
      'a2',
    ])
  })
})

describe('turnsFromConversation', () => {
  it('rebuilds answers with their cards, tools, timing and units', () => {
    const { turns, surfaces } = turnsFromConversation(
      view([
        message('u1', null, 'user', 1, {
          mode: 'DEEP_ANALYSIS',
          billing_units: 5,
        }),
        message('a1', 'u1', 'assistant', 2, {
          answer: answer('Omzet Rp581.000.'),
          tools: ['get_sales_summary'],
          latency_ms: 4_200,
          billing_units: 5,
        }),
      ])
    )
    expect(turns).toHaveLength(1)
    expect(turns[0]).toMatchObject({
      id: 'u1',
      question: 'user u1',
      mode: 'DEEP_ANALYSIS',
      status: 'completed',
      text: 'Omzet Rp581.000.',
      surfaceIds: ['a2ui-Omzet Rp581.000.'],
      tools: [{ tool: 'get_sales_summary', status: 'done' }],
      thoughtMs: 4_200,
      unitsCharged: 5,
      userMessageId: 'u1',
      messageId: 'a1',
      parentId: null,
    })
    expect(surfaces.map((s) => s.surface_id)).toEqual(['a2ui-Omzet Rp581.000.'])
  })

  it('keeps a stopped draft, a failure and an answer at a limit apart', () => {
    const { turns } = turnsFromConversation(
      view([
        message('u1', null, 'user', 1),
        message('a1', 'u1', 'assistant', 2, {
          status: 'cancelled',
          content: 'Penjualan hari ini ',
        }),
        message('u2', 'a1', 'user', 3),
        message('a2', 'u2', 'assistant', 4, {
          status: 'failed',
          content: 'The assistant took too long to respond.',
        }),
        message('u3', 'a2', 'user', 5),
        message('a3', 'u3', 'assistant', 6, {
          status: 'failed',
          answer: answer('Partial figures.', 'limit_reached'),
        }),
      ])
    )
    expect(turns.map((t) => [t.status, t.text, t.unitsCharged])).toEqual([
      ['cancelled', 'Penjualan hari ini ', 0],
      ['failed', '', 0],
      ['limit_reached', 'Partial figures.', 0],
    ])
    expect(turns[1].error?.message).toBe(
      'The assistant took too long to respond.'
    )
  })

  it('shows an answer still running on the server as live', () => {
    const { turns } = turnsFromConversation(
      view([message('u1', null, 'user', 1)], {
        active_run: {
          run_id: 'r-1',
          user_message_id: 'u1',
          mode: 'ASK',
          started_at: '2026-10-24T10:01:00Z',
        },
      })
    )
    expect(turns[0]).toMatchObject({
      status: 'streaming',
      detached: true,
      runId: 'r-1',
    })
  })

  it('treats a question left without an answer as interrupted', () => {
    const { turns } = turnsFromConversation(
      view([message('u1', null, 'user', 1)])
    )
    expect(turns[0]).toMatchObject({ status: 'cancelled', unitsCharged: 0 })
  })
})

describe('groupConversations', () => {
  it('groups by last activity, newest first', () => {
    const now = new Date(2026, 9, 24, 15, 0).getTime()
    const at = (month: number, day: number) => ({
      id: `c-${month}-${day}`,
      title: null,
      created_at: new Date(2026, month, day, 9).toISOString(),
      updated_at: new Date(2026, month, day, 9).toISOString(),
    })
    const groups = groupConversations(
      [at(9, 24), at(9, 23), at(9, 20), at(9, 2), at(8, 10)],
      now
    )
    expect(groups.map((g) => [g.bucket, g.conversations.length])).toEqual([
      ['today', 1],
      ['yesterday', 1],
      ['week', 1],
      ['month', 1],
      ['older', 1],
    ])
  })
})
