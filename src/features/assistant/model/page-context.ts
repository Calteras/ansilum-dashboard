import { format } from 'date-fns'
import type { DateSpan } from '@/lib/date-range'
import type { PageContext } from '../store/assistant-store'

/** A page's context for the assistant: which page, period and outlet it shows. */
export function pageContextFor({
  title,
  surface,
  route,
  span,
  outletId,
  outletName,
}: {
  title: string
  surface: string
  route: string
  span?: DateSpan
  outletId?: string
  outletName?: string
}): PageContext {
  const period = span
    ? `${format(span.from, 'd MMM')} – ${format(span.to, 'd MMM yyyy')}`
    : null
  return {
    label: [title, outletName, period].filter(Boolean).join(' · '),
    context: {
      route,
      surface,
      ...(span
        ? {
            activeFilters: {
              from: format(span.from, 'yyyy-MM-dd'),
              to: format(span.to, 'yyyy-MM-dd'),
            },
          }
        : {}),
    },
    ...(outletId ? { outletId } : {}),
  }
}
