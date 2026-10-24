import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AssistantError, streamAssistantAnswer } from '../api/assistant.api'
import { assistantKeys } from '../api/assistant.queries'
import type { AssistantMode } from '../api/assistant.types'
import { chatReducer, initialChatState } from '../model/chat-reducer'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** One Ask Ansilum conversation: asks, streams the answer, stops, starts over. */
export function useAssistantChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)
  const conversationRef = useRef<string | null>(null)

  useEffect(() => {
    conversationRef.current = state.conversationId
  }, [state.conversationId])

  useEffect(() => () => abortRef.current?.abort(), [])

  const isStreaming = state.turns.some((turn) => turn.status === 'streaming')

  const ask = useCallback(
    async (question: string, mode: AssistantMode) => {
      const message = question.trim()
      if (!message || abortRef.current) return
      const id = newId()
      const controller = new AbortController()
      abortRef.current = controller
      dispatch({ type: 'ask', id, question: message, mode })
      try {
        await streamAssistantAnswer(
          {
            message,
            mode,
            ...(conversationRef.current
              ? { conversationId: conversationRef.current }
              : {}),
          },
          {
            signal: controller.signal,
            onEvent: (event) => dispatch({ type: 'event', id, event }),
          }
        )
        // A stream that ended without a final event (connection dropped).
        dispatch({ type: 'cancelled', id })
      } catch (error) {
        if (controller.signal.aborted) {
          dispatch({ type: 'cancelled', id })
        } else if (error instanceof AssistantError) {
          dispatch({
            type: 'error',
            id,
            code: error.code,
            message: error.message,
            remainingUnits: error.remainingUnits,
          })
        } else {
          dispatch({
            type: 'error',
            id,
            code: 'network_error',
            message: error instanceof Error ? error.message : String(error),
            remainingUnits: null,
          })
        }
      } finally {
        abortRef.current = null
        void queryClient.invalidateQueries({ queryKey: assistantKeys.all })
      }
    },
    [queryClient]
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'reset' })
  }, [])

  return { state, isStreaming, ask, stop, reset }
}
