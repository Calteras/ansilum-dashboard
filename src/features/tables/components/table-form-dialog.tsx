import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TableData, TableSection } from '../data/types'
import type { Node } from 'reactflow'

interface TableFormValues {
  name: string
  capacity: number
  shape: TableData['shape']
  section: TableSection
  posX: number
  posY: number
  width: number
  height: number
}

interface TableFormDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  node?: Node<TableData> | null
  defaultSection: TableSection
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TableFormValues) => void
}

const sections: TableSection[] = ['Main Hall', 'Outdoor', 'VIP Room', 'Bar Area', 'Private Dining']

function valuesFromNode(
  node: TableFormDialogProps['node'],
  defaultSection: TableSection
): TableFormValues {
  return {
    name: node?.data.name ?? '',
    capacity: node?.data.capacity ?? 4,
    shape: node?.data.shape ?? 'rectangle',
    section: node?.data.section ?? defaultSection,
    posX: Math.round(node?.position.x ?? 120),
    posY: Math.round(node?.position.y ?? 120),
    width: Math.round(typeof node?.style?.width === 'number' ? node.style.width : 120),
    height: Math.round(typeof node?.style?.height === 'number' ? node.style.height : 80),
  }
}

export function TableFormDialog({
  open,
  mode,
  node,
  defaultSection,
  onOpenChange,
  onSubmit,
}: TableFormDialogProps) {
  const [values, setValues] = useState(() => valuesFromNode(node, defaultSection))

  const set = <K extends keyof TableFormValues>(key: K, value: TableFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const submit = () => {
    if (!values.name.trim() || values.capacity < 1) return
    onSubmit({ ...values, name: values.name.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add table' : `Edit ${node?.data.name ?? 'table'}`}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Add the table to the local layout. It will be created when you save the full layout.'
              : 'Edit the table locally. Save the complete layout to persist this change.'}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='text-sm'>Name<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' value={values.name} onChange={(event) => set('name', event.target.value)} /></label>
          <label className='text-sm'>Capacity<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' type='number' min={1} value={values.capacity} onChange={(event) => set('capacity', Number(event.target.value))} /></label>
          <label className='text-sm'>Section<select className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' value={values.section} onChange={(event) => set('section', event.target.value as TableSection)}>{sections.map((section) => <option key={section}>{section}</option>)}</select></label>
          <label className='text-sm'>Shape<select className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' value={values.shape} onChange={(event) => set('shape', event.target.value as TableData['shape'])}><option value='rectangle'>Rectangle</option><option value='square'>Square</option><option value='circle'>Circle</option></select></label>
          <label className='text-sm'>Position X<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' type='number' value={values.posX} onChange={(event) => set('posX', Number(event.target.value))} /></label>
          <label className='text-sm'>Position Y<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' type='number' value={values.posY} onChange={(event) => set('posY', Number(event.target.value))} /></label>
          <label className='text-sm'>Width<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' type='number' min={1} value={values.width} onChange={(event) => set('width', Number(event.target.value))} /></label>
          <label className='text-sm'>Height<input className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2' type='number' min={1} value={values.height} onChange={(event) => set('height', Number(event.target.value))} /></label>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!values.name.trim() || values.capacity < 1}>{mode === 'add' ? 'Add to layout' : 'Apply changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
