import { useCopy } from '@/hooks/use-copy'

/** Localized text for shared controls and short, static form labels. */
export function UiText({ id, en }: { id: string; en: string }) {
  const copy = useCopy()
  return <>{copy(id, en)}</>
}
