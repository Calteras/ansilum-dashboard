import { A2uiSurface, type ReactCatalogComponent } from '@a2ui/react/v0_9'
import { MessageProcessor } from '@a2ui/web_core/v0_9'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ANSILUM_CATALOG_ID, ansilumCatalog } from './ansilum-catalog'

/** Exactly what ansilum-ai's schemas/a2ui.py emits for a sales card. */
const surfaceMessages = (surfaceId: string) => [
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
          subtitle: '2026-10-01 to 2026-10-24',
          metrics: [
            {
              key: 'sales',
              label: 'Net sales',
              value: 581000,
              unit: 'currency',
              currency: 'IDR',
              changePercent: -12.5,
            },
            {
              key: 'transactions',
              label: 'Transactions',
              value: 10,
              unit: 'count',
            },
          ],
        },
      ],
    },
  },
]

describe('Ansilum A2UI catalog', () => {
  it('renders an agent surface with the backend figures', async () => {
    const processor = new MessageProcessor<ReactCatalogComponent>([
      ansilumCatalog,
    ])
    processor.processMessages(surfaceMessages('a2ui-run-1-1') as never)
    const surface = processor.model.surfacesMap.get('a2ui-run-1-1')
    expect(surface).toBeDefined()
    await act(async () => {
      render(<A2uiSurface surface={surface!} />)
    })
    expect(await screen.findByText('Net sales')).toBeInTheDocument()
    expect(screen.getByText(/^Rp581[.,]000$/)).toBeInTheDocument()
    expect(screen.getByText('Sales summary')).toBeInTheDocument()
  })

  it('refuses a surface for a catalog it does not know', () => {
    const processor = new MessageProcessor<ReactCatalogComponent>([
      ansilumCatalog,
    ])
    const foreign = [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'evil',
          catalogId: 'https://example.com/other-catalog.json',
        },
      },
    ]
    expect(() => processor.processMessages(foreign as never)).toThrow()
    expect(processor.model.surfacesMap.get('evil')).toBeUndefined()
  })
})
