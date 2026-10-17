import { useSyncExternalStore } from 'react'

const KEY = 'ansilum.search.recent-pages'
const LIMIT = 5
const listeners = new Set<() => void>()
let cache: string[] | null = null

function read(): string[] {
  if (cache) return cache
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    cache = Array.isArray(parsed)
      ? parsed.filter((p) => typeof p === 'string')
      : []
  } catch {
    cache = []
  }
  return cache!
}

/** Moves `path` to the front of the recent list (per browser). */
export function recordRecentPage(path: string) {
  const next = [path, ...read().filter((p) => p !== path)].slice(0, LIMIT)
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable: recents last for this session only.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Recently visited page paths, most recent first. */
export function useRecentPages(): string[] {
  return useSyncExternalStore(subscribe, read, () => [])
}
