import { UserPlus } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useEmployees } from './employees-provider'

export function EmployeesPrimaryButtons() {
  const { setOpen } = useEmployees()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Employee</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
