import { ReservationsActionDialog } from './reservations-action-dialog'
import { ReservationsFulfillDialog } from './reservations-fulfill-dialog'
import { ReservationsCancelDialog } from './reservations-cancel-dialog'
import { ReservationsDepositDialog } from './reservations-deposit-dialog'
import { useReservations } from './reservations-provider'

export function ReservationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useReservations()

  return (
    <>
      <ReservationsActionDialog
        key='reservation-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ReservationsFulfillDialog
            key={`reservation-fulfill-${currentRow.id}`}
            open={open === 'fulfill'}
            onOpenChange={() => {
              setOpen('fulfill')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ReservationsCancelDialog
            key={`reservation-cancel-${currentRow.id}`}
            open={open === 'cancel'}
            onOpenChange={() => {
              setOpen('cancel')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ReservationsDepositDialog
            key={`reservation-deposit-${currentRow.id}`}
            open={open === 'deposit'}
            onOpenChange={() => {
              setOpen('deposit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
