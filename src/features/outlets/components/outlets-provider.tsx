import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { usePendingAction } from '@/features/search/pending-action'
import type { Outlet } from '../data/schema'

type OutletsDialogType = 'add' | 'edit' | 'delete'

type OutletsContextType = {
  open: OutletsDialogType | null
  setOpen: (str: OutletsDialogType | null) => void
  currentRow: Outlet | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Outlet | null>>
}

const OutletsContext = React.createContext<OutletsContextType | null>(null)

export function OutletsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<OutletsDialogType>(null)
  // "Add …" chosen in global search opens the create dialog on arrival.
  usePendingAction('outlets.create', () => setOpen('add'))
  const [currentRow, setCurrentRow] = useState<Outlet | null>(null)

  return (
    <OutletsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </OutletsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOutlets = () => {
  const outletsContext = React.useContext(OutletsContext)

  if (!outletsContext) {
    throw new Error('useOutlets has to be used within <OutletsContext>')
  }

  return outletsContext
}
