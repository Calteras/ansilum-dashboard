import { describe, expect, it } from 'vitest'
import { createSseParser } from './sse'

function collect() {
  const events: [string, string][] = []
  const parser = createSseParser((name, data) => events.push([name, data]))
  return { events, parser }
}

describe('createSseParser', () => {
  it('emits complete events however the stream is chunked', () => {
    const { events, parser } = collect()
    const stream =
      'event: run.started\ndata: {"run_id":"r"}\n\nevent: text.delta\ndata: {"text":"Om"}\n\n'
    for (const char of stream) parser.push(char)
    expect(events).toEqual([
      ['run.started', '{"run_id":"r"}'],
      ['text.delta', '{"text":"Om"}'],
    ])
  })

  it('handles CRLF, comments, multi-line data and a final event without a blank line', () => {
    const { events, parser } = collect()
    parser.push(
      ': keep-alive\r\n\r\nevent: usage\r\ndata: {"a":1,\r\ndata: "b":2}'
    )
    expect(events).toEqual([])
    parser.flush()
    expect(events).toEqual([['usage', '{"a":1,\n"b":2}']])
  })

  it('names events without an event line "message"', () => {
    const { events, parser } = collect()
    parser.push('data: x\n\n')
    expect(events).toEqual([['message', 'x']])
  })
})
