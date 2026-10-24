/**
 * Ask Ansilum contract (ansilum-be /ai/*). AI payloads keep the agent's snake_case
 * field names; numbers are computed by the backend and shown as returned.
 */

export type AssistantMode = 'ASK' | 'DEEP_ANALYSIS'

export type MetricUnit = 'currency' | 'count' | 'percent' | 'quantity'

export interface Metric {
  key: string
  label: string
  value: number | null
  unit: MetricUnit
  currency?: string | null
  change_percent?: number | null
}

export interface MetricGroupComponent {
  type: 'metric_group'
  title: string
  subtitle?: string | null
  metrics: Metric[]
  source_tool: string
}

export interface DataTableColumn {
  key: string
  label: string
  unit?: MetricUnit | 'text'
}

export type CellValue = string | number | null

export interface DataTableComponent {
  type: 'data_table'
  title: string
  columns: DataTableColumn[]
  rows: Record<string, CellValue>[]
  currency?: string | null
  source_tool: string
}

export interface TextBlockComponent {
  type: 'text'
  text: string
}

export type AnswerComponent =
  | TextBlockComponent
  | MetricGroupComponent
  | DataTableComponent

export interface Citation {
  source_id: string
  document_id: string
  chunk_id: string
  title: string
  section?: string | null
  page?: number | null
  canonical_uri?: string | null
}

export type AnswerStatus = 'completed' | 'limit_reached' | 'failed'

/** One data card as an A2UI v0.9 surface (https://a2ui.org), built by the agent. */
export interface A2uiSurfaceMessages {
  surface_id: string
  messages: Record<string, unknown>[]
}

export interface AgentAnswer {
  text: string
  status: AnswerStatus
  citations: Citation[]
  components: AnswerComponent[]
  a2ui?: A2uiSurfaceMessages[]
  warnings: string[]
}

/** What one request cost and what is left (ansilum-be AI units). */
export interface UnitUsage {
  units_charged: number
  remaining_units: number
}

export interface UnitBalance {
  cycle_start: string
  cycle_end: string
  included_units: number
  included_used: number
  pack_units: number
  reserved_units: number
  remaining_units: number
  units_per_request: Record<AssistantMode, number>
  deep_analysis_available: boolean
}

/** Server-sent events of /ai/query/stream; `usage` is added by ansilum-be at the end. */
export type AssistantEvent =
  | {
      type: 'run.started'
      run_id: string
      conversation_id: string
      user_message_id: string
      request_id: string
    }
  | { type: 'text.delta'; text: string }
  | { type: 'tool.started'; tool: string; call_id: string }
  | {
      type: 'tool.completed'
      tool: string
      call_id: string
      ok: boolean
      duration_ms: number
      error_code?: string | null
    }
  | { type: 'retrieval.completed'; call_id: string; source_count: number }
  | { type: 'citation.available'; citation: Citation }
  | { type: 'ui.component'; component: AnswerComponent }
  | { type: 'ui.a2ui'; surface: A2uiSurfaceMessages }
  | {
      type: 'run.completed'
      run_id: string
      message_id: string
      answer: AgentAnswer
    }
  | {
      type: 'run.failed'
      run_id: string | null
      message_id?: string | null
      code: string
      message: string
      retryable: boolean
    }
  | ({ type: 'usage' } & UnitUsage)

export interface AskRequest {
  message: string
  mode: AssistantMode
  conversationId?: string
}
