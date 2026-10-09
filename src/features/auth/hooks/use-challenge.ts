import { useCallback, useRef, useState } from 'react'

// Consume synchronously before awaiting: double clicks cannot reuse a token.
export function useChallenge() {
  const token = useRef<string | null>(null)
  const busy = useRef(false)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [generation, setGeneration] = useState(0)
  const onToken = useCallback((value: string | null) => {
    token.current = value
    setReady(Boolean(value))
  }, [])
  const run = async (request: (freshToken: string) => Promise<void>) => {
    if (busy.current || !token.current) return
    busy.current = true
    const freshToken = token.current
    onToken(null)
    setPending(true)
    try {
      await request(freshToken)
    } finally {
      busy.current = false
      onToken(null)
      setPending(false)
      setGeneration((value) => value + 1)
    }
  }
  return { ready, pending, generation, onToken, run }
}
