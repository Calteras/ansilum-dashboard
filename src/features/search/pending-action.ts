import { useEffect } from 'react'

export type PendingAction =
  | 'products.create'
  | 'categories.create'
  | 'modifier-groups.create'
  | 'ingredients.create'
  | 'outlets.create'
  | 'employees.create'

let pending: PendingAction | null = null

/** Queues an action for the page the search is about to navigate to. */
export function queuePendingAction(action: PendingAction) {
  pending = action
}

/**
 * Runs `run` once if `action` was queued before this page mounted, e.g. opening
 * the create dialog after choosing "Add product" in search.
 */
export function usePendingAction(action: PendingAction, run: () => void) {
  useEffect(() => {
    if (pending !== action) return
    pending = null
    run()
    // Only on mount: the queue is a one-shot hand-off from navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
