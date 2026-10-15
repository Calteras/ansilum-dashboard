import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { saveCardApi } from '../subscription.api'
import { billingOverview, signInAsOwner } from '../test-fixtures'
import { AddCardDialog } from './add-card-dialog'

vi.mock('../subscription.api', () => ({ saveCardApi: vi.fn() }))

const setup = billingOverview().data.cardSetup!

function renderDialog(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <AddCardDialog
      open
      onOpenChange={onOpenChange}
      setup={setup}
      replacing={false}
    />,
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  )
  return onOpenChange
}

function fill() {
  fireEvent.change(screen.getByLabelText('Card number'), {
    target: { value: '4811 1111 1111 1114' },
  })
  fireEvent.change(screen.getByLabelText('Expiry date'), {
    target: { value: '1230' },
  })
  fireEvent.change(screen.getByLabelText('Security code'), {
    target: { value: '123' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  signInAsOwner()
})
afterEach(() => {
  delete window.MidtransNew3ds
})

it('registers the card with Midtrans and saves only its token', async () => {
  const registerCard = vi.fn((_card, options) =>
    options.onSuccess({
      status_code: '200',
      saved_token_id: '481111ROJmTHpQLfrbVwpqHKldSQ1114',
      masked_card: '48111111-1114',
    })
  )
  window.MidtransNew3ds = {
    getCardToken: vi.fn(),
    authenticate: vi.fn(),
    registerCard,
  }
  vi.mocked(saveCardApi).mockResolvedValue({} as never)
  const onOpenChange = renderDialog()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Save card' }))
  await waitFor(() =>
    expect(saveCardApi).toHaveBeenCalledWith({
      savedTokenId: '481111ROJmTHpQLfrbVwpqHKldSQ1114',
      maskedCard: '48111111-1114',
      expMonth: 12,
      expYear: 2030,
    })
  )
  expect(registerCard.mock.calls[0][0]).toEqual({
    card_number: '4811111111111114',
    card_exp_month: '12',
    card_exp_year: '2030',
    card_cvv: '123',
  })
  expect(JSON.stringify(vi.mocked(saveCardApi).mock.calls)).not.toContain(
    '4811111111111114'
  )
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
})

it('explains a card Midtrans refuses and saves nothing', async () => {
  window.MidtransNew3ds = {
    getCardToken: vi.fn(),
    authenticate: vi.fn(),
    registerCard: vi.fn((_card, options) =>
      options.onFailure({ status_code: '400' })
    ),
  }
  renderDialog()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Save card' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'We couldn’t save this card'
  )
  expect(saveCardApi).not.toHaveBeenCalled()
})
