import { formatMoney } from '@/lib/format'
'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ChefHat } from '@/components/icons'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type { Product } from '../api/products.types'
import {
  useProductRecipeQuery,
  useSaveRecipeMutation,
} from '@/features/recipes/api/recipes.queries'

interface IngredientOption {
  id: string
  code: string
  name: string
  unit: string
  costPerUnit: number | string
  currentStock: number | string
}

interface IngredientsListResponse {
  data: IngredientOption[]
}

interface RecipeRow {
  ingredientId: string
  quantity: number
  unit: string
}

const formatRupiah = formatMoney

function formatNumber(value: number | string): string {
  return new Intl.NumberFormat('id-ID').format(Number(value))
}

type ProductsRecipeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Product
}

export function ProductsRecipeDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductsRecipeDialogProps) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const { data: recipeData, isLoading: recipeLoading } =
    useProductRecipeQuery(currentRow.id)

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', 'list-all'],
    queryFn: () =>
      tenantGet<IngredientsListResponse>(tenantApiPaths.ingredients.list),
    enabled: open,
  })

  const saveMutation = useSaveRecipeMutation()
  const ingredients = ingredientsData?.data ?? []

  // Populate rows from existing recipe
  useEffect(() => {
    if (recipeData?.data?.items) {
      setRows(
        recipeData.data.items.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unit: item.unit,
        }))
      )
      setHasChanges(false)
    } else if (!recipeLoading) {
      setRows([])
      setHasChanges(false)
    }
  }, [recipeData, recipeLoading])

  const addRow = () => {
    setRows((prev) => [...prev, { ingredientId: '', quantity: 0, unit: '' }])
    setHasChanges(true)
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const updateRow = (
    index: number,
    field: keyof RecipeRow,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        if (field === 'ingredientId') {
          const ingredient = ingredients.find((ing) => ing.id === value)
          return {
            ...row,
            ingredientId: value as string,
            unit: ingredient?.unit ?? row.unit,
          }
        }
        return { ...row, [field]: value }
      })
    )
    setHasChanges(true)
  }

  const getLineCost = (row: RecipeRow): number => {
    const ingredient = ingredients.find((ing) => ing.id === row.ingredientId)
    if (!ingredient) return 0
    return Number(ingredient.costPerUnit) * row.quantity
  }

  const totalCogs = rows.reduce((sum, row) => sum + getLineCost(row), 0)
  const basePrice = Number(currentRow.basePrice)
  const profitMargin = basePrice - totalCogs

  const canSave =
    hasChanges &&
    rows.length > 0 &&
    rows.every((r) => r.ingredientId && r.quantity > 0 && r.unit)

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        productId: currentRow.id,
        items: rows.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
          unit: r.unit,
        })),
      })
      setHasChanges(false)
    } catch {
      // Error handled by mutation
    }
  }

  // Ingredients already used (excluding the current row being edited)
  const usedIngredientIds = new Set(rows.map((r) => r.ingredientId))

  return (
    <Sheet
      open={open}
      onOpenChange={(state) => {
        if (!saveMutation.isPending) {
          onOpenChange(state)
        }
      }}
    >
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <ChefHat size={20} />
            {t('products.recipeDialog.title')} {currentRow.name}
          </SheetTitle>
          <SheetDescription>
            {t('products.recipeDialog.desc')}{' '}
            <span className='font-sans tabular-nums'>{currentRow.sku}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Summary Cards */}
        <div className='grid grid-cols-3 gap-3'>
          <div className='rounded-md border p-3 text-center'>
            <div className='text-muted-foreground text-xs'>{t('products.recipeDialog.basePrice')}</div>
            <div className='mt-1 font-sans tabular-nums text-sm font-semibold'>
              {formatRupiah(basePrice)}
            </div>
          </div>
          <div className='rounded-md border p-3 text-center'>
            <div className='text-muted-foreground text-xs'>{t('products.recipeDialog.totalCogs')}</div>
            <div className='mt-1 font-sans tabular-nums text-sm font-semibold'>
              {formatRupiah(totalCogs)}
            </div>
          </div>
          <div className='rounded-md border p-3 text-center'>
            <div className='text-muted-foreground text-xs'>{t('products.recipeDialog.profitMargin')}</div>
            <div
              className={`mt-1 font-sans tabular-nums text-sm font-semibold ${profitMargin < 0 ? 'text-red-500' : 'text-leaf'}`}
            >
              {formatRupiah(profitMargin)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Ingredients List */}
        <div className='flex flex-1 flex-col gap-3 overflow-y-auto'>
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-medium'>
              {t('products.recipeDialog.ingredients', { count: rows.length })}
            </h4>
            <Button type='button' variant='outline' size='sm' onClick={addRow}>
              <Plus size={14} className='mr-1' />
              {t('products.recipeDialog.addIngredient')}
            </Button>
          </div>

          {recipeLoading ? (
            <div className='flex h-24 items-center justify-center text-sm text-muted-foreground'>
              {t('products.recipeDialog.loadingRecipe')}
            </div>
          ) : rows.length === 0 ? (
            <div className='flex h-24 flex-col items-center justify-center gap-2 rounded-md border border-dashed'>
              <p className='text-sm text-muted-foreground'>
                {t('products.recipeDialog.noIngredients')}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addRow}
              >
                <Plus size={14} className='mr-1' />
                {t('products.recipeDialog.addFirstIngredient')}
              </Button>
            </div>
          ) : (
            rows.map((row, index) => {
              const ingredient = ingredients.find(
                (ing) => ing.id === row.ingredientId
              )
              const lineCost = getLineCost(row)

              return (
                <div
                  key={index}
                  className='space-y-2 rounded-md border p-3'
                >
                  <div className='flex items-start gap-2'>
                    <div className='flex-1 space-y-2'>
                      <Select
                        value={row.ingredientId}
                        onValueChange={(val) =>
                          updateRow(index, 'ingredientId', val)
                        }
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('products.recipeDialog.selectIngredient')} />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem
                              key={ing.id}
                              value={ing.id}
                              disabled={
                                usedIngredientIds.has(ing.id) &&
                                ing.id !== row.ingredientId
                              }
                            >
                              <span className='font-sans tabular-nums text-xs'>
                                {ing.code}
                              </span>{' '}
                              — {ing.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className='flex gap-2'>
                        <Input
                          type='number'
                          placeholder={t('products.recipeDialog.qty')}
                          value={row.quantity || ''}
                          onChange={(e) =>
                            updateRow(
                              index,
                              'quantity',
                              Number(e.target.value)
                            )
                          }
                          className='w-24'
                        />
                        <Input
                          placeholder={t('products.recipeDialog.unit')}
                          value={row.unit}
                          onChange={(e) =>
                            updateRow(index, 'unit', e.target.value)
                          }
                          className='w-20'
                        />
                        <div className='flex flex-1 items-center justify-end gap-2 text-xs'>
                          {ingredient && (
                            <>
                              <span className='text-muted-foreground'>
                                @{formatRupiah(ingredient.costPerUnit)}/{ingredient.unit}
                              </span>
                              <Badge variant='outline' className='font-sans tabular-nums'>
                                {formatRupiah(lineCost)}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {ingredient && (
                        <div className='text-xs text-muted-foreground'>
                          {t('products.recipeDialog.available')}{' '}
                          {formatNumber(ingredient.currentStock)}{' '}
                          {ingredient.unit}
                        </div>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='mt-1 shrink-0 text-red-500'
                      onClick={() => removeRow(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <SheetFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? t('products.recipeDialog.saving') : t('products.recipeDialog.saveRecipe')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
