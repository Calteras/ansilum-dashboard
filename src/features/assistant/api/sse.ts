/**
 * Incremental server-sent events parser: feed it decoded text as it arrives and it
 * reports each complete event (`event:` name and joined `data:` lines). Only the
 * unfinished tail is buffered.
 */
export function createSseParser(onEvent: (name: string, data: string) => void) {
  let buffer = ''

  function emit(block: string) {
    let name = 'message'
    const data: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue // comment / keep-alive
      if (line.startsWith('event:')) name = line.slice(6).trim()
      else if (line.startsWith('data:'))
        data.push(line.slice(5).replace(/^ /, ''))
    }
    if (data.length) onEvent(name, data.join('\n'))
  }

  return {
    push(text: string) {
      buffer += text.replace(/\r\n?/g, '\n')
      let end = buffer.indexOf('\n\n')
      while (end !== -1) {
        emit(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
        end = buffer.indexOf('\n\n')
      }
    },
    /** Emit a final event that was not followed by a blank line. */
    flush() {
      if (buffer.trim()) emit(buffer)
      buffer = ''
    },
  }
}
