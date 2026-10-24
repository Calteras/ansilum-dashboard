import type {
  AnswerComponent,
  AssistantEvent,
  AssistantMode,
  Citation,
} from '../api/assistant.types'

export type TurnStatus =
  | 'streaming'
  | 'completed'
  | 'limit_reached'
  | 'failed'
  | 'cancelled'

/** What the agent is doing, for the thinking orb (thinking-orbs states). */
export type TurnPhase = 'breathing' | 'working' | 'composing'

export interface ToolStep {
  callId: string
  tool: string
  status: 'running' | 'done' | 'failed'
}

export interface ChatTurn {
  id: string
  question: string
  mode: AssistantMode
  status: TurnStatus
  text: string
  components: AnswerComponent[]
  /** A2UI surfaces of this answer's data cards, in order. */
  surfaceIds: string[]
  citations: Citation[]
  warnings: string[]
  tools: ToolStep[]
  error: { code: string | null; message: string } | null
  unitsCharged: number | null
  startedAt: number
  /** Milliseconds from the question to the first answer text ("Thought for …"). */
  thoughtMs: number | null
  /** Server ids, once known: the run, the question and the answer messages. */
  runId: string | null
  userMessageId: string | null
  messageId: string | null
  /** The message this question replied to: null for a first question, undefined if unknown. */
  parentId: string | null | undefined
  /** Still answering on the server, but not streaming to this tab (opened from history). */
  detached: boolean
  /** Stop was pressed: shown as stopped, the server confirms with `run.cancelled`. */
  stopRequested: boolean
}

export interface ChatState {
  conversationId: string | null
  turns: ChatTurn[]
  /** Last balance reported by the backend (null until a request settles). */
  remainingUnits: number | null
}

export type ChatAction =
  | {
      type: 'ask'
      id: string
      question: string
      mode: AssistantMode
      at: number
      parentId: string | null | undefined
    }
  | { type: 'event'; id: string; event: AssistantEvent; at: number }
  | {
      type: 'error'
      id: string
      code: string | null
      message: string
      remainingUnits: number | null
    }
  | { type: 'cancelled'; id: string }
  | { type: 'stop'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'reset' }
  | { type: 'load'; conversationId: string; turns: ChatTurn[] }

export const initialChatState: ChatState = {
  conversationId: null,
  turns: [],
  remainingUnits: null,
}

export function newTurn(
  fields: Pick<ChatTurn, 'id' | 'question' | 'mode' | 'startedAt'> &
    Partial<ChatTurn>
): ChatTurn {
  return {
    status: 'streaming',
    text: '',
    components: [],
    surfaceIds: [],
    citations: [],
    warnings: [],
    tools: [],
    error: null,
    unitsCharged: null,
    thoughtMs: null,
    runId: null,
    userMessageId: null,
    messageId: null,
    parentId: undefined,
    detached: false,
    stopRequested: false,
    ...fields,
  }
}

/** Thinking until something happens; working while a tool runs; composing once text flows. */
export function turnPhase(turn: ChatTurn): TurnPhase | null {
  if (turn.status !== 'streaming') return null
  if (turn.detached) return 'working'
  if (turn.tools.some((step) => step.status === 'running')) return 'working'
  return turn.text ? 'composing' : 'breathing'
}

const key = (component: AnswerComponent) => JSON.stringify(component)

/** Ids and settlement still apply to a stopped turn; its content no longer changes. */
function applyToStopped(
  turn: ChatTurn,
  event: AssistantEvent,
  at: number
): ChatTurn {
  switch (event.type) {
    case 'run.started':
      return {
        ...turn,
        runId: event.run_id,
        userMessageId: event.user_message_id,
      }
    case 'run.completed':
      // The answer finished before the stop reached it: it is complete (and charged).
      return applyEvent({ ...turn, status: 'streaming' }, event, at)
    case 'run.cancelled':
      return { ...turn, messageId: event.message_id }
    case 'run.failed':
      return { ...turn, messageId: event.message_id ?? turn.messageId }
    default:
      return turn
  }
}

function applyEvent(
  turn: ChatTurn,
  event: AssistantEvent,
  at: number
): ChatTurn {
  if (event.type === 'usage')
    return { ...turn, unitsCharged: event.units_charged }
  if (turn.status !== 'streaming')
    return turn.stopRequested ? applyToStopped(turn, event, at) : turn
  switch (event.type) {
    case 'run.started':
      return {
        ...turn,
        runId: event.run_id,
        userMessageId: event.user_message_id,
      }
    case 'text.delta':
      return {
        ...turn,
        text: turn.text + event.text,
        thoughtMs: turn.thoughtMs ?? at - turn.startedAt,
      }
    case 'tool.started':
      return {
        ...turn,
        tools: [
          ...turn.tools,
          { callId: event.call_id, tool: event.tool, status: 'running' },
        ],
      }
    case 'tool.completed':
      return {
        ...turn,
        tools: turn.tools.map((step) =>
          step.callId === event.call_id
            ? { ...step, status: event.ok ? 'done' : 'failed' }
            : step
        ),
      }
    case 'citation.available':
      return turn.citations.some(
        (c) => c.source_id === event.citation.source_id
      )
        ? turn
        : { ...turn, citations: [...turn.citations, event.citation] }
    case 'ui.component':
      return event.component.type === 'text' ||
        turn.components.some((c) => key(c) === key(event.component))
        ? turn
        : { ...turn, components: [...turn.components, event.component] }
    case 'ui.a2ui':
      return turn.surfaceIds.includes(event.surface.surface_id)
        ? turn
        : {
            ...turn,
            surfaceIds: [...turn.surfaceIds, event.surface.surface_id],
          }
    case 'run.completed': {
      const { answer } = event
      return {
        ...turn,
        // The validated answer replaces the streamed draft (citations resolved).
        status: answer.status,
        text: answer.text,
        components: answer.components.filter((c) => c.type !== 'text'),
        surfaceIds: answer.a2ui?.map((s) => s.surface_id) ?? turn.surfaceIds,
        citations: answer.citations,
        warnings: answer.warnings,
        tools: turn.tools.map((step) =>
          step.status === 'running' ? { ...step, status: 'done' } : step
        ),
        thoughtMs: turn.thoughtMs ?? at - turn.startedAt,
        messageId: event.message_id,
        stopRequested: false,
      }
    }
    case 'run.cancelled':
      return { ...turn, status: 'cancelled', messageId: event.message_id }
    case 'run.failed':
      return {
        ...turn,
        status: 'failed',
        error: { code: event.code, message: event.message },
        messageId: event.message_id ?? turn.messageId,
      }
    default:
      return turn
  }
}

function updateTurn(
  state: ChatState,
  id: string,
  update: (turn: ChatTurn) => ChatTurn
): ChatState {
  return {
    ...state,
    turns: state.turns.map((turn) => (turn.id === id ? update(turn) : turn)),
  }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ask':
      return {
        ...state,
        turns: [
          ...state.turns,
          newTurn({
            id: action.id,
            question: action.question,
            mode: action.mode,
            startedAt: action.at,
            parentId: action.parentId,
          }),
        ],
      }
    case 'event': {
      const { event } = action
      const next = updateTurn(state, action.id, (turn) =>
        applyEvent(turn, event, action.at)
      )
      if (event.type === 'run.started')
        return { ...next, conversationId: event.conversation_id }
      if (event.type === 'usage')
        return { ...next, remainingUnits: event.remaining_units }
      return next
    }
    case 'error':
      return {
        ...updateTurn(state, action.id, (turn) => ({
          ...turn,
          status: 'failed',
          error: { code: action.code, message: action.message },
          unitsCharged: 0,
          stopRequested: false,
        })),
        remainingUnits: action.remainingUnits ?? state.remainingUnits,
      }
    case 'cancelled':
      return updateTurn(state, action.id, (turn) =>
        turn.status === 'streaming' ? { ...turn, status: 'cancelled' } : turn
      )
    case 'stop':
      return updateTurn(state, action.id, (turn) =>
        turn.status === 'streaming'
          ? {
              ...turn,
              status: 'cancelled',
              stopRequested: true,
              detached: false,
              tools: turn.tools.map((step) =>
                step.status === 'running' ? { ...step, status: 'done' } : step
              ),
            }
          : turn
      )
    case 'remove':
      return {
        ...state,
        turns: state.turns.filter((turn) => turn.id !== action.id),
      }
    case 'reset':
      return { ...initialChatState, remainingUnits: state.remainingUnits }
    case 'load':
      return {
        ...state,
        conversationId: action.conversationId,
        turns: action.turns,
      }
  }
}

/** The message a new question replies to: the latest answer (or question) with an id. */
export function replyTarget(turns: ChatTurn[]): string | undefined {
  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i]
    if (turn.messageId) return turn.messageId
    if (turn.userMessageId) return turn.userMessageId
  }
  return undefined
}
