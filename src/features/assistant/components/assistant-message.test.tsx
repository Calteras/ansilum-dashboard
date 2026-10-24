import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { MessageProcessor } from '@a2ui/web_core/v0_9'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANSILUM_CATALOG_ID, ansilumCatalog } from '../a2ui/ansilum-catalog'
import type { ChatTurn } from '../model/chat-reducer'
import { AssistantMessage } from './assistant-message'

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

const salesSurface = (surfaceId: string) => [
  {
    version: 'v0.9',
    createSurface: { surfaceId, catalogId: ANSILUM_CATALOG_ID },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId,
      components: [
        {
          id: 'root',
          component: 'MetricGroup',
          title: 'Sales summary',
          metrics: [
            {
              key: 'sales',
              label: 'Net sales',
              value: 581000,
              unit: 'currency',
            },
          ],
        },
      ],
    },
  },
]

const metricGroup = {
  type: 'metric_group' as const,
  title: 'Sales summary',
  metrics: [
    {
      key: 'sales',
      label: 'Net sales',
      value: 581000,
      unit: 'currency' as const,
    },
  ],
  source_tool: 'get_sales_summary',
}

const turn = (overrides: Partial<ChatTurn> = {}): ChatTurn => ({
  id: 't1',
  question: 'Omzet?',
  mode: 'ASK',
  status: 'completed',
  text: 'Penjualan **Rp581.000** dari 10 transaksi.',
  components: [metricGroup],
  surfaceIds: [],
  citations: [],
  warnings: [],
  tools: [{ callId: 'k1', tool: 'get_sales_summary', status: 'done' }],
  error: null,
  unitsCharged: 1,
  startedAt: 0,
  thoughtMs: 3_200,
  ...overrides,
})

describe('AssistantMessage', () => {
  it('renders the data cards as A2UI surfaces', async () => {
    const processor = new MessageProcessor<ReactCatalogComponent>([
      ansilumCatalog,
    ])
    processor.processMessages(salesSurface('a2ui-r-1') as never)
    await act(async () => {
      render(
        <AssistantMessage
          turn={turn({ surfaceIds: ['a2ui-r-1'] })}
          getSurface={(id) => processor.getSurface(id)}
        />
      )
    })
    const card = await screen.findByRole('region', { name: 'Sales summary' })
    expect(within(card).getByText('Net sales')).toBeInTheDocument()
    expect(
      screen.getAllByRole('region', { name: 'Sales summary' })
    ).toHaveLength(1)
  })

  it('falls back to the plain cards when a surface was refused', () => {
    render(
      <AssistantMessage
        turn={turn({ surfaceIds: ['a2ui-missing'] })}
        getSurface={() => undefined}
      />
    )
    expect(
      screen.getByRole('region', { name: 'Sales summary' })
    ).toBeInTheDocument()
  })

  it('sums up the thinking and shows the data it read on request', async () => {
    const user = userEvent.setup()
    render(<AssistantMessage turn={turn()} getSurface={() => undefined} />)
    const summary = screen.getByRole('button', {
      name: /Thought for 3s · 1 data source checked/,
    })
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    await user.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('Sales summary', { selector: 'li' })
    ).toBeInTheDocument()
    expect(screen.getByText('1 AI unit')).toBeInTheDocument()
  })

  it('says what the agent is doing while it streams', () => {
    render(
      <AssistantMessage
        turn={turn({
          status: 'streaming',
          text: '',
          components: [],
          tools: [
            { callId: 'k1', tool: 'get_top_products', status: 'running' },
          ],
          thoughtMs: null,
          unitsCharged: null,
        })}
        getSurface={() => undefined}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Finding the best sellers'
    )
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.queryByRole('button', { name: 'Copy answer' })
    ).not.toBeInTheDocument()
  })

  it('offers a retry for a stopped answer', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <AssistantMessage
        turn={turn({
          status: 'cancelled',
          text: '',
          components: [],
          unitsCharged: null,
        })}
        getSurface={() => undefined}
        onRetry={onRetry}
      />
    )
    expect(
      screen.getByText('Stopped. No units were charged.')
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
