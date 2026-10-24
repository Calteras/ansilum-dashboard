import { useEffect } from 'react'
import { useAssistantStore, type PageContext } from '../store/assistant-store'

/**
 * Tells the assistant panel what this page shows, so a question asked from the
 * panel can be about it. Identifiers and filters only, never data from the screen.
 */
export function useAssistantPageContext(context: PageContext | null) {
  const key = context ? JSON.stringify(context) : null
  useEffect(() => {
    if (!key) return
    const value = JSON.parse(key) as PageContext
    useAssistantStore.getState().setPageContext(value)
    return () => {
      if (useAssistantStore.getState().pageContext === value)
        useAssistantStore.getState().setPageContext(null)
    }
  }, [key])
}
