import { OutletsActionDialog } from './outlets-action-dialog'
import { OutletsDeleteDialog } from './outlets-delete-dialog'
import { useOutlets } from './outlets-provider'

export function OutletsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useOutlets()
  return (
    <>
      <OutletsActionDialog
        key='outlet-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <OutletsActionDialog
            key={`outlet-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <OutletsDeleteDialog
            key={`outlet-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
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
