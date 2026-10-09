import { FlaskConical } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useIngredients } from './ingredients-provider'

export function IngredientsPrimaryButtons() {
  const { setOpen } = useIngredients()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Ingredient</span> <FlaskConical size={18} />
      </Button>
    </div>
  )
}
