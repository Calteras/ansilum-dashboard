import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useChallenge } from './use-challenge'

it('consumes each token once, blocks concurrent requests and resets after rejection', async () => {
  const { result } = renderHook(() => useChallenge())
  let reject!: (error: Error) => void
  const request = vi.fn(
    () =>
      new Promise<void>((_resolve, fail) => {
        reject = fail
      })
  )
  await act(async () => result.current.run(request))
  expect(request).not.toHaveBeenCalled()
  act(() => result.current.onToken('first'))
  let pending!: Promise<void>
  act(() => {
    pending = result.current.run(request)
  })
  await act(async () => result.current.run(request))
  expect(request).toHaveBeenCalledExactlyOnceWith('first')
  await act(async () => {
    reject(new Error('offline'))
    await pending.catch(() => {})
  })
  await act(async () => result.current.run(request))
  expect(request).toHaveBeenCalledTimes(1)
  expect(result.current.ready).toBe(false)
  act(() => result.current.onToken('second'))
  const retry = vi.fn().mockResolvedValue(undefined)
  await act(async () => result.current.run(retry))
  expect(retry).toHaveBeenCalledExactlyOnceWith('second')
  expect(result.current.ready).toBe(false)
  expect(result.current.generation).toBe(2)
})
