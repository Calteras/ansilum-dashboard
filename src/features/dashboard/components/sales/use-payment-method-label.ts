import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCopy } from '@/hooks/use-copy'

export function usePaymentMethodLabel() {
  const { t } = useTranslation()
  const copy = useCopy()

  return useCallback(
    (method: string): string => {
      switch (method) {
        case 'CASH':
          return t('dashboard.paymentMethods.cashFull')
        case 'BANK_TRANSFER':
          return t('dashboard.paymentMethods.bankTransferFull')
        case 'CREDIT_CARD':
          return t('dashboard.paymentMethods.creditCardFull')
        case 'DEBIT_CARD':
          return t('dashboard.paymentMethods.debitCardFull')
        case 'E_WALLET':
          return t('dashboard.paymentMethods.eWalletFull')
        case 'QRIS':
          return 'QRIS'
        case 'OTHER':
          return copy('Lainnya', 'Other')
        default:
          return method
      }
    },
    [t, copy]
  )
}
