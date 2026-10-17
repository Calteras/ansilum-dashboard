import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { usePendingAction } from '@/features/search/pending-action'
import type { ModifierGroup } from '../api/modifier-groups.types'

type ModifierGroupsDialogType = 'add' | 'edit' | 'delete'

type ModifierGroupsContextType = {
  open: ModifierGroupsDialogType | null
  setOpen: (str: ModifierGroupsDialogType | null) => void
  currentRow: ModifierGroup | null
  setCurrentRow: React.Dispatch<React.SetStateAction<ModifierGroup | null>>
}

const ModifierGroupsContext =
  React.createContext<ModifierGroupsContextType | null>(null)

export function ModifierGroupsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<ModifierGroupsDialogType>(null)
  // "Add …" chosen in global search opens the create dialog on arrival.
  usePendingAction('modifier-groups.create', () => setOpen('add'))
  const [currentRow, setCurrentRow] = useState<ModifierGroup | null>(null)

  return (
    <ModifierGroupsContext
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ModifierGroupsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useModifierGroups = () => {
  const context = React.useContext(ModifierGroupsContext)
  if (!context) {
    throw new Error(
      'useModifierGroups has to be used within <ModifierGroupsContext>'
    )
  }
  return context
}
