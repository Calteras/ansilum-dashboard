import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCopy } from '@/hooks/use-copy'
import { assistantKeys } from '../api/assistant.queries'
import {
  isAssistantPath,
  useAssistantAccess,
} from '../hooks/use-assistant-access'
import { useAssistantStore } from '../store/assistant-store'
import { AssistantPanel } from './assistant-panel'

/**
 * Keeps Ask Ansilum alive across the app: the side panel, the ⌘J shortcut, history
 * refreshes, and a notice when an answer finishes while the merchant is elsewhere.
 */
export function AssistantShell() {
  const copy = useCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const allowed = useAssistantAccess()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const revision = useAssistantStore((s) => s.revision)
  const finished = useAssistantStore((s) => s.finished)
  const where = useRef(pathname)
  const notified = useRef<string | null>(null)

  useEffect(() => {
    where.current = pathname
    if (isAssistantPath(pathname))
      useAssistantStore.getState().setPanelOpen(false)
  }, [pathname])

  useEffect(() => {
    if (revision)
      void queryClient.invalidateQueries({ queryKey: assistantKeys.all })
  }, [revision, queryClient])

  useEffect(() => {
    if (!finished || notified.current === finished.turnId) return
    notified.current = finished.turnId
    const watching =
      isAssistantPath(where.current) || useAssistantStore.getState().panelOpen
    if (watching || finished.status === 'cancelled') return
    const { conversationId } = finished
    const open = () =>
      void (conversationId
        ? navigate({
            to: '/chats/$conversationId',
            params: { conversationId },
          })
        : navigate({ to: '/chats' }))
    const action = { label: copy('Buka', 'Open'), onClick: open }
    if (finished.status === 'failed')
      toast.error(
        copy(
          'Jawaban tidak dapat diselesaikan.',
          'The answer could not be finished.'
        ),
        { action }
      )
    else
      toast.success(copy('Jawaban Anda sudah siap.', 'Your answer is ready.'), {
        action,
      })
  }, [finished, copy, navigate])

  useEffect(() => {
    if (!allowed) return
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'j' &&
        !isAssistantPath(where.current)
      ) {
        event.preventDefault()
        const store = useAssistantStore.getState()
        store.setPanelOpen(!store.panelOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allowed])

  return allowed ? <AssistantPanel /> : null
}
