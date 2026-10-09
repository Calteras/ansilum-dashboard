import { Tag } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useCategories } from './categories-provider'

export function CategoriesPrimaryButtons() {
  const { setOpen } = useCategories()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Category</span> <Tag size={18} />
      </Button>
    </div>
  )
}
