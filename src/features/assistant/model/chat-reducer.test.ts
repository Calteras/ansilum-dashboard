import { describe, expect, it } from 'vitest'
import type { AssistantEvent } from '../api/assistant.types'
import { chatReducer, initialChatState, type ChatState } from './chat-reducer'

const ask = (state: ChatState = initialChatState) =>
  chatReducer(state, { type: 'ask', id: 't1', question: 'Omzet?', mode: 'ASK' })
const apply = (state: ChatState, ...events: AssistantEvent[]) =>
  events.reduce(
    (s, event) => chatReducer(s, { type: 'event', id: 't1', event }),
    state
  )

const metricGroup = {
  type: 'metric_group' as const,
  title: 'Sales summary',
  metrics: [
    {
      key: 'sales',
      label: 'Net sales',
      value: 581000,
      unit: 'currency' as const,
    },
  ],
  source_tool: 'get_sales_for_range',
}

describe('chatReducer', () => {
  it('streams a turn and settles it with the validated answer and its units', () => {
    const state = apply(
      ask(),
      {
        type: 'run.started',
        run_id: 'r',
        conversation_id: 'c-1',
        user_message_id: 'u',
        request_id: 'q',
      },
      { type: 'tool.started', tool: 'get_sales_for_range', call_id: 'k1' },
      { type: 'text.delta', text: 'Draft [S9]' },
      {
        type: 'tool.completed',
        tool: 'get_sales_for_range',
        call_id: 'k1',
        ok: true,
        duration_ms: 5,
      },
      { type: 'ui.component', component: metricGroup },
      { type: 'ui.component', component: metricGroup },
      {
        type: 'run.completed',
        run_id: 'r',
        message_id: 'm',
        answer: {
          text: 'Penjualan Rp581.000.',
          status: 'completed',
          citations: [],
          components: [
            { type: 'text', text: 'Penjualan Rp581.000.' },
            metricGroup,
          ],
          warnings: [],
        },
      },
      { type: 'usage', units_charged: 1, remaining_units: 299 }
    )
    const [turn] = state.turns
    expect(state.conversationId).toBe('c-1')
    expect(state.remainingUnits).toBe(299)
    expect(turn.status).toBe('completed')
    expect(turn.text).toBe('Penjualan Rp581.000.') // the draft is replaced
    expect(turn.components).toEqual([metricGroup]) // text blocks dropped, no duplicates
    expect(turn.tools).toEqual([
      { callId: 'k1', tool: 'get_sales_for_range', status: 'done' },
    ])
    expect(turn.unitsCharged).toBe(1)
  })

  it('keeps a limit answer distinct from a completed one', () => {
    const state = apply(ask(), {
      type: 'run.completed',
      run_id: 'r',
      message_id: 'm',
      answer: {
        text: 'Too broad.',
        status: 'limit_reached',
        citations: [],
        components: [],
        warnings: ['model_call_limit_reached'],
      },
    })
    expect(state.turns[0].status).toBe('limit_reached')
    expect(state.turns[0].warnings).toEqual(['model_call_limit_reached'])
  })

  it('records a refused request with its code and the balance it reported', () => {
    const state = chatReducer(ask(), {
      type: 'error',
      id: 't1',
      code: 'ai_units_exhausted',
      message: 'No AI units are left for this period.',
      remainingUnits: 0,
    })
    expect(state.turns[0]).toMatchObject({
      status: 'failed',
      error: { code: 'ai_units_exhausted' },
      unitsCharged: 0,
    })
    expect(state.remainingUnits).toBe(0)
  })

  it('marks a failed run and a stopped stream', () => {
    const failed = apply(ask(), {
      type: 'run.failed',
      run_id: 'r',
      code: 'model_overloaded',
      message: 'Unavailable',
      retryable: true,
    })
    expect(failed.turns[0]).toMatchObject({
      status: 'failed',
      error: { code: 'model_overloaded' },
    })

    const stopped = chatReducer(
      apply(ask(), { type: 'text.delta', text: 'Part' }),
      {
        type: 'cancelled',
        id: 't1',
      }
    )
    expect(stopped.turns[0]).toMatchObject({
      status: 'cancelled',
      text: 'Part',
    })
    // A settled turn is never turned into a cancelled one.
    expect(
      chatReducer(failed, { type: 'cancelled', id: 't1' }).turns[0].status
    ).toBe('failed')
  })

  it('starts a new conversation but keeps the last known balance', () => {
    const state = apply(ask(), {
      type: 'usage',
      units_charged: 1,
      remaining_units: 12,
    })
    const reset = chatReducer(state, { type: 'reset' })
    expect(reset).toEqual({
      conversationId: null,
      turns: [],
      remainingUnits: 12,
    })
  })
})
