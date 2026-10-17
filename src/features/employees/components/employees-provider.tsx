import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { usePendingAction } from '@/features/search/pending-action'
import type { Employee } from '../data/schema'

type EmployeesDialogType = 'add' | 'edit' | 'delete'

type EmployeesContextType = {
  open: EmployeesDialogType | null
  setOpen: (str: EmployeesDialogType | null) => void
  currentRow: Employee | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Employee | null>>
}

const EmployeesContext = React.createContext<EmployeesContextType | null>(null)

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<EmployeesDialogType>(null)
  // "Add …" chosen in global search opens the create dialog on arrival.
  usePendingAction('employees.create', () => setOpen('add'))
  const [currentRow, setCurrentRow] = useState<Employee | null>(null)

  return (
    <EmployeesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </EmployeesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEmployees = () => {
  const employeesContext = React.useContext(EmployeesContext)

  if (!employeesContext) {
    throw new Error('useEmployees has to be used within <EmployeesContext>')
  }

  return employeesContext
}
