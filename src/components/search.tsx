import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { useSearch } from '@/context/search-provider'
import { Button } from './ui/button'

type SearchProps = { className?: string; type?: React.HTMLInputTypeAttribute; placeholder?: string }

export function Search({ className, placeholder }: SearchProps) {
  const { setOpen } = useSearch()
  const copy = useCopy()
  const label = placeholder ?? copy('Cari halaman…', 'Find a page…')
  return (
    <Button variant='ghost' aria-label={label} className={cn('text-muted-foreground min-w-0 flex-1 justify-start gap-2 px-2 font-normal sm:max-w-72 sm:px-3', className)} onClick={() => setOpen(true)}>
      <SearchIcon aria-hidden='true' className='size-5' />
      <span className='truncate text-sm'>{label}</span>
      <kbd className='ms-auto hidden rounded border px-1.5 py-0.5 text-xs sm:inline-flex'>⌘ K</kbd>
    </Button>
  )
}
