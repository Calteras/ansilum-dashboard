import { PowerOff } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Product } from '../api/products.types'
import { useSoftDeleteProductMutation } from '../api/products.queries'

type ProductsDeactivateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Product
}

export function ProductsDeactivateDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductsDeactivateDialogProps) {
  const { t } = useTranslation()
  const mutation = useSoftDeleteProductMutation()

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(currentRow.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!mutation.isPending) onOpenChange(state)
      }}
      handleConfirm={handleConfirm}
      disabled={mutation.isPending}
      title={
        <span className='flex items-center gap-2 text-status-warning'>
          <PowerOff size={18} />
          {t('products.deactivateDialog.title')}
        </span>
      }
      desc={
        <p>
          {t('products.deactivateDialog.desc')}{' '}
          <span className='font-semibold'>{currentRow.name}</span>?{' '}
          {t('products.deactivateDialog.descSuffix')}
        </p>
      }
      confirmText={mutation.isPending ? t('products.deactivateDialog.deactivating') : t('products.deactivateDialog.confirmText')}
    />
  )
}
