import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { deliveryApi } from '../delivery.api'
import { bindingFixture, connectionFixture } from '../test-fixtures'
import { ProviderMenu, ProviderOperations } from './provider-operations'
import { CommandStatus } from './recovery'

vi.mock('../delivery.api', () => ({
  deliveryApi: {
    operate: vi.fn(),
    operation: vi.fn(),
    command: vi.fn(),
    resolve: vi.fn(),
    menu: vi.fn(),
  },
}))

describe('delivery operation safety', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    sessionStorage.clear()
    const tenant = {
      id: 'tenant-a',
      name: 'Cafe',
      slug: 'cafe',
      isActive: true,
      createdAt: '',
    }
    useAuthStore.setState({
      activeTenant: tenant,
      tenants: [{ id: 'membership', tenant, role: 'OWNER', memberSince: '' }],
    })
  })
  afterEach(() => {
    client.clear()
    vi.resetAllMocks()
    useAuthStore.getState().clearAuth()
  })
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  it('requires evidence to resolve an unknown command and never reissues it', async () => {
    vi.mocked(deliveryApi.command).mockResolvedValue({
      id: 'command-1',
      orderId: 'order-1',
      action: 'READY',
      status: 'UNKNOWN',
      errorCode: 'TIMEOUT',
      createdAt: '',
    })
    vi.mocked(deliveryApi.resolve).mockResolvedValue({
      id: 'command-1',
      orderId: 'order-1',
      action: 'READY',
      status: 'SUCCEEDED',
      errorCode: null,
      createdAt: '',
    })
    render(<CommandStatus id='command-1' />, { wrapper: Wrapper })
    const button = await screen.findByRole('button', {
      name: 'Record verified outcome',
    })
    expect(button).toBeDisabled()
    await userEvent.type(
      screen.getByLabelText('Provider verification evidence'),
      'Provider order GF-123 confirmed ready at 10:00'
    )
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(button)
    await waitFor(() =>
      expect(deliveryApi.resolve).toHaveBeenCalledWith(
        'command-1',
        'SUCCEEDED',
        'Provider order GF-123 confirmed ready at 10:00'
      )
    )
  })
  it('retains unknown operation status after remount and blocks another submission', async () => {
    const operation = {
      id: 'operation-1',
      bindingId: 'binding-1',
      action: 'STORE_STATUS' as const,
      status: 'UNKNOWN' as const,
      errorCode: 'TIMEOUT',
    }
    vi.mocked(deliveryApi.operate).mockResolvedValue(operation)
    vi.mocked(deliveryApi.operation).mockResolvedValue(operation)
    const view = render(
      <ProviderOperations
        binding={bindingFixture}
        connection={connectionFixture}
      />,
      { wrapper: Wrapper }
    )
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(
      screen.getByRole('button', { name: 'Queue operation' })
    )
    await screen.findByText('Unknown')
    expect(deliveryApi.operate).toHaveBeenCalledTimes(1)
    view.unmount()
    render(
      <ProviderOperations
        binding={bindingFixture}
        connection={connectionFixture}
      />,
      { wrapper: Wrapper }
    )
    expect(await screen.findByText('Unknown')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Queue operation' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Prepare a new operation after verification',
      })
    ).toBeDisabled()
    expect(deliveryApi.operate).toHaveBeenCalledTimes(1)
  })
  it('retries a lost response with the same payload and key', async () => {
    vi.mocked(deliveryApi.operate).mockRejectedValue(new Error('Response lost'))
    const view = render(
      <ProviderOperations
        binding={bindingFixture}
        connection={connectionFixture}
      />,
      { wrapper: Wrapper }
    )
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(
      screen.getByRole('button', { name: 'Queue operation' })
    )
    await screen.findByText('Response lost')
    const input = vi.mocked(deliveryApi.operate).mock.calls[0][1]
    view.unmount()
    render(
      <ProviderOperations
        binding={bindingFixture}
        connection={connectionFixture}
      />,
      { wrapper: Wrapper }
    )
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I have reviewed this operation and its provider requirements.',
      })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Retrieve or retry the same request' })
    )
    await waitFor(() => expect(deliveryApi.operate).toHaveBeenCalledTimes(2))
    expect(vi.mocked(deliveryApi.operate).mock.calls[1][1]).toEqual(input)
    expect(screen.getByLabelText('Operation')).toBeDisabled()
  })

  it('preserves a reviewed draft and its original version when a newer menu arrives', async () => {
    vi.mocked(deliveryApi.menu).mockRejectedValue(
      new Error('Menu version changed')
    )
    const view = render(<ProviderMenu binding={bindingFixture} />, {
      wrapper: Wrapper,
    })
    const input = screen.getByLabelText('Reviewed menu JSON')
    fireEvent.change(input, {
      target: { value: '{"categories":[],"draft":"keep me"}' },
    })
    await userEvent.click(screen.getByRole('checkbox'))
    view.rerender(
      <ProviderMenu
        binding={{
          ...bindingFixture,
          menuVersion: 2,
          menu: { categories: [], remote: true },
        }}
      />
    )
    expect(input).toHaveValue('{"categories":[],"draft":"keep me"}')
    await userEvent.click(
      screen.getByRole('button', { name: 'Save reviewed menu' })
    )
    await waitFor(() =>
      expect(deliveryApi.menu).toHaveBeenCalledWith(
        'binding-1',
        { categories: [], draft: 'keep me' },
        1
      )
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Load latest saved menu' })
    )
    expect(input).toHaveValue(
      JSON.stringify({ categories: [], remote: true }, null, 2)
    )
    expect(
      screen.getByRole('button', { name: 'Save reviewed menu' })
    ).toBeDisabled()
  })
})
