import { expect, it } from 'vitest'
import {
  detectBrand,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  parseExpiry,
} from './card-utils'

it('recognises every network Midtrans accepts', () => {
  expect(detectBrand('4811')).toBe('visa')
  expect(detectBrand('5211')).toBe('mastercard')
  expect(detectBrand('2221')).toBe('mastercard')
  expect(detectBrand('3528')).toBe('jcb')
  expect(detectBrand('3714')).toBe('amex')
  expect(detectBrand('6011')).toBeNull()
})

it('groups numbers as printed on the card', () => {
  expect(formatCardNumber('4811111111111114')).toBe('4811 1111 1111 1114')
  expect(formatCardNumber('371449635398431')).toBe('3714 496353 98431')
})

it('accepts only complete numbers that pass the checksum', () => {
  expect(isValidCardNumber('4811111111111114')).toBe(true)
  expect(isValidCardNumber('5211111111111117')).toBe(true)
  expect(isValidCardNumber('371449635398431')).toBe(true)
  expect(isValidCardNumber('4811111111111115')).toBe(false)
  expect(isValidCardNumber('481111111111')).toBe(false)
})

it('formats and validates the expiry', () => {
  expect(formatExpiry('1')).toBe('1')
  expect(formatExpiry('4')).toBe('04 / ')
  expect(formatExpiry('1228')).toBe('12 / 28')
  const now = new Date(2026, 9, 15)
  expect(parseExpiry('10 / 26', now)).toEqual({ month: '10', year: '2026' })
  expect(parseExpiry('09 / 26', now)).toBeNull()
  expect(parseExpiry('13 / 30', now)).toBeNull()
})
