import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Ingredient } from '../api/ingredients.types'

type IngredientsDialogType = 'add' | 'edit' | 'delete' | 'stock-movement'

type IngredientsContextType = {
  open: IngredientsDialogType | null
  setOpen: (str: IngredientsDialogType | null) => void
  currentRow: Ingredient | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Ingredient | null>>
}

const IngredientsContext =
  React.createContext<IngredientsContextType | null>(null)

export function IngredientsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<IngredientsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Ingredient | null>(null)

  return (
    <IngredientsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </IngredientsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useIngredients = () => {
  const context = React.useContext(IngredientsContext)
  if (!context) {
    throw new Error(
      'useIngredients has to be used within <IngredientsContext>'
    )
  }
  return context
}
