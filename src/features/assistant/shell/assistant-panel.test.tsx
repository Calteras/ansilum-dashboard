import { renderWithRouter, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/assistant.api'
import { resetAssistant, useAssistantStore } from '../store/assistant-store'
import { AssistantPanel } from './assistant-panel'

vi.mock('../api/assistant.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/assistant.api')>()),
  streamAssistantAnswer: vi.fn(),
  getAssistantUsageApi: vi.fn(),
}))

const dashboard = {
  label: 'Dashboard · Outlet Senopati · 1 Oct – 24 Oct 2026',
  context: {
    route: '/',
    surface: 'dashboard',
    activeFilters: { from: '2026-10-01', to: '2026-10-24' },
  },
  outletId: 'outlet-1',
}

beforeEach(() => {
  resetAssistant()
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never
  vi.mocked(api.getAssistantUsageApi).mockResolvedValue({
    cycle_start: '2026-10-01',
    cycle_end: '2026-10-31',
    included_units: 300,
    included_used: 1,
    pack_units: 0,
    reserved_units: 0,
    remaining_units: 299,
    units_per_request: { ASK: 1, DEEP_ANALYSIS: 5 },
    deep_analysis_available: true,
  })
  vi.mocked(api.streamAssistantAnswer).mockResolvedValue(undefined)
  useAssistantStore.getState().setPanelOpen(true)
  useAssistantStore.getState().setPageContext(dashboard)
})

describe('AssistantPanel', () => {
  it('asks about the page underneath, unless its context is removed', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssistantPanel />, { initialEntries: ['/'] })

    expect(
      await screen.findByRole('complementary', { name: 'Ask Ansilum' })
    ).toBeInTheDocument()
    expect(screen.getByText(dashboard.label)).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: 'Your question' }),
      'Kenapa turun?{Enter}'
    )
    expect(vi.mocked(api.streamAssistantAnswer).mock.calls[0][0]).toEqual({
      message: 'Kenapa turun?',
      mode: 'ASK',
      uiContext: dashboard.context,
      outletId: 'outlet-1',
    })

    await user.click(
      screen.getByRole('button', { name: 'Don’t include this page' })
    )
    expect(screen.queryByText(dashboard.label)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Include page' })
    ).toBeInTheDocument()
  })

  it('stays out of the way on the full Ask Ansilum page', async () => {
    const { router } = renderWithRouter(<AssistantPanel />, {
      initialEntries: ['/chats'],
    })
    await router.load()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssistantPanel />, { initialEntries: ['/'] })
    await screen.findByRole('complementary', { name: 'Ask Ansilum' })
    await user.click(screen.getByRole('textbox', { name: 'Your question' }))
    await user.keyboard('{Escape}')
    expect(useAssistantStore.getState().panelOpen).toBe(false)
  })
})
