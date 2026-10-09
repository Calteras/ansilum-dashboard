import i18n from '@/i18n'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest'

beforeEach(async () => { await i18n.changeLanguage('en') })

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Suppress console warnings for cleaner test output
/* eslint-disable no-console */
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0])
    if (
      message.includes('useRouter must be used inside') ||
      message.includes('act(...)') ||
      message.includes('Warning: An update')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: unknown[]) => {
    const message = String(args[0])
    if (
      message.includes('useRouter must be used inside') ||
      message.includes('act(...)')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
/* eslint-enable no-console */

// Mock window.matchMedia

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver
