'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import { ImagePicker } from '@/components/image-picker'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateProductMutation,
  useDeleteProductPhotoMutation,
  useUpdateProductMutation,
  useUploadProductPhotoMutation,
} from '../api/products.queries'
import type {
  OutletRef,
  Product,
  ProductScope,
  ProductType,
} from '../api/products.types'

interface Category {
  id: string
  name: string
  color: string
}

interface CategoriesResponse {
  data: Category[]
}

interface ModifierGroupOption {
  id: string
  name: string
  isRequired: boolean
  minSelection: number
  maxSelection: number
}

interface ModifierGroupsResponse {
  data: ModifierGroupOption[]
}

interface OutletsResponse {
  data: OutletRef[]
}

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required.'),
  priceDelta: z.coerce.number(),
  sortOrder: z.coerce.number().int().min(0),
})

const productFormBase = z.object({
  name: z.string().min(1, 'Name is required.'),
  sku: z
    .string()
    .min(1, 'SKU is required.')
    .regex(
      /^[A-Z0-9-]+$/,
      'SKU can only contain uppercase letters, numbers, and hyphens.'
    ),
  categoryId: z.string().min(1, 'Category is required.'),
  basePrice: z.coerce.number().min(0, 'Base price must be 0 or greater.'),
  costPrice: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  productType: z.enum(['READY', 'COMPOSED', 'PACKAGE', 'SERVICE']),
  scope: z.enum(['GLOBAL', 'OUTLET_SPECIFIC']),
  outletIds: z.array(z.string()),
  isActive: z.boolean(),
  variants: z.array(variantSchema),
  modifierGroupIds: z.array(z.string()),
})

type ProductForm = z.infer<typeof productFormBase>

const formSchema = productFormBase.refine(
  (val) => val.scope !== 'OUTLET_SPECIFIC' || val.outletIds.length > 0,
  {
    message: 'Select at least one outlet for Outlet-Specific scope.',
    path: ['outletIds'],
  }
)

type ProductsActionDialogProps = {
  currentRow?: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ProductsActionDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!currentRow
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const uploadPhotoMutation = useUploadProductPhotoMutation()
  const deletePhotoMutation = useDeleteProductPhotoMutation()
  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadPhotoMutation.isPending ||
    deletePhotoMutation.isPending

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  // Edit only: the existing photo is deleted on save, not immediately.
  const [removePhoto, setRemovePhoto] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: () =>
      tenantGet<CategoriesResponse>(tenantApiPaths.categories.list),
    enabled: open,
  })

  const { data: modifierGroupsData } = useQuery({
    queryKey: ['modifier-groups', 'list'],
    queryFn: () =>
      tenantGet<ModifierGroupsResponse>(tenantApiPaths.modifierGroups.list),
    enabled: open,
  })

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', 'list'],
    queryFn: () => tenantGet<OutletsResponse>(tenantApiPaths.outlets.list),
    enabled: open,
  })

  const categories = categoriesData?.data ?? []
  const modifierGroups = modifierGroupsData?.data ?? []
  const outlets = outletsData?.data ?? []

  const form = useForm<ProductForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          sku: currentRow.sku,
          categoryId: currentRow.category?.id ?? '',
          basePrice: Number(currentRow.basePrice),
          costPrice: Number(currentRow.costPrice ?? 0),
          description: currentRow.description ?? '',
          productType: currentRow.productType,
          scope: (currentRow.scope ?? 'GLOBAL') as ProductScope,
          outletIds:
            currentRow.outletVisibilities?.map((v) => v.outletId) ?? [],
          isActive: currentRow.isActive,
          variants:
            currentRow.variants?.map((v, i) => ({
              name: v.name,
              priceDelta: Number(v.priceDelta),
              sortOrder: v.sortOrder ?? i,
            })) ?? [],
          modifierGroupIds:
            currentRow.modifierGroups?.map((mg) => mg.modifierGroup.id) ?? [],
        }
      : {
          name: '',
          sku: '',
          categoryId: '',
          basePrice: 0,
          costPrice: 0,
          description: '',
          productType: 'READY' as ProductType,
          scope: 'GLOBAL' as ProductScope,
          outletIds: [],
          isActive: true,
          variants: [],
          modifierGroupIds: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  })

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              name: currentRow.name,
              sku: currentRow.sku,
              categoryId: currentRow.category?.id ?? '',
              basePrice: Number(currentRow.basePrice),
              costPrice: Number(currentRow.costPrice ?? 0),
              description: currentRow.description ?? '',
              productType: currentRow.productType,
              scope: (currentRow.scope ?? 'GLOBAL') as ProductScope,
              outletIds:
                currentRow.outletVisibilities?.map((v) => v.outletId) ?? [],
              isActive: currentRow.isActive,
              variants:
                currentRow.variants?.map((v, i) => ({
                  name: v.name,
                  priceDelta: Number(v.priceDelta),
                  sortOrder: v.sortOrder ?? i,
                })) ?? [],
              modifierGroupIds:
                currentRow.modifierGroups?.map((mg) => mg.modifierGroup.id) ??
                [],
            }
          : {
              name: '',
              sku: '',
              categoryId: '',
              basePrice: 0,
              costPrice: 0,
              description: '',
              productType: 'READY' as ProductType,
              scope: 'GLOBAL' as ProductScope,
              outletIds: [],
              isActive: true,
              variants: [],
              modifierGroupIds: [],
            }
      )
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (values: ProductForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            name: values.name,
            categoryId: values.categoryId,
            basePrice: values.basePrice,
            costPrice: values.costPrice || undefined,
            description: values.description || undefined,
            productType: values.productType,
            scope: values.scope,
            outletIds:
              values.scope === 'OUTLET_SPECIFIC' ? values.outletIds : [],
            isActive: values.isActive,
            variants: values.variants.length > 0 ? values.variants : undefined,
            modifierGroupIds:
              values.modifierGroupIds.length > 0
                ? values.modifierGroupIds
                : undefined,
          },
        })
        // Photo changes go through the dedicated endpoint after the details
        // are saved, so a rejected image never discards the other edits.
        if (photoFile) {
          await uploadPhotoMutation.mutateAsync({
            id: currentRow.id,
            photo: photoFile,
          })
        } else if (removePhoto && currentRow.imageUrl) {
          await deletePhotoMutation.mutateAsync(currentRow.id)
        }
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          sku: values.sku,
          categoryId: values.categoryId,
          basePrice: values.basePrice,
          costPrice: values.costPrice || undefined,
          description: values.description || undefined,
          productType: values.productType,
          scope: values.scope,
          outletIds: values.scope === 'OUTLET_SPECIFIC' ? values.outletIds : [],
          variants: values.variants.length > 0 ? values.variants : undefined,
          modifierGroupIds:
            values.modifierGroupIds.length > 0
              ? values.modifierGroupIds
              : undefined,
          photo: photoFile ?? undefined,
        })
      }
      resetPhoto()
      form.reset()
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const resetPhoto = () => {
    setPhotoFile(null)
    setRemovePhoto(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isLoading) {
          resetPhoto()
          form.reset()
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit
              ? t('products.form.editTitle')
              : t('products.form.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('products.form.editDesc') : t('products.form.addDesc')}{' '}
            {t('products.form.clickSave')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='product-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.name')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('products.form.namePlaceholder')}
                      className='col-span-4'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sku'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.sku')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('products.form.skuPlaceholder')}
                      className='col-span-4 font-sans tabular-nums uppercase'
                      autoComplete='off'
                      disabled={isEdit}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.category')}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='col-span-4'>
                        <SelectValue
                          placeholder={t('products.form.categoryPlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='basePrice'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.basePrice')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='25000'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='costPrice'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.costPrice')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='15000'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 pt-2 text-end'>
                    {t('products.form.description')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('products.form.descriptionPlaceholder')}
                      className='col-span-4 resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            {/* Photo Upload */}
            <div className='grid grid-cols-6 items-start gap-x-4 gap-y-1'>
              <span className='col-span-2 pt-2 text-end text-sm font-medium'>
                {t('products.form.photo')}
              </span>
              <div className='col-span-4'>
                <ImagePicker
                  src={removePhoto ? null : currentRow?.imageUrl}
                  file={photoFile}
                  alt={t('products.form.photo')}
                  busy={uploadPhotoMutation.isPending || deletePhotoMutation.isPending}
                  disabled={isLoading}
                  onSelect={setPhotoFile}
                  onRemove={() => {
                    if (photoFile) setPhotoFile(null)
                    else setRemovePhoto(true)
                  }}
                  uploadLabel={t('products.form.uploadPhoto')}
                  changeLabel={t('products.form.changePhoto')}
                  removeLabel={t('products.form.removePhoto')}
                  hint={t('products.form.photoHint')}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name='productType'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.type')}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='col-span-4'>
                        <SelectValue
                          placeholder={t('products.form.typePlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='READY'>
                        {t('products.types.READY')}
                      </SelectItem>
                      <SelectItem value='COMPOSED'>
                        {t('products.types.COMPOSED')}
                      </SelectItem>
                      <SelectItem value='PACKAGE'>
                        {t('products.types.PACKAGE')}
                      </SelectItem>
                      <SelectItem value='SERVICE'>
                        {t('products.types.SERVICE')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            {/* Scope */}
            <FormField
              control={form.control}
              name='scope'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    {t('products.form.scope')}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='col-span-4'>
                        <SelectValue
                          placeholder={t('products.form.scopePlaceholder')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='GLOBAL'>
                        <span className='flex items-center gap-2'>
                          {t('products.scope.GLOBAL')}
                          <Badge variant='secondary' className='text-xs'>
                            {t('products.scope.allOutlets')}
                          </Badge>
                        </span>
                      </SelectItem>
                      <SelectItem value='OUTLET_SPECIFIC'>
                        <span className='flex items-center gap-2'>
                          {t('products.scope.OUTLET_SPECIFIC')}
                          <Badge variant='outline' className='text-xs'>
                            {t('products.scope.selectedOnly')}
                          </Badge>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />

            {/* Outlet assignments — visible when scope is OUTLET_SPECIFIC */}
            {form.watch('scope') === 'OUTLET_SPECIFIC' && (
              <FormField
                control={form.control}
                name='outletIds'
                render={() => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      {t('products.form.outlets')}
                    </FormLabel>
                    <div className='col-span-4 space-y-2 rounded-md border p-3'>
                      {outlets.length === 0 ? (
                        <p className='text-muted-foreground text-xs'>
                          {t('products.form.noOutlets')}
                        </p>
                      ) : (
                        outlets.map((outlet) => {
                          const checked = form
                            .watch('outletIds')
                            .includes(outlet.id)
                          return (
                            <div
                              key={outlet.id}
                              className='flex items-center gap-2'
                            >
                              <Checkbox
                                id={`outlet-${outlet.id}`}
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const current = form.getValues('outletIds')
                                  form.setValue(
                                    'outletIds',
                                    value
                                      ? [...current, outlet.id]
                                      : current.filter(
                                          (id) => id !== outlet.id
                                        ),
                                    { shouldDirty: true, shouldValidate: true }
                                  )
                                }}
                              />
                              <label
                                htmlFor={`outlet-${outlet.id}`}
                                className='cursor-pointer text-sm'
                              >
                                {outlet.name}
                                <span className='text-muted-foreground ml-1 font-sans tabular-nums text-xs'>
                                  ({outlet.code})
                                </span>
                              </label>
                            </div>
                          )
                        })
                      )}
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            )}

            {isEdit && (
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      {t('products.form.active')}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            )}

            {/* Modifier Groups Section */}
            {modifierGroups.length > 0 && (
              <div className='space-y-3 border-t pt-4'>
                <h4 className='text-sm font-medium'>
                  {t('products.form.modifierGroups')}
                </h4>
                {modifierGroups.map((mg) => {
                  const selectedIds = form.watch('modifierGroupIds')
                  const isOn = selectedIds.includes(mg.id)
                  return (
                    <div
                      key={mg.id}
                      className='flex items-center justify-between rounded-md border p-3'
                    >
                      <div>
                        <div className='text-sm font-medium'>{mg.name}</div>
                        <div className='text-muted-foreground text-xs'>
                          {mg.isRequired
                            ? t('products.form.required')
                            : t('products.form.optional')}{' '}
                          &middot;{' '}
                          {String(
                            t('products.form.selections', {
                              min: mg.minSelection,
                              max: mg.maxSelection,
                            } as never)
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={isOn}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('modifierGroupIds')
                          form.setValue(
                            'modifierGroupIds',
                            checked
                              ? [...current, mg.id]
                              : current.filter((id) => id !== mg.id),
                            { shouldDirty: true }
                          )
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Variants Section */}
            <div className='space-y-3 border-t pt-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium'>
                  {t('products.form.variants')}
                </h4>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    append({
                      name: '',
                      priceDelta: 0,
                      sortOrder: fields.length,
                    })
                  }
                >
                  <Plus size={14} className='mr-1' />
                  {t('products.form.addVariant')}
                </Button>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex items-start gap-2 rounded-md border p-3'
                >
                  <div className='flex-1 space-y-2'>
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'products.form.variantNamePlaceholder'
                              )}
                              autoComplete='off'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.priceDelta`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder={t(
                                'products.form.priceDeltaPlaceholder'
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='mt-1 shrink-0 text-status-danger'
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='product-form' disabled={isLoading}>
            {isLoading
              ? t('products.form.saving')
              : t('products.form.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
