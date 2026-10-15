import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCardNumber } from '../card-utils'
import {
  BRAND_LABELS,
  BRANDS,
  CARD_METHOD,
  brandMark,
  type CardField,
  type CardForm,
} from './card-form'
import { PaymentLogo } from './payment-logo'

/** Accepted brands, then number (with the detected brand inside it), expiry and security code. */
export function CardFields({
  form,
  disabled,
  idPrefix = 'card',
}: {
  form: CardForm
  disabled?: boolean
  idPrefix?: string
}) {
  const copy = useCopy()
  const { brand } = form
  const trailingMark = brandMark(brand)
  const id = (field: string) => `${idPrefix}-${field}`
  const error = (field: CardField) => form.visibleError(field)

  return (
    <>
      <div className='flex items-center gap-1.5' aria-hidden>
        {BRANDS.map((mark) => (
          <PaymentLogo
            key={mark.label}
            method={mark}
            size='sm'
            className={cn(
              'transition-opacity',
              brand && BRAND_LABELS[brand] !== mark.label && 'opacity-30'
            )}
          />
        ))}
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor={id('number')}>
          {copy('Nomor kartu', 'Card number')}
        </Label>
        <div className='relative'>
          <Input
            id={id('number')}
            name='cardnumber'
            inputMode='numeric'
            autoComplete='cc-number'
            placeholder='1234 1234 1234 1234'
            value={formatCardNumber(form.number)}
            onChange={(e) => form.setNumber(e.target.value)}
            onBlur={form.touch('number')}
            aria-invalid={!!error('number')}
            aria-describedby={error('number') ? id('number-error') : undefined}
            className='h-11 pe-16 text-base tracking-wide tabular-nums'
            disabled={disabled}
          />
          {/* The detected network replaces the generic card until the number says otherwise. */}
          <span
            className='pointer-events-none absolute inset-y-0 end-2 flex items-center'
            aria-live='polite'
          >
            {trailingMark ? (
              <PaymentLogo
                key={trailingMark.label}
                method={trailingMark}
                size='sm'
                className='animate-in fade-in-0 zoom-in-90 duration-150'
              />
            ) : (
              CARD_METHOD && (
                <PaymentLogo
                  method={CARD_METHOD}
                  size='sm'
                  className='opacity-40'
                />
              )
            )}
            <span className='sr-only'>{brand ? BRAND_LABELS[brand] : ''}</span>
          </span>
        </div>
        {error('number') && (
          <p id={id('number-error')} className='text-destructive text-sm'>
            {error('number')}
          </p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label htmlFor={id('expiry')}>
            {copy('Berlaku hingga', 'Expiry date')}
          </Label>
          <Input
            id={id('expiry')}
            name='exp-date'
            inputMode='numeric'
            autoComplete='cc-exp'
            placeholder={copy('BB / TT', 'MM / YY')}
            value={form.expiry}
            onChange={(e) => form.setExpiry(e.target.value)}
            onBlur={form.touch('expiry')}
            aria-invalid={!!error('expiry')}
            aria-describedby={error('expiry') ? id('expiry-error') : undefined}
            className='h-11 text-base tabular-nums'
            disabled={disabled}
          />
          {error('expiry') && (
            <p id={id('expiry-error')} className='text-destructive text-sm'>
              {error('expiry')}
            </p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor={id('cvc')}>
            {copy('Kode keamanan', 'Security code')}
          </Label>
          <Input
            id={id('cvc')}
            name='cvc'
            inputMode='numeric'
            autoComplete='cc-csc'
            placeholder={brand === 'amex' ? '1234' : '123'}
            value={form.cvc}
            onChange={(e) => form.setCvc(e.target.value)}
            onBlur={form.touch('cvc')}
            aria-invalid={!!error('cvc')}
            aria-describedby={error('cvc') ? id('cvc-error') : id('cvc-hint')}
            className='h-11 text-base tabular-nums'
            disabled={disabled}
          />
          {error('cvc') ? (
            <p id={id('cvc-error')} className='text-destructive text-sm'>
              {error('cvc')}
            </p>
          ) : (
            <p id={id('cvc-hint')} className='text-muted-foreground text-xs'>
              {brand === 'amex'
                ? copy('4 digit di depan kartu', '4 digits on the front')
                : copy('3 digit di belakang kartu', '3 digits on the back')}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
