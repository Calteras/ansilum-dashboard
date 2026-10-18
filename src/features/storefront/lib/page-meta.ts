import { useEffect } from 'react'

/**
 * Sets the tab title and description for a storefront page. Link previews in
 * chat apps need server-rendered tags (roadmap); this covers the browser.
 */
export function usePageMeta(title: string | null, description?: string | null) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content')
    if (meta && description) meta.setAttribute('content', description)
    return () => {
      document.title = previous
      if (meta && previousDescription)
        meta.setAttribute('content', previousDescription)
    }
  }, [title, description])
}
