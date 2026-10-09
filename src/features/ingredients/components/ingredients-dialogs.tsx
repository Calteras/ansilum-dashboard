import { IngredientsActionDialog } from './ingredients-action-dialog'
import { IngredientsDeleteDialog } from './ingredients-delete-dialog'
import { useIngredients } from './ingredients-provider'
import { StockMovementDialog } from '@/features/stock-movements/components/stock-movement-dialog'

export function IngredientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useIngredients()

  function closeAndClear(dialog: Parameters<typeof setOpen>[0]) {
    return () => {
      setOpen(dialog)
      setTimeout(() => setCurrentRow(null), 500)
    }
  }

  return (
    <>
      <IngredientsActionDialog
        key='ingredient-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <IngredientsActionDialog
            key={`ingredient-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={closeAndClear('edit')}
            currentRow={currentRow}
          />
          <IngredientsDeleteDialog
            key={`ingredient-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={closeAndClear('delete')}
            currentRow={currentRow}
          />
          <StockMovementDialog
            key={`stock-movement-${currentRow.id}`}
            open={open === 'stock-movement'}
            onOpenChange={closeAndClear('stock-movement')}
            initialIngredient={currentRow}
          />
        </>
      )}
    </>
  )
}
