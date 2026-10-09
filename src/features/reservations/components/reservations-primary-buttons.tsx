import { CalendarCheck } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useReservations } from './reservations-provider'

export function ReservationsPrimaryButtons() {
  const { setOpen } = useReservations()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Reservation</span> <CalendarCheck size={18} />
      </Button>
    </div>
  )
}
