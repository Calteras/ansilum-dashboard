'use client'

import { useState } from 'react'
import { AlertTriangle } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Outlet } from '../data/schema'
import { useDeleteOutletMutation } from '../api/outlets.queries'

type OutletsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Outlet
}

export function OutletsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: OutletsDeleteDialogProps) {
  const [value, setValue] = useState('')
  const deleteMutation = useDeleteOutletMutation()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      await deleteMutation.mutateAsync(currentRow.id)
      onOpenChange(false)
      setValue('')
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!deleteMutation.isPending) {
          setValue('')
          onOpenChange(state)
        }
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.code || deleteMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Delete Outlet
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-semibold'>{currentRow.name}</span>?
            <br />
            This action will permanently remove the outlet and all associated
            data. This cannot be undone.
          </p>

          <Label className='my-2'>
            Outlet Code:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter "${currentRow.code}" to confirm deletion.`}
              className='font-sans tabular-nums uppercase'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation cannot be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
      destructive
    />
  )
}
