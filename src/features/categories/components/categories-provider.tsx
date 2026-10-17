import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { usePendingAction } from '@/features/search/pending-action'
import type { Category } from '../api/categories.types'

type CategoriesDialogType = 'add' | 'edit' | 'delete'

type CategoriesContextType = {
  open: CategoriesDialogType | null
  setOpen: (str: CategoriesDialogType | null) => void
  currentRow: Category | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Category | null>>
}

const CategoriesContext = React.createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<CategoriesDialogType>(null)
  // "Add …" chosen in global search opens the create dialog on arrival.
  usePendingAction('categories.create', () => setOpen('add'))
  const [currentRow, setCurrentRow] = useState<Category | null>(null)

  return (
    <CategoriesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CategoriesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCategories = () => {
  const categoriesContext = React.useContext(CategoriesContext)
  if (!categoriesContext) {
    throw new Error('useCategories has to be used within <CategoriesContext>')
  }
  return categoriesContext
}
