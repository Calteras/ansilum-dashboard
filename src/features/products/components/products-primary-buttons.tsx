import { Package } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useProducts } from './products-provider'

export function ProductsPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useProducts()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>{t('products.actions.addProduct')}</span> <Package size={18} />
      </Button>
    </div>
  )
}
