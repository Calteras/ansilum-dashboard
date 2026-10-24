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
  citations: Citation[]
  warnings: string[]
  tools: ToolStep[]
  error: { code: string | null; message: string } | null
  unitsCharged: number | null
}

export interface ChatState {
  conversationId: string | null
  turns: ChatTurn[]
  /** Last balance reported by the backend (null until a request settles). */
  remainingUnits: number | null
}

export type ChatAction =
  | { type: 'ask'; id: string; question: string; mode: AssistantMode }
  | { type: 'event'; id: string; event: AssistantEvent }
  | {
      type: 'error'
      id: string
      code: string | null
      message: string
      remainingUnits: number | null
    }
  | { type: 'cancelled'; id: string }
  | { type: 'reset' }

export const initialChatState: ChatState = {
  conversationId: null,
  turns: [],
  remainingUnits: null,
}

const key = (component: AnswerComponent) => JSON.stringify(component)

function applyEvent(turn: ChatTurn, event: AssistantEvent): ChatTurn {
  switch (event.type) {
    case 'text.delta':
      return { ...turn, text: turn.text + event.text }
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
    case 'run.completed': {
      const { answer } = event
      return {
        ...turn,
        // The validated answer replaces the streamed draft (citations resolved).
        status: answer.status,
        text: answer.text,
        components: answer.components.filter((c) => c.type !== 'text'),
        citations: answer.citations,
        warnings: answer.warnings,
        tools: turn.tools.map((step) =>
          step.status === 'running' ? { ...step, status: 'done' } : step
        ),
      }
    }
    case 'run.failed':
      return {
        ...turn,
        status: 'failed',
        error: { code: event.code, message: event.message },
      }
    case 'usage':
      return { ...turn, unitsCharged: event.units_charged }
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
          {
            id: action.id,
            question: action.question,
            mode: action.mode,
            status: 'streaming',
            text: '',
            components: [],
            citations: [],
            warnings: [],
            tools: [],
            error: null,
            unitsCharged: null,
          },
        ],
      }
    case 'event': {
      const { event } = action
      const next = updateTurn(state, action.id, (turn) =>
        applyEvent(turn, event)
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
        })),
        remainingUnits: action.remainingUnits ?? state.remainingUnits,
      }
    case 'cancelled':
      return updateTurn(state, action.id, (turn) =>
        turn.status === 'streaming' ? { ...turn, status: 'cancelled' } : turn
      )
    case 'reset':
      return { ...initialChatState, remainingUnits: state.remainingUnits }
  }
}
