import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import * as api from '../api/assistant.api'
import type { AssistantEvent, ConversationView } from '../api/assistant.types'
import {
  DETACHED_POLL_MS,
  resetAssistant,
  useAssistantStore,
} from './assistant-store'

vi.mock('../api/assistant.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/assistant.api')>()),
  streamAssistantAnswer: vi.fn(),
  cancelRunApi: vi.fn(),
  getConversationApi: vi.fn(),
}))

/** A stream the test drives: push events, then end it. */
function controllableStream() {
  let push: (event: AssistantEvent) => void = () => {}
  let end: () => void = () => {}
  let signal: AbortSignal | undefined
  const requests: unknown[] = []
  vi.mocked(api.streamAssistantAnswer).mockImplementation(
    (request, options) => {
      requests.push(request)
      push = options.onEvent
      signal = options.signal
      return new Promise<void>((resolve) => {
        end = resolve
        options.signal?.addEventListener('abort', () => resolve())
      })
    }
  )
  return {
    requests,
    push: (event: AssistantEvent) => act(() => push(event)),
    end: () => act(async () => end()),
    aborted: () => signal?.aborted ?? false,
  }
}

const started = (overrides: Partial<Record<string, string>> = {}) =>
  ({
    type: 'run.started',
    run_id: 'r-1',
    conversation_id: 'c-1',
    user_message_id: 'u-1',
    request_id: 'q-1',
    ...overrides,
  }) as AssistantEvent

const completed = (text: string, messageId = 'm-1') =>
  ({
    type: 'run.completed',
    run_id: 'r-1',
    message_id: messageId,
    answer: {
      text,
      status: 'completed',
      citations: [],
      components: [],
      warnings: [],
    },
  }) as AssistantEvent

const store = () => useAssistantStore.getState()

/** A stand-in for any page that shows the conversation. */
function Answer() {
  const text = useAssistantStore((s) => s.chat.turns[0]?.text ?? '')
  return <p>{text}</p>
}

beforeEach(() => {
  vi.mocked(api.cancelRunApi).mockResolvedValue(undefined)
  resetAssistant()
})
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('assistant store', () => {
  it('keeps answering after the page that asked is gone', async () => {
    const stream = controllableStream()
    const page = render(<Answer />)
    const asking = store().ask('Omzet?', 'ASK')
    await stream.push(started())
    page.unmount() // the merchant opens another menu

    await stream.push({ type: 'text.delta', text: 'Omzet ' })
    await stream.push(completed('Omzet Rp581.000.'))
    await stream.end()
    await asking

    expect(stream.aborted()).toBe(false)
    render(<Answer />) // and comes back
    expect(screen.getByText('Omzet Rp581.000.')).toBeInTheDocument()
    expect(store().chat.conversationId).toBe('c-1')
  })

  it('continues the conversation from the last answer', async () => {
    const stream = controllableStream()
    const first = store().ask('Omzet?', 'ASK')
    await stream.push(started())
    await stream.push(completed('Rp581.000.', 'm-1'))
    await stream.end()
    await first

    const second = store().ask('Per outlet?', 'DEEP_ANALYSIS')
    await stream.end()
    await second
    expect(stream.requests[0]).toEqual({ message: 'Omzet?', mode: 'ASK' })
    expect(stream.requests[1]).toEqual({
      message: 'Per outlet?',
      mode: 'DEEP_ANALYSIS',
      conversationId: 'c-1',
      parentMessageId: 'm-1',
    })
  })

  it('stops on the server, and waits for the run id when it is not known yet', async () => {
    const stream = controllableStream()
    const asking = store().ask('Omzet?', 'ASK')
    store().stop()
    expect(store().chat.turns[0].status).toBe('cancelled')
    expect(api.cancelRunApi).not.toHaveBeenCalled()

    await stream.push(started())
    expect(api.cancelRunApi).toHaveBeenCalledWith('r-1')
    // The stream stays open for the confirmation and the released units.
    await stream.push({
      type: 'run.cancelled',
      run_id: 'r-1',
      message_id: 'm-1',
    })
    await stream.push({ type: 'usage', units_charged: 0, remaining_units: 50 })
    await stream.end()
    await asking
    expect(store().chat.turns[0]).toMatchObject({
      status: 'cancelled',
      messageId: 'm-1',
      unitsCharged: 0,
    })
    expect(store().chat.remainingUnits).toBe(50)
  })

  it('retries a failed first question as a new first question', async () => {
    const stream = controllableStream()
    const first = store().ask('Omzet?', 'ASK')
    await stream.push(started())
    await stream.push({
      type: 'run.failed',
      run_id: 'r-1',
      message_id: 'm-1',
      code: 'model_overloaded',
      message: 'Busy',
      retryable: true,
    })
    await stream.end()
    await first

    store().retry(store().chat.turns[0].id)
    await stream.end()
    expect(stream.requests[1]).toEqual({
      message: 'Omzet?',
      mode: 'ASK',
      conversationId: 'c-1',
      parentMessageId: null,
    })
    expect(store().chat.turns).toHaveLength(1)
  })

  it('opens a conversation whose answer is still running and follows it to the end', async () => {
    vi.useFakeTimers()
    const running: ConversationView = {
      id: 'c-7',
      title: 'Omzet?',
      created_at: '2026-10-24T10:00:00Z',
      updated_at: '2026-10-24T10:00:00Z',
      truncated: false,
      messages: [
        {
          id: 'u-7',
          parent_message_id: null,
          role: 'user',
          status: 'completed',
          content: 'Omzet?',
          answer: null,
          created_at: '2026-10-24T10:00:00Z',
          mode: 'ASK',
          latency_ms: null,
          tools: [],
          billing_units: 1,
        },
      ],
      active_run: {
        run_id: 'r-7',
        user_message_id: 'u-7',
        mode: 'ASK',
        started_at: '2026-10-24T10:00:00Z',
      },
    }
    const done: ConversationView = {
      ...running,
      active_run: null,
      messages: [
        ...running.messages,
        {
          id: 'a-7',
          parent_message_id: 'u-7',
          role: 'assistant',
          status: 'completed',
          content: 'Rp581.000.',
          answer: {
            text: 'Rp581.000.',
            status: 'completed',
            citations: [],
            components: [],
            warnings: [],
          },
          created_at: '2026-10-24T10:00:09Z',
          mode: 'ASK',
          latency_ms: 9_000,
          tools: [],
          billing_units: 1,
        },
      ],
    }
    vi.mocked(api.getConversationApi)
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(done)

    await act(() => store().open('c-7'))
    expect(store().chat.turns[0]).toMatchObject({
      status: 'streaming',
      detached: true,
    })

    await act(() => vi.advanceTimersByTimeAsync(DETACHED_POLL_MS))
    expect(store().chat.turns[0].status).toBe('streaming')
    await act(() => vi.advanceTimersByTimeAsync(DETACHED_POLL_MS))
    expect(store().chat.turns[0]).toMatchObject({
      status: 'completed',
      text: 'Rp581.000.',
      detached: false,
    })
    expect(api.getConversationApi).toHaveBeenCalledTimes(3)
  })

  it('starts over in another business without stopping the running answer', async () => {
    const stream = controllableStream()
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'user-1' } as never,
      activeTenant: { id: 'tenant-a' } as never,
    })
    void store().ask('Omzet?', 'ASK')
    await stream.push(started())

    act(() =>
      useAuthStore.setState({ activeTenant: { id: 'tenant-b' } as never })
    )

    expect(store().chat.turns).toEqual([])
    // Only this tab stops listening; the answer finishes in the first business.
    expect(stream.aborted()).toBe(true)
    expect(api.cancelRunApi).not.toHaveBeenCalled()
  })
})
