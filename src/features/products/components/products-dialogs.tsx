import { ProductsActionDialog } from './products-action-dialog'
import { ProductsDeactivateDialog } from './products-deactivate-dialog'
import { ProductsDeleteDialog } from './products-delete-dialog'
import { ProductsOutletsDialog } from './products-outlets-dialog'
import { ProductsRecipeDialog } from './products-recipe-dialog'
import { useProducts } from './products-provider'

export function ProductsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useProducts()
  return (
    <>
      <ProductsActionDialog
        key='product-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ProductsDeactivateDialog
            key={`product-deactivate-${currentRow.id}`}
            open={open === 'deactivate'}
            onOpenChange={() => {
              setOpen('deactivate')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
          <ProductsActionDialog
            key={`product-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <ProductsDeleteDialog
            key={`product-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <ProductsRecipeDialog
            key={`product-recipe-${currentRow.id}`}
            open={open === 'recipe'}
            onOpenChange={() => {
              setOpen('recipe')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <ProductsOutletsDialog
            key={`product-outlets-${currentRow.id}`}
            open={open === 'outlets'}
            onOpenChange={() => {
              setOpen('outlets')
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
