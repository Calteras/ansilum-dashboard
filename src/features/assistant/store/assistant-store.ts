import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { MessageProcessor } from '@a2ui/web_core/v0_9'
import { create } from 'zustand'
import { useAuthStore } from '@/stores/auth-store'
import { ansilumCatalog } from '../a2ui/ansilum-catalog'
import {
  AssistantError,
  cancelRunApi,
  getConversationApi,
  streamAssistantAnswer,
} from '../api/assistant.api'
import type {
  A2uiSurfaceMessages,
  AssistantEvent,
  AssistantMode,
  UiContext,
} from '../api/assistant.types'
import {
  chatReducer,
  initialChatState,
  replyTarget,
  type ChatAction,
  type ChatState,
  type TurnStatus,
} from '../model/chat-reducer'
import { turnsFromConversation } from '../model/history'

/** How often a conversation whose answer runs on the server is reloaded. */
export const DETACHED_POLL_MS = 2500

/** What the page under the assistant panel shows, as the agent's UI context. */
export interface PageContext {
  /** Shown on the composer chip, already in the user's language. */
  label: string
  context: UiContext
  outletId?: string
}

export interface FinishedAnswer {
  turnId: string
  conversationId: string | null
  status: TurnStatus
}

interface AssistantState {
  chat: ChatState
  /** A conversation being opened from the history (null once shown). */
  opening: { conversationId: string; error: string | null } | null
  draft: string
  deepAnalysis: boolean
  panelOpen: boolean
  pageContext: PageContext | null
  /** Whether the next question from the panel carries the page context. */
  attachPageContext: boolean
  /** Bumped whenever the server-side history or balance changed. */
  revision: number
  /** The latest answer that settled while it streamed here (for the "ready" notice). */
  finished: FinishedAnswer | null
}

interface AssistantActions {
  ask: (
    question: string,
    mode: AssistantMode,
    options?: {
      uiContext?: UiContext
      outletId?: string
      parentId?: string | null
    }
  ) => Promise<void>
  stop: () => void
  retry: (turnId: string) => void
  newChat: () => void
  open: (conversationId: string) => Promise<void>
  setDraft: (draft: string) => void
  setDeepAnalysis: (on: boolean) => void
  setPanelOpen: (open: boolean) => void
  setPageContext: (context: PageContext | null) => void
  setAttachPageContext: (on: boolean) => void
}

export type AssistantStore = AssistantState & AssistantActions

const initialState: AssistantState = {
  chat: initialChatState,
  opening: null,
  draft: '',
  deepAnalysis: false,
  panelOpen: false,
  pageContext: null,
  attachPageContext: true,
  revision: 0,
  finished: null,
}

const createProcessor = () =>
  new MessageProcessor<ReactCatalogComponent>([ansilumCatalog])

// Live, non-serializable parts of the session (outside React and the state).
let processor = createProcessor()
let stream: AbortController | null = null
let stopOnStart = false
let poll: ReturnType<typeof setTimeout> | null = null

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const isFinal = (event: AssistantEvent) =>
  event.type === 'run.completed' ||
  event.type === 'run.failed' ||
  event.type === 'run.cancelled'

/** Surfaces are processed once, against the Ansilum catalog only. */
function ingest(surfaces: A2uiSurfaceMessages[] | undefined) {
  for (const surface of surfaces ?? []) {
    if (processor.getSurface(surface.surface_id)) continue
    try {
      processor.processMessages(surface.messages as never)
    } catch {
      // Not a surface this app renders: the answer falls back to its plain cards.
      processor.model.deleteSurface(surface.surface_id)
    }
  }
}

export function getSurface(surfaceId: string) {
  return processor.getSurface(surfaceId)
}

/**
 * Stop showing the live stream here. The answer is not stopped: ansilum-be reads it
 * to the end, so it lands in the history (and is billed only if it completes).
 */
function detach() {
  const current = stream
  stream = null
  stopOnStart = false
  current?.abort()
  if (poll) clearTimeout(poll)
  poll = null
}

function cancelOnServer(runId: string) {
  cancelRunApi(runId).catch(() => {
    // Already ended (its final event is on the way) or unreachable: stop listening.
    if (stream) detach()
  })
}

export const useAssistantStore = create<AssistantStore>()((set, get) => {
  const dispatch = (action: ChatAction) =>
    set((state) => ({ chat: chatReducer(state.chat, action) }))
  const changed = () => set((state) => ({ revision: state.revision + 1 }))

  const watchDetached = (conversationId: string) => {
    if (poll) clearTimeout(poll)
    poll = setTimeout(async () => {
      poll = null
      if (get().chat.conversationId !== conversationId) return
      try {
        const view = await getConversationApi(conversationId)
        if (get().chat.conversationId !== conversationId) return
        if (!view.active_run) {
          const { turns, surfaces } = turnsFromConversation(view)
          ingest(surfaces)
          dispatch({ type: 'load', conversationId, turns })
          changed()
          return
        }
      } catch {
        // Try again on the next tick.
      }
      watchDetached(conversationId)
    }, DETACHED_POLL_MS)
  }

  return {
    ...initialState,

    ask: async (question, mode, options = {}) => {
      const message = question.trim()
      const { chat } = get()
      if (
        !message ||
        stream ||
        chat.turns.some((t) => t.status === 'streaming')
      )
        return
      const id = newId()
      const conversationId = chat.conversationId
      // A first question replies to nothing, so a retry of it becomes a sibling.
      const parentId =
        options.parentId !== undefined
          ? options.parentId
          : conversationId
            ? replyTarget(chat.turns)
            : null
      dispatch({
        type: 'ask',
        id,
        question: message,
        mode,
        at: Date.now(),
        parentId,
      })
      const controller = new AbortController()
      stream = controller
      const live = () => stream === controller

      const onEvent = (event: AssistantEvent) => {
        if (!live()) return
        // Surfaces are processed before the turn refers to them.
        if (event.type === 'ui.a2ui') ingest([event.surface])
        if (event.type === 'run.completed') ingest(event.answer.a2ui)
        dispatch({ type: 'event', id, event, at: Date.now() })
        if (event.type === 'run.started') {
          if (stopOnStart) {
            stopOnStart = false
            cancelOnServer(event.run_id)
          }
          changed()
        }
        if (isFinal(event)) {
          const turn = get().chat.turns.find((t) => t.id === id)
          set({
            finished: {
              turnId: id,
              conversationId: get().chat.conversationId,
              status: turn?.status ?? 'failed',
            },
          })
        }
      }

      try {
        await streamAssistantAnswer(
          {
            message,
            mode,
            ...(conversationId ? { conversationId } : {}),
            ...(conversationId && parentId !== undefined
              ? { parentMessageId: parentId }
              : {}),
            ...(options.uiContext ? { uiContext: options.uiContext } : {}),
            ...(options.outletId ? { outletId: options.outletId } : {}),
          },
          { signal: controller.signal, onEvent }
        )
        // A stream that ended without a final event (connection dropped).
        if (live()) dispatch({ type: 'cancelled', id })
      } catch (error) {
        if (!live()) return
        if (controller.signal.aborted) dispatch({ type: 'cancelled', id })
        else if (error instanceof AssistantError)
          dispatch({
            type: 'error',
            id,
            code: error.code,
            message: error.message,
            remainingUnits: error.remainingUnits,
          })
        else
          dispatch({
            type: 'error',
            id,
            code: 'network_error',
            message: error instanceof Error ? error.message : String(error),
            remainingUnits: null,
          })
      } finally {
        if (live()) {
          stream = null
          stopOnStart = false
        }
        changed()
      }
    },

    stop: () => {
      const turn = get().chat.turns.find((t) => t.status === 'streaming')
      if (!turn) return
      dispatch({ type: 'stop', id: turn.id })
      if (turn.runId) cancelOnServer(turn.runId)
      // Not started yet: stop it as soon as the server names the run.
      else stopOnStart = true
      if (turn.detached && get().chat.conversationId)
        watchDetached(get().chat.conversationId!)
    },

    retry: (turnId) => {
      const turn = get().chat.turns.find((t) => t.id === turnId)
      if (!turn || turn.status === 'streaming' || stream) return
      dispatch({ type: 'remove', id: turnId })
      // Same parent: the retry replaces the failed attempt in the history.
      void get().ask(turn.question, turn.mode, {
        parentId: turn.parentId === undefined ? undefined : turn.parentId,
      })
    },

    newChat: () => {
      detach()
      processor = createProcessor()
      set((state) => ({
        chat: chatReducer(state.chat, { type: 'reset' }),
        opening: null,
      }))
    },

    open: async (conversationId) => {
      const { chat, opening } = get()
      if (chat.conversationId === conversationId) return
      if (opening?.conversationId === conversationId && !opening.error) return
      detach()
      processor = createProcessor()
      set((state) => ({
        chat: chatReducer(state.chat, { type: 'reset' }),
        opening: { conversationId, error: null },
      }))
      try {
        const view = await getConversationApi(conversationId)
        if (get().opening?.conversationId !== conversationId) return
        const { turns, surfaces } = turnsFromConversation(view)
        ingest(surfaces)
        dispatch({ type: 'load', conversationId, turns })
        set({ opening: null })
        if (view.active_run) watchDetached(conversationId)
      } catch (error) {
        if (get().opening?.conversationId !== conversationId) return
        set({
          opening: {
            conversationId,
            error:
              error instanceof AssistantError && error.code
                ? error.code
                : 'network_error',
          },
        })
      }
    },

    setDraft: (draft) => set({ draft }),
    setDeepAnalysis: (deepAnalysis) => set({ deepAnalysis }),
    setPanelOpen: (panelOpen) => set({ panelOpen }),
    setPageContext: (pageContext) => set({ pageContext }),
    setAttachPageContext: (attachPageContext) => set({ attachPageContext }),
  }
})

/** Forget the session: another business, or signed out. A running answer keeps running. */
export function resetAssistant() {
  detach()
  processor = createProcessor()
  useAssistantStore.setState((state) => ({
    ...initialState,
    revision: state.revision + 1,
  }))
}

export const selectStreaming = (state: AssistantStore) =>
  state.chat.turns.some((turn) => turn.status === 'streaming')

// Conversations belong to one business and one user: switching either starts over.
const sessionKey = () => {
  const auth = useAuthStore.getState()
  if (!auth.isAuthenticated) return null
  return `${auth.user?.id ?? ''}:${auth.activeTenant?.id ?? auth.session?.activeTenantId ?? ''}`
}
let lastSession = sessionKey()
useAuthStore.subscribe(() => {
  const next = sessionKey()
  if (next === lastSession) return
  lastSession = next
  resetAssistant()
})
