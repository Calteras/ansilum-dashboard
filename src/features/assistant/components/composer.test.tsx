import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AssistantMode } from '../api/assistant.types'
import { Composer } from './composer'

function Harness({
  onSubmit,
  onStop = () => {},
  streaming = false,
  deepAnalysisAvailable = true,
}: {
  onSubmit: (question: string, mode: AssistantMode) => void
  onStop?: () => void
  streaming?: boolean
  deepAnalysisAvailable?: boolean
}) {
  const [value, setValue] = useState('')
  return (
    <Composer
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      onStop={onStop}
      streaming={streaming}
      units={{ ASK: 1, DEEP_ANALYSIS: 5 }}
      deepAnalysisAvailable={deepAnalysisAvailable}
    />
  )
}

describe('Composer', () => {
  it('sends on Enter and keeps Shift+Enter for a new line', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const input = screen.getByRole('textbox', { name: 'Your question' })
    await user.type(input, 'Omzet?{Shift>}{Enter}{/Shift}ok')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Omzet?\nok', 'ASK')
  })

  it('asks for a Deep Analysis when the chip is on', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const chip = screen.getByRole('button', { name: 'Deep Analysis' })
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByRole('textbox'), 'Kenapa?')
    await user.click(screen.getByRole('button', { name: 'Send question' }))
    expect(onSubmit).toHaveBeenCalledWith('Kenapa?', 'DEEP_ANALYSIS')
  })

  it('keeps Deep Analysis off when the plan does not include it', () => {
    render(<Harness onSubmit={vi.fn()} deepAnalysisAvailable={false} />)
    expect(screen.getByRole('button', { name: 'Deep Analysis' })).toBeDisabled()
  })

  it('turns the send button into stop while an answer streams', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    render(<Harness onSubmit={vi.fn()} onStop={onStop} streaming />)
    expect(
      screen.queryByRole('button', { name: 'Send question' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stop answering' }))
    await user.type(screen.getByRole('textbox'), '{Escape}')
    expect(onStop).toHaveBeenCalledTimes(2)
  })
})
