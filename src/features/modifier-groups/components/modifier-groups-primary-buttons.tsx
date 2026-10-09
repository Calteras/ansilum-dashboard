import { ListPlus } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useModifierGroups } from './modifier-groups-provider'

export function ModifierGroupsPrimaryButtons() {
  const { setOpen } = useModifierGroups()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Modifier Group</span> <ListPlus size={18} />
      </Button>
    </div>
  )
}
