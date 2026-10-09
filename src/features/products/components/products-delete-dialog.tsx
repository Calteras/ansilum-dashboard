'use client'

import { useState } from 'react'
import { AlertTriangle } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Product } from '../api/products.types'
import { useDeleteProductMutation } from '../api/products.queries'

type ProductsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Product
}

export function ProductsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductsDeleteDialogProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const deleteMutation = useDeleteProductMutation()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.sku) return

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
      disabled={value.trim() !== currentRow.sku || deleteMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          {t('products.deleteDialog.title')}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            {t('products.deleteDialog.desc')}{' '}
            <span className='font-bold'>{currentRow.name}</span>?
            <br />
            {t('products.deleteDialog.warning')}
          </p>

          <Label className='my-2'>
            {t('products.deleteDialog.skuLabel')}
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('products.deleteDialog.skuPlaceholder', { sku: currentRow.sku })}
              className='font-sans tabular-nums uppercase'
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>{t('products.deleteDialog.alertTitle')}</AlertTitle>
            <AlertDescription>
              {t('products.deleteDialog.alertDesc')}
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteMutation.isPending ? t('products.deleteDialog.deleting') : t('products.deleteDialog.confirmText')}
      destructive
    />
  )
}
