import { describe, expect, it } from 'vitest'
import type { AssistantEvent } from '../api/assistant.types'
import {
  chatReducer,
  initialChatState,
  turnPhase,
  type ChatState,
} from './chat-reducer'

const ask = (state: ChatState = initialChatState) =>
  chatReducer(state, {
    type: 'ask',
    id: 't1',
    question: 'Omzet?',
    mode: 'ASK',
    at: 1_000,
  })
const apply = (state: ChatState, ...events: AssistantEvent[]) =>
  events.reduce(
    (s, event) => chatReducer(s, { type: 'event', id: 't1', event, at: 1_000 }),
    state
  )
const applyAt = (state: ChatState, at: number, event: AssistantEvent) =>
  chatReducer(state, { type: 'event', id: 't1', event, at })

const surface = (surfaceId: string) => ({ surface_id: surfaceId, messages: [] })

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

  it("collects A2UI surfaces once, then takes the final answer's list", () => {
    let state = apply(
      ask(),
      { type: 'ui.a2ui', surface: surface('a2ui-r-1') },
      { type: 'ui.a2ui', surface: surface('a2ui-r-1') },
      { type: 'ui.a2ui', surface: surface('a2ui-r-2') }
    )
    expect(state.turns[0].surfaceIds).toEqual(['a2ui-r-1', 'a2ui-r-2'])
    state = apply(state, {
      type: 'run.completed',
      run_id: 'r',
      message_id: 'm',
      answer: {
        text: 'Done.',
        status: 'completed',
        citations: [],
        components: [],
        a2ui: [surface('a2ui-r-1')],
        warnings: [],
      },
    })
    expect(state.turns[0].surfaceIds).toEqual(['a2ui-r-1'])
  })

  it('times the thinking up to the first words of the answer', () => {
    let state = applyAt(ask(), 2_500, {
      type: 'tool.started',
      tool: 'get_sales_summary',
      call_id: 'k1',
    })
    expect(state.turns[0].thoughtMs).toBeNull()
    state = applyAt(state, 4_200, { type: 'text.delta', text: 'Pen' })
    state = applyAt(state, 4_900, { type: 'text.delta', text: 'jualan' })
    expect(state.turns[0].thoughtMs).toBe(3_200)
  })

  it('follows the agent: thinking, then working on a tool, then writing', () => {
    let state = ask()
    expect(turnPhase(state.turns[0])).toBe('breathing')
    state = apply(state, {
      type: 'tool.started',
      tool: 'get_sales_summary',
      call_id: 'k1',
    })
    expect(turnPhase(state.turns[0])).toBe('working')
    state = apply(state, {
      type: 'tool.completed',
      tool: 'get_sales_summary',
      call_id: 'k1',
      ok: true,
      duration_ms: 4,
    })
    expect(turnPhase(state.turns[0])).toBe('breathing')
    state = apply(state, { type: 'text.delta', text: 'Penjualan' })
    expect(turnPhase(state.turns[0])).toBe('composing')
    state = chatReducer(state, { type: 'cancelled', id: 't1' })
    expect(turnPhase(state.turns[0])).toBeNull()
  })

  it('removes a turn so it can be asked again', () => {
    const state = chatReducer(ask(), { type: 'remove', id: 't1' })
    expect(state.turns).toEqual([])
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
