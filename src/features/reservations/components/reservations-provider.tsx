import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Reservation } from '../api/reservations.types'

type ReservationsDialogType = 'add' | 'fulfill' | 'cancel' | 'deposit'

type ReservationsContextType = {
  open: ReservationsDialogType | null
  setOpen: (str: ReservationsDialogType | null) => void
  currentRow: Reservation | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Reservation | null>>
}

const ReservationsContext = React.createContext<ReservationsContextType | null>(
  null
)

export function ReservationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<ReservationsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Reservation | null>(null)

  return (
    <ReservationsContext
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ReservationsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useReservations = () => {
  const context = React.useContext(ReservationsContext)
  if (!context) {
    throw new Error(
      'useReservations has to be used within <ReservationsProvider>'
    )
  }
  return context
}
