import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Store } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useProductOutletsQuery,
  useSetProductOutletsMutation,
} from '../api/products.queries'
import type { OutletRef, Product } from '../api/products.types'

interface OutletsListResponse {
  data: OutletRef[]
}

type ProductsOutletsDialogProps = {
  currentRow: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsOutletsDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductsOutletsDialogProps) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: allOutlets, isLoading: isLoadingAll } = useQuery({
    queryKey: ['outlets', 'list'],
    queryFn: () => tenantGet<OutletsListResponse>(tenantApiPaths.outlets.list),
    enabled: open,
  })

  const { data: assignedOutlets, isLoading: isLoadingAssigned } =
    useProductOutletsQuery(open ? currentRow.id : '')

  const setOutletsMutation = useSetProductOutletsMutation()

  const outlets = allOutlets?.data ?? []
  const isLoading = isLoadingAll || isLoadingAssigned
  const isPending = setOutletsMutation.isPending

  useEffect(() => {
    if (open && assignedOutlets) {
      setSelectedIds(assignedOutlets.map((o) => o.id))
    }
  }, [open, assignedOutlets])

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    await setOutletsMutation.mutateAsync({
      id: currentRow.id,
      data: { outletIds: selectedIds },
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isPending) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Store size={18} />
            {t('products.outletsDialog.title')}
          </DialogTitle>
          <DialogDescription>
            <span className='font-medium'>{currentRow.name}</span>{' '}
            {t('products.outletsDialog.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          {/* Scope badge */}
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>
              {t('products.scope.currentScope')}
            </span>
            <Badge
              variant={
                currentRow.scope === 'OUTLET_SPECIFIC' ? 'default' : 'secondary'
              }
            >
              {currentRow.scope === 'OUTLET_SPECIFIC'
                ? t('products.scope.OUTLET_SPECIFIC')
                : t('products.scope.GLOBAL')}
            </Badge>
            {currentRow.scope === 'GLOBAL' && (
              <span className='text-muted-foreground text-xs'>
                {t('products.scope.visibleAllOutlets')}
              </span>
            )}
          </div>

          <div className='rounded-md border'>
            {isLoading ? (
              <div className='space-y-3 p-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className='h-5 w-full' />
                ))}
              </div>
            ) : outlets.length === 0 ? (
              <p className='text-muted-foreground p-4 text-center text-sm'>
                {t('products.outletsDialog.noOutlets')}
              </p>
            ) : (
              <ul className='divide-y'>
                {outlets.map((outlet) => {
                  const checked = selectedIds.includes(outlet.id)
                  return (
                    <li
                      key={outlet.id}
                      className='hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3'
                      onClick={() => toggle(outlet.id)}
                    >
                      <Checkbox
                        id={`dlg-outlet-${outlet.id}`}
                        checked={checked}
                        onCheckedChange={() => toggle(outlet.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        htmlFor={`dlg-outlet-${outlet.id}`}
                        className='flex-1 cursor-pointer text-sm'
                      >
                        {outlet.name}
                        <span className='text-muted-foreground ml-1.5 font-sans tabular-nums text-xs'>
                          {outlet.code}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <p className='text-muted-foreground text-xs'>
            {String(
              t('products.outletsDialog.selectedCount', {
                selected: selectedIds.length,
                total: outlets.length,
              } as never)
            )}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending || isLoading}>
            {isPending
              ? t('products.outletsDialog.saving')
              : t('products.outletsDialog.saveAssignments')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
