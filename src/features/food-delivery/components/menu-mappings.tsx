import { useState } from 'react'
import { tenantGet } from '@/lib/tenant-api-client'
import { Button } from '@/components/ui/button'
import type { ModifierGroup } from '@/features/modifier-groups/api/modifier-groups.types'
import type { Product } from '@/features/products/api/products.types'
import { deliveryApi } from '../delivery.api'
import { validateMapping } from '../delivery.logic'
import {
  notifySaved,
  useDeliveryMutation,
  useDeliveryQuery,
} from '../delivery.queries'
import type { Binding, MappingInput } from '../delivery.types'
import { Choice, ErrorNotice, Field, Notice, Panel } from './shared'

export function MenuMappings({ binding }: { binding: Binding }) {
  const query = useDeliveryQuery(['mappings', binding.id], (signal) =>
    deliveryApi.mappings(binding.id, signal)
  )
  const products = useDeliveryQuery(['products', binding.outletId], (signal) =>
    tenantGet<{ data: Product[] }>(
      `/products?outletId=${encodeURIComponent(binding.outletId)}`,
      { signal }
    )
  )
  const groups = useDeliveryQuery(['modifier-groups'], async (signal) => {
    const all: ModifierGroup[] = []
    let page = 1,
      pages = 1
    do {
      const result = await tenantGet<{
        data: ModifierGroup[]
        meta: { totalPages: number }
      }>(`/modifier-groups?page=${page}&size=100`, { signal })
      all.push(...result.data)
      pages = result.meta.totalPages
      page++
    } while (page <= pages)
    return all
  })
  const [kind, setKind] = useState<'ITEM' | 'OPTION'>('ITEM')
  const [externalId, setExternalId] = useState('')
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [modifierId, setModifierId] = useState('')
  const [target, setTarget] = useState('VARIANT')
  const product = products.data?.data.find((item) => item.id === productId)
  const mutation = useDeliveryMutation(async () => {
    const mapping: MappingInput = {
      kind,
      externalId: externalId.trim(),
      ...(kind === 'ITEM'
        ? { productId, ...(variantId ? { variantId } : {}) }
        : target === 'VARIANT'
          ? { variantId }
          : { modifierId }),
    }
    validateMapping(mapping)
    return deliveryApi.map(binding.id, mapping)
  }, notifySaved)
  const productNames = new Map(
    products.data?.data.map((item) => [item.id, item.name])
  )
  const variantNames = new Map(
    products.data?.data.flatMap((product) =>
      product.variants.map(
        (variant) => [variant.id, `${product.name} / ${variant.name}`] as const
      )
    )
  )
  const modifierNames = new Map(
    groups.data?.flatMap((group) =>
      group.modifiers.map(
        (modifier) => [modifier.id, `${group.name} / ${modifier.name}`] as const
      )
    )
  )
  return (
    <Panel title='Menu mappings'>
      <p className='text-muted-foreground text-sm'>
        Match provider IDs to local products, variants, and modifiers. Saving an
        existing provider ID replaces its mapping.
      </p>
      <ErrorNotice error={query.error ?? products.error ?? groups.error} />
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <Choice
            label='Mapping kind'
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as 'ITEM' | 'OPTION')
              setVariantId('')
              setModifierId('')
            }}
          >
            <option value='ITEM'>Item</option>
            <option value='OPTION'>Option</option>
          </Choice>
          <Field
            label='Provider item / option ID'
            value={externalId}
            onChange={(event) => setExternalId(event.target.value)}
            maxLength={256}
            required
          />
          {kind === 'OPTION' && (
            <Choice
              label='Option target'
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            >
              <option value='VARIANT'>Product variant</option>
              <option value='MODIFIER'>Modifier</option>
            </Choice>
          )}
          {(kind === 'ITEM' || target === 'VARIANT') && (
            <>
              <Choice
                label='Product'
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value)
                  setVariantId('')
                }}
                required
              >
                <option value=''>Select product</option>
                {products.data?.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.sku}
                  </option>
                ))}
              </Choice>
              <Choice
                label={kind === 'ITEM' ? 'Variant (optional)' : 'Variant'}
                value={variantId}
                onChange={(event) => setVariantId(event.target.value)}
                required={kind === 'OPTION'}
              >
                <option value=''>
                  {kind === 'ITEM' ? 'No variant' : 'Select variant'}
                </option>
                {product?.variants
                  .filter((item) => item.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Choice>
            </>
          )}
          {kind === 'OPTION' && target === 'MODIFIER' && (
            <Choice
              label='Modifier'
              value={modifierId}
              onChange={(event) => setModifierId(event.target.value)}
              required
            >
              <option value=''>Select modifier</option>
              {groups.data?.flatMap((group) =>
                group.modifiers
                  .filter((item) => item.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {group.name} / {item.name}
                    </option>
                  ))
              )}
            </Choice>
          )}
        </div>
        <ErrorNotice error={mutation.error} />
        <Button
          disabled={
            mutation.isPending || products.isPending || groups.isPending
          }
        >
          Save mapping
        </Button>
      </form>
      {query.isPending ? (
        <p role='status'>Loading mappings…</p>
      ) : !query.data?.length ? (
        <Notice>No mappings saved for this outlet.</Notice>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='p-2'>Kind</th>
                <th className='p-2'>Provider ID</th>
                <th className='p-2'>Local target</th>
                <th className='p-2'>
                  <span className='sr-only'>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((mapping) => (
                <tr key={mapping.id} className='border-b'>
                  <td className='p-2'>{mapping.kind}</td>
                  <td className='p-2 break-all'>{mapping.externalId}</td>
                  <td className='p-2 break-all'>
                    {productNames.get(mapping.productId ?? '') ??
                      modifierNames.get(mapping.modifierId) ??
                      variantNames.get(mapping.variantId) ??
                      mapping.modifierId ??
                      mapping.variantId}
                    {mapping.productId && mapping.variantId && (
                      <span className='block text-xs'>
                        Variant:{' '}
                        {variantNames.get(mapping.variantId) ??
                          mapping.variantId}
                      </span>
                    )}
                  </td>
                  <td className='p-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      aria-label={`Edit mapping ${mapping.externalId}`}
                      onClick={() => {
                        setKind(mapping.kind)
                        setExternalId(mapping.externalId)
                        setProductId(
                          mapping.productId ??
                            products.data?.data.find((product) =>
                              product.variants.some(
                                (variant) => variant.id === mapping.variantId
                              )
                            )?.id ??
                            ''
                        )
                        setVariantId(mapping.variantId ?? '')
                        setModifierId(mapping.modifierId ?? '')
                        setTarget(mapping.modifierId ? 'MODIFIER' : 'VARIANT')
                        mutation.reset()
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
