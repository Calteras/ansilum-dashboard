import { ModifierGroupsActionDialog } from './modifier-groups-action-dialog'
import { ModifierGroupsDeleteDialog } from './modifier-groups-delete-dialog'
import { useModifierGroups } from './modifier-groups-provider'

export function ModifierGroupsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useModifierGroups()
  return (
    <>
      <ModifierGroupsActionDialog
        key='modifier-group-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <ModifierGroupsActionDialog
            key={`modifier-group-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <ModifierGroupsDeleteDialog
            key={`modifier-group-delete-${currentRow.id}`}
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
