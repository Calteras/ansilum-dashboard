import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { usePendingAction } from '@/features/search/pending-action'
import type { Product } from '../api/products.types'

type ProductsDialogType = 'add' | 'edit' | 'delete' | 'deactivate' | 'recipe' | 'outlets'

type ProductsContextType = {
  open: ProductsDialogType | null
  setOpen: (str: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Product | null>>
}

const ProductsContext = React.createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ProductsDialogType>(null)
  // "Add …" chosen in global search opens the create dialog on arrival.
  usePendingAction('products.create', () => setOpen('add'))
  const [currentRow, setCurrentRow] = useState<Product | null>(null)

  return (
    <ProductsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProductsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => {
  const productsContext = React.useContext(ProductsContext)
  if (!productsContext) {
    throw new Error('useProducts has to be used within <ProductsContext>')
  }
  return productsContext
}
