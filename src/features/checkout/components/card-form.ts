import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import {
  cvcLength,
  detectBrand,
  formatExpiry,
  isValidCardNumber,
  maxCardLength,
  parseExpiry,
  type CardBrand,
} from '../card-utils'
import { findPaymentMethod } from '../payment-methods'

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  jcb: 'JCB',
  amex: 'American Express',
}
export const CARD_METHOD = findPaymentMethod('CREDIT_CARD')
export const BRANDS = CARD_METHOD?.brands ?? []

/** The logo for a card brand, or the generic card when the brand is unknown. */
export function brandMark(brand: string | null | undefined) {
  const label = brand ? BRAND_LABELS[brand as CardBrand] : undefined
  return BRANDS.find((mark) => mark.label === label)
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')
export type CardField = 'number' | 'expiry' | 'cvc'
type Field = CardField

/** State and validation for card entry; the details live only in this component's memory. */
export function useCardForm() {
  const copy = useCopy()
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const brand = detectBrand(number)
  const errors: Record<Field, string> = {
    number: !number
      ? copy('Masukkan nomor kartu.', 'Enter your card number.')
      : !brand
        ? copy(
            'Kami menerima Visa, Mastercard, JCB, dan American Express.',
            'We accept Visa, Mastercard, JCB and American Express.'
          )
        : !isValidCardNumber(number)
          ? copy(
              'Nomor kartu ini tidak valid.',
              'This card number isn’t valid.'
            )
          : '',
    expiry: !expiry
      ? copy('Masukkan tanggal kedaluwarsa.', 'Enter the expiry date.')
      : !parseExpiry(expiry)
        ? copy(
            'Tanggal ini tidak valid atau sudah lewat.',
            'This date is invalid or has passed.'
          )
        : '',
    cvc:
      cvc.length !== cvcLength(brand)
        ? copy(
            `Masukkan ${cvcLength(brand)} digit kode keamanan.`,
            `Enter the ${cvcLength(brand)}-digit security code.`
          )
        : '',
  }

  return {
    number,
    expiry,
    cvc,
    brand,
    setNumber: (value: string) => {
      const digits = digitsOnly(value)
      setNumber(digits.slice(0, maxCardLength(detectBrand(digits))))
    },
    setExpiry: (value: string) =>
      setExpiry((current) =>
        value.length < current.length
          ? value.replace(/ \/ ?$/, '')
          : formatExpiry(value)
      ),
    setCvc: (value: string) =>
      setCvc(digitsOnly(value).slice(0, cvcLength(brand))),
    visibleError: (field: Field) =>
      (touched[field] || submitted) && errors[field] ? errors[field] : '',
    touch: (field: Field) => () =>
      setTouched((current) => ({ ...current, [field]: true })),
    /** Marks the form submitted and returns the card for Midtrans, or null if invalid. */
    submit(): MidtransCardData | null {
      setSubmitted(true)
      const exp = parseExpiry(expiry)
      if (errors.number || errors.cvc || !exp) return null
      return {
        card_number: number,
        card_exp_month: exp.month,
        card_exp_year: exp.year,
        card_cvv: cvc,
      }
    },
    /** Forget the details once Midtrans has them. */
    clear() {
      setNumber('')
      setExpiry('')
      setCvc('')
    },
  }
}

export type CardForm = ReturnType<typeof useCardForm>
