import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import { getActiveTenantId, tenantGet } from '@/lib/tenant-api-client'
import type { AskRequest, AssistantEvent, UnitBalance } from './assistant.types'
import { createSseParser } from './sse'

/** A refused or failed request, with the backend's stable code (e.g. ai_units_exhausted). */
export class AssistantError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
    readonly remainingUnits: number | null = null
  ) {
    super(message)
    this.name = 'AssistantError'
  }
}

interface ErrorBody {
  message?: unknown
  code?: unknown
  remaining_units?: unknown
  data?: { code?: unknown; remaining_units?: unknown } | null
}

async function toAssistantError(response: Response): Promise<AssistantError> {
  let body: ErrorBody = {}
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Not the backend's JSON envelope (e.g. a proxy page).
  }
  const code = body.code ?? body.data?.code
  const remaining = body.remaining_units ?? body.data?.remaining_units
  return new AssistantError(
    response.status,
    typeof code === 'string' ? code : null,
    typeof body.message === 'string'
      ? body.message
      : `Request failed with status ${response.status}`,
    typeof remaining === 'number' ? remaining : null
  )
}

/**
 * Ask a question and receive the answer as events. Resolves when the stream ends;
 * rejects with AssistantError when the backend refuses the request.
 */
export async function streamAssistantAnswer(
  request: AskRequest,
  {
    signal,
    onEvent,
  }: { signal?: AbortSignal; onEvent: (event: AssistantEvent) => void }
): Promise<void> {
  const tenantId = getActiveTenantId()
  if (!tenantId)
    throw new AssistantError(0, 'no_tenant', 'No active business selected.')

  const response = await fetch(`${API_BASE_URL}/ai/query/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'x-tenant-id': tenantId,
    },
    credentials: 'include',
    body: JSON.stringify(request),
    signal,
  })
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    throw await toAssistantError(response)
  }
  if (!response.body) return

  const parser = createSseParser((name, data) => {
    try {
      onEvent({ ...(JSON.parse(data) as object), type: name } as AssistantEvent)
    } catch {
      // A malformed event is skipped; the run's final event still settles the turn.
    }
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parser.push(decoder.decode(value, { stream: true }))
  }
  parser.push(decoder.decode())
  parser.flush()
}

export async function getAssistantUsageApi(): Promise<UnitBalance> {
  const response = await tenantGet<{ data: UnitBalance }>('/ai/usage')
  return response.data
}
