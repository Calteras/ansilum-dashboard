import { useId, useMemo, useRef, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Check, Minus, Plus } from '@/components/icons'
import type { MenuOptionGroup, MenuProduct } from '../api/storefront.types'
import { accentButton } from '../lib/brand'
import { useStoreBrand } from '../lib/brand-context'
import { MAX_LINE_QUANTITY, unitPriceMinor, type CartLine } from '../lib/cart'

const money = (minor: number) => formatMoney(minor / 100)

function groupRule(
  group: MenuOptionGroup,
  copy: (id: string, en: string) => string
) {
  const { minSelection: min, maxSelection: max } = group
  if (max <= 1)
    return min >= 1
      ? copy('Wajib, pilih 1', 'Required, choose 1')
      : copy('Opsional', 'Optional')
  if (min === 0)
    return copy(`Opsional, hingga ${max}`, `Optional, up to ${max}`)
  if (min === max) return copy(`Wajib, pilih ${min}`, `Required, choose ${min}`)
  return copy(`Wajib, pilih ${min}–${max}`, `Required, choose ${min}–${max}`)
}

function defaults(product: MenuProduct) {
  return product.modifierGroups.flatMap((g) =>
    g.options
      .filter((o) => o.isDefault && o.available)
      .slice(0, g.maxSelection)
      .map((o) => o.id)
  )
}

/** Choose variant, options, notes and quantity; the same rules the register uses. */
export function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
  product: MenuProduct | null
  onClose: () => void
  onAdd: (line: Omit<CartLine, 'key'>) => void
}) {
  const isMobile = useIsMobile()
  const brand = useStoreBrand()
  return (
    <Sheet open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        style={brand}
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'sf gap-0 overflow-hidden p-0',
          isMobile
            ? 'max-h-[92svh] rounded-t-[28px]'
            : 'w-full sm:max-w-md sm:rounded-s-[28px]'
        )}
      >
        {isMobile && (
          <span
            aria-hidden
            className='bg-border absolute top-2.5 left-1/2 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full'
          />
        )}
        {product && (
          <ProductForm key={product.id} product={product} onAdd={onAdd} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ProductForm({
  product,
  onAdd,
}: {
  product: MenuProduct
  onAdd: (line: Omit<CartLine, 'key'>) => void
}) {
  const copy = useCopy()
  const notesId = useId()
  const groupRefs = useRef(new Map<string, HTMLFieldSetElement>())
  const firstVariant = product.variants.find((v) => v.available)?.id ?? null
  const [variantId, setVariantId] = useState<string | null>(firstVariant)
  const [selected, setSelected] = useState<string[]>(() => defaults(product))
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [nudge, setNudge] = useState<{ group: string; at: number } | null>(null)

  const satisfied = (group: MenuOptionGroup) => {
    const count = group.options.filter((o) => selected.includes(o.id)).length
    return count >= group.minSelection && count <= group.maxSelection
  }
  const unmet = useMemo(
    () => product.modifierGroups.find((g) => !satisfied(g)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, selected]
  )
  const unit = unitPriceMinor(product, variantId, selected)

  const toggle = (group: MenuOptionGroup, optionId: string) => {
    const inGroup = group.options.map((o) => o.id)
    setSelected((current) => {
      if (group.maxSelection <= 1) {
        const others = current.filter((id) => !inGroup.includes(id))
        const was = current.includes(optionId)
        return was && group.minSelection === 0 ? others : [...others, optionId]
      }
      if (current.includes(optionId))
        return current.filter((id) => id !== optionId)
      const count = current.filter((id) => inGroup.includes(id)).length
      return count >= group.maxSelection ? current : [...current, optionId]
    })
  }

  const add = () => {
    if (product.soldOut) return
    if (unmet) {
      // Point at the choice that is missing instead of a silent disabled button.
      setNudge({ group: unmet.id, at: Date.now() })
      groupRefs.current
        .get(unmet.id)
        ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      return
    }
    const variant = product.variants.find((v) => v.id === variantId)
    const options = product.modifierGroups
      .flatMap((g) => g.options)
      .filter((o) => selected.includes(o.id))
    onAdd({
      productId: product.id,
      variantId,
      modifierIds: selected,
      quantity,
      notes: notes.trim(),
      name: product.name,
      variantName: variant?.name ?? null,
      optionNames: options.map((o) => o.name),
      unitPriceMinor: unit,
    })
  }

  return (
    <>
      <div className='overflow-y-auto overscroll-contain'>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=''
            className='sf-fade aspect-[4/3] w-full object-cover'
          />
        ) : (
          <div className='h-6' />
        )}
        <SheetHeader className='gap-1.5 px-5 pt-5 pb-3'>
          <SheetTitle className='pe-8 text-[22px] leading-tight font-extrabold tracking-tight'>
            {product.name}
          </SheetTitle>
          <SheetDescription
            className={cn(
              'text-[15px] leading-6',
              !product.description && 'sr-only'
            )}
          >
            {product.description ||
              copy('Pilih sesuai selera', 'Make it yours')}
          </SheetDescription>
          <p className='pt-1 text-[17px] font-bold tabular-nums'>
            {money(product.priceMinor)}
          </p>
        </SheetHeader>

        {product.variants.length > 0 && (
          <fieldset className='px-5 py-4'>
            <legend className='flex w-full items-center justify-between pb-3'>
              <span className='text-[16px] font-bold'>
                {copy('Pilihan', 'Choose one')}
              </span>
              <RuleChip done label={copy('Wajib', 'Required')} />
            </legend>
            <div className='space-y-2'>
              {product.variants.map((variant) => (
                <OptionRow
                  key={variant.id}
                  type='radio'
                  name={`variant-${product.id}`}
                  label={variant.name}
                  price={variant.priceDeltaMinor}
                  checked={variantId === variant.id}
                  disabled={!variant.available}
                  onChange={() => setVariantId(variant.id)}
                />
              ))}
            </div>
          </fieldset>
        )}

        {product.modifierGroups.map((group) => {
          const done = satisfied(group)
          const nudged = nudge?.group === group.id && !done
          return (
            <fieldset
              key={group.id}
              ref={(el) => {
                if (el) groupRefs.current.set(group.id, el)
              }}
              className='border-t px-5 py-4'
              aria-describedby={`${group.id}-rule`}
            >
              <legend className='flex w-full items-center justify-between gap-3 pb-3'>
                <span className='text-[16px] font-bold'>{group.name}</span>
                <RuleChip
                  id={`${group.id}-rule`}
                  done={done && group.minSelection > 0}
                  label={groupRule(group, copy)}
                />
              </legend>
              <div
                key={nudged ? nudge.at : 'still'}
                className={cn('space-y-2', nudged && 'sf-shake')}
              >
                {group.options.map((option) => (
                  <OptionRow
                    key={option.id}
                    type={group.maxSelection <= 1 ? 'radio' : 'checkbox'}
                    name={`group-${group.id}`}
                    label={option.name}
                    price={option.priceDeltaMinor}
                    checked={selected.includes(option.id)}
                    disabled={!option.available}
                    onChange={() => toggle(group, option.id)}
                  />
                ))}
              </div>
              {nudged && (
                <p
                  role='alert'
                  className='sf-fade mt-2 text-[13px] font-medium text-[var(--store-accent-text)]'
                >
                  {copy(
                    `Pilih ${group.name} untuk melanjutkan.`,
                    `Choose ${group.name} to continue.`
                  )}
                </p>
              )}
            </fieldset>
          )
        })}

        <div className='border-t px-5 py-4 pb-6'>
          <label htmlFor={notesId} className='text-[16px] font-bold'>
            {copy('Catatan', 'Note')}{' '}
            <span className='text-fg-muted text-[13px] font-normal'>
              {copy('opsional', 'optional')}
            </span>
          </label>
          <Textarea
            id={notesId}
            value={notes}
            maxLength={120}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={copy(
              'Contoh: jangan terlalu manis',
              'e.g. not too sweet'
            )}
            className='mt-2 resize-none rounded-xl text-base'
          />
        </div>
      </div>

      <div className='bg-background flex items-center gap-3 border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'>
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={MAX_LINE_QUANTITY}
          label={product.name}
        />
        <Button
          type='button'
          size='lg'
          onClick={add}
          disabled={product.soldOut}
          aria-describedby={unmet ? `${unmet.id}-rule` : undefined}
          className={cn(
            'sf-press h-12 flex-1 justify-between rounded-full px-5 text-[15px] font-bold',
            accentButton
          )}
        >
          <span>
            {product.soldOut
              ? copy('Habis', 'Sold out')
              : copy('Tambah', 'Add to cart')}
          </span>
          <span key={unit * quantity} className='sf-fade tabular-nums'>
            {money(unit * quantity)}
          </span>
        </Button>
      </div>
    </>
  )
}

function RuleChip({
  id,
  label,
  done,
}: {
  id?: string
  label: string
  done: boolean
}) {
  return (
    <span
      id={id}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors',
        done
          ? 'bg-[var(--leaf-soft)] text-[var(--status-success)]'
          : 'bg-surface-subtle text-fg-secondary'
      )}
    >
      {done && <Check size={12} className='sf-pop' aria-hidden />}
      {label}
    </span>
  )
}

function OptionRow({
  type,
  name,
  label,
  price,
  checked,
  disabled,
  onChange,
}: {
  type: 'radio' | 'checkbox'
  name: string
  label: string
  price: number
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  const copy = useCopy()
  return (
    <label
      className={cn(
        'sf-option flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 text-[15px]',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        onClick={(e) => {
          // A selected optional radio can be cleared by tapping it again.
          if (type === 'radio' && checked) {
            e.preventDefault()
            onChange()
          }
        }}
        className='peer sr-only'
      />
      <span
        aria-hidden
        className={cn(
          'sf-indicator flex size-[22px] shrink-0 items-center justify-center border-2 border-[var(--input)]',
          type === 'radio' ? 'rounded-full' : 'rounded-md'
        )}
      >
        <Check size={13} />
      </span>
      <span className='flex-1 font-medium'>{label}</span>
      <span className='text-fg-secondary tabular-nums'>
        {disabled ? copy('Habis', 'Sold out') : price ? `+${money(price)}` : ''}
      </span>
    </label>
  )
}

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  label,
  size = 'lg',
}: {
  value: number
  onChange: (value: number) => void
  max: number
  min?: number
  label: string
  size?: 'lg' | 'sm'
}) {
  const copy = useCopy()
  const box = size === 'lg' ? 'size-12' : 'size-9'
  const button = cn(
    box,
    'sf-press flex items-center justify-center rounded-full disabled:opacity-35 hover:bg-surface-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'
  )
  return (
    <div
      className='bg-surface-subtle flex items-center rounded-full'
      role='group'
      aria-label={copy(`Jumlah ${label}`, `${label} quantity`)}
    >
      <button
        type='button'
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={copy('Kurangi satu', 'Decrease')}
      >
        <Minus size={size === 'lg' ? 18 : 15} />
      </button>
      <span
        key={value}
        className='sf-pop min-w-7 text-center font-bold tabular-nums'
        aria-live='polite'
      >
        {value}
      </span>
      <button
        type='button'
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={copy('Tambah satu', 'Increase')}
      >
        <Plus size={size === 'lg' ? 18 : 15} />
      </button>
    </div>
  )
}
