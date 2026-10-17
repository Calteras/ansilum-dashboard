import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { useCopy } from '@/hooks/use-copy'
import { SearchIcon } from '@/components/icons'

type SearchProps = { className?: string; placeholder?: string }

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Opens the global search. Looks like a field so it reads as "search here". */
export function Search({ className, placeholder }: SearchProps) {
  const { setOpen } = useSearch()
  const copy = useCopy()
  const label = placeholder ?? copy('Cari…', 'Search…')

  return (
    <button
      type='button'
      onClick={() => setOpen(true)}
      aria-label={copy('Cari di Ansilum', 'Search Ansilum')}
      aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
      className={cn(
        'border-input bg-surface-subtle text-fg-muted hover:bg-surface-hover focus-visible:outline-ring flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 text-start transition-colors focus-visible:outline-2 sm:max-w-80 pointer-coarse:h-11',
        className
      )}
    >
      <SearchIcon aria-hidden='true' className='size-4 shrink-0' />
      <span className='truncate text-[13px]'>{label}</span>
      <kbd className='bg-card ms-auto hidden rounded border px-1.5 text-[11px] leading-5 sm:inline-flex'>
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
