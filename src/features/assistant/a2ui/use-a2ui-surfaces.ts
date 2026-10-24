import { useCallback, useState } from 'react'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { MessageProcessor } from '@a2ui/web_core/v0_9'
import type { A2uiSurfaceMessages } from '../api/assistant.types'
import { ansilumCatalog } from './ansilum-catalog'

const createProcessor = () =>
  new MessageProcessor<ReactCatalogComponent>([ansilumCatalog])

/**
 * The A2UI surfaces of one conversation. Surfaces arrive as `ui.a2ui` events (and
 * again in the final answer); each is processed once, against the Ansilum catalog
 * only. A surface the catalog refuses is dropped and the answer falls back to the
 * plain cards built from `components`.
 */
export function useA2uiSurfaces() {
  const [processor, setProcessor] = useState(createProcessor)

  const ingest = useCallback(
    (surfaces: A2uiSurfaceMessages[] | undefined) => {
      for (const surface of surfaces ?? []) {
        if (processor.getSurface(surface.surface_id)) continue
        try {
          processor.processMessages(surface.messages as never)
        } catch {
          // Not a surface this app renders (unknown catalog or invalid props).
          processor.model.deleteSurface(surface.surface_id)
        }
      }
    },
    [processor]
  )

  const getSurface = useCallback(
    (surfaceId: string) => processor.getSurface(surfaceId),
    [processor]
  )

  /** A new conversation starts with no surfaces. */
  const clear = useCallback(() => setProcessor(createProcessor()), [])

  return { ingest, getSurface, clear }
}

export type A2uiSurfaces = ReturnType<typeof useA2uiSurfaces>
