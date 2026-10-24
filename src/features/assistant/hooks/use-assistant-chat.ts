import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useA2uiSurfaces } from '../a2ui/use-a2ui-surfaces'
import { AssistantError, streamAssistantAnswer } from '../api/assistant.api'
import { assistantKeys } from '../api/assistant.queries'
import type { AssistantEvent, AssistantMode } from '../api/assistant.types'
import { chatReducer, initialChatState } from '../model/chat-reducer'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** One Ask Ansilum conversation: asks, streams the answer, stops, retries, starts over. */
export function useAssistantChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const { ingest, getSurface, clear: clearSurfaces } = useA2uiSurfaces()
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
      dispatch({ type: 'ask', id, question: message, mode, at: Date.now() })
      const onEvent = (event: AssistantEvent) => {
        // Surfaces are processed before the turn refers to them.
        if (event.type === 'ui.a2ui') ingest([event.surface])
        if (event.type === 'run.completed') ingest(event.answer.a2ui)
        dispatch({ type: 'event', id, event, at: Date.now() })
      }
      try {
        await streamAssistantAnswer(
          {
            message,
            mode,
            ...(conversationRef.current
              ? { conversationId: conversationRef.current }
              : {}),
          },
          { signal: controller.signal, onEvent }
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
    [queryClient, ingest]
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  /** Asks an unanswered question again in place of its failed or stopped turn. */
  const retry = useCallback(
    (turnId: string) => {
      const turn = state.turns.find((t) => t.id === turnId)
      if (!turn || turn.status === 'streaming' || abortRef.current) return
      dispatch({ type: 'remove', id: turnId })
      void ask(turn.question, turn.mode)
    },
    [state.turns, ask]
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    dispatch({ type: 'reset' })
    clearSurfaces()
  }, [clearSurfaces])

  return { state, isStreaming, ask, stop, retry, reset, getSurface }
}
