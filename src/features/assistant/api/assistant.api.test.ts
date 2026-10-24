import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { AssistantError, streamAssistantAnswer } from './assistant.api'
import type { AssistantEvent } from './assistant.types'

function sseResponse(body: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        // Split mid-event to exercise incremental parsing.
        const bytes = new TextEncoder().encode(body)
        controller.enqueue(bytes.slice(0, 20))
        controller.enqueue(bytes.slice(20))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )
}

describe('streamAssistantAnswer', () => {
  beforeEach(() => {
    useAuthStore.setState({ activeTenant: { id: 'tenant-1' } } as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('posts the question with the active tenant and yields typed events', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        sseResponse(
          'event: text.delta\ndata: {"type":"text.delta","text":"Halo"}\n\nevent: usage\ndata: {"units_charged":1,"remaining_units":49}\n\n'
        )
      )
    const events: AssistantEvent[] = []
    await streamAssistantAnswer(
      { message: 'Omzet?', mode: 'ASK' },
      { onEvent: (event) => events.push(event) }
    )
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/ai/query/stream')
    expect(init?.credentials).toBe('include')
    expect((init?.headers as Record<string, string>)['x-tenant-id']).toBe(
      'tenant-1'
    )
    expect(JSON.parse(init?.body as string)).toEqual({
      message: 'Omzet?',
      mode: 'ASK',
    })
    expect(events).toEqual([
      { type: 'text.delta', text: 'Halo' },
      { type: 'usage', units_charged: 1, remaining_units: 49 },
    ])
  })

  it('turns a refusal into an AssistantError with its code and balance', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 402,
          message: 'No AI units are left for this period.',
          code: 'ai_units_exhausted',
          data: { remaining_units: 0 },
        }),
        { status: 402 }
      )
    )
    const error = await streamAssistantAnswer(
      { message: 'Omzet?', mode: 'ASK' },
      { onEvent: () => undefined }
    ).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AssistantError)
    expect(error).toMatchObject({
      status: 402,
      code: 'ai_units_exhausted',
      remainingUnits: 0,
    })
  })
})
