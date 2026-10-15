import amexLogo from '@/assets/payment-methods/amex.svg'
import bcaLogo from '@/assets/payment-methods/bca.svg'
import bniLogo from '@/assets/payment-methods/bni.svg'
import cardLogo from '@/assets/payment-methods/card.svg'
import gopayLogo from '@/assets/payment-methods/gopay.svg'
import jcbLogo from '@/assets/payment-methods/jcb.svg'
import mandiriLogo from '@/assets/payment-methods/mandiri.svg'
import mastercardLogo from '@/assets/payment-methods/mastercard.svg'
import qrisLogo from '@/assets/payment-methods/qris.svg'
import visaLogo from '@/assets/payment-methods/visa.svg'
import type { PaymentType } from '@/features/settings/subscription/subscription.types'

type Copy = readonly [id: string, en: string]

export interface PaymentMethod {
  value: PaymentType
  label: string
  logo: string
  /** Networks accepted under one method, shown instead of the method's own mark. */
  brands?: readonly { label: string; logo: string; bleed?: boolean }[]
  /** Display name and button text when the brand label alone reads badly. */
  name?: Copy
  cta?: Copy
  detail: Copy
  title: Copy
  steps: readonly Copy[]
}

export interface PaymentMethodGroup {
  id: 'card' | 'qris' | 'ewallet' | 'virtual-account'
  label: Copy
  /** Mirrors the backend payment window so customers know the deadline before choosing. */
  window: Copy
  methods: readonly PaymentMethod[]
}

const BANK_STEPS = (bank: string): readonly Copy[] => [
  [
    `Buka aplikasi ${bank}, internet banking, atau ATM.`,
    `Open the ${bank} app, internet banking or an ATM.`,
  ],
  ['Pilih transfer ke virtual account.', 'Choose transfer to virtual account.'],
  [
    'Masukkan nomor di atas. Nama dan jumlah akan muncul otomatis.',
    'Enter the number above. The name and amount fill in for you.',
  ],
  [
    'Pastikan jumlahnya sama, lalu konfirmasi.',
    'Check the amount matches, then confirm.',
  ],
]

export const PAYMENT_METHOD_GROUPS: readonly PaymentMethodGroup[] = [
  {
    id: 'card',
    label: ['Kartu kredit atau debit', 'Credit or debit card'],
    window: ['Bayar dalam 30 menit', 'Pay within 30 minutes'],
    methods: [
      {
        value: 'CREDIT_CARD',
        label: 'Card',
        name: ['Kartu kredit atau debit', 'Credit or debit card'],
        cta: ['Lanjut ke pembayaran kartu', 'Continue to card payment'],
        logo: cardLogo,
        // Midtrans card networks. American Express works once Midtrans enables it for the merchant.
        brands: [
          { label: 'Visa', logo: visaLogo },
          { label: 'Mastercard', logo: mastercardLogo },
          { label: 'JCB', logo: jcbLogo },
          // Amex's mark is a solid square, so it fills the chip instead of floating in it.
          { label: 'American Express', logo: amexLogo, bleed: true },
        ],
        detail: [
          'Visa, Mastercard, JCB, dan American Express',
          'Visa, Mastercard, JCB and American Express',
        ],
        title: ['Bayar dengan kartu', 'Pay by card'],
        // The form explains itself; 3-D Secure is introduced where it happens.
        steps: [],
      },
    ],
  },
  {
    id: 'qris',
    label: ['QRIS', 'QRIS'],
    window: ['Bayar dalam 15 menit', 'Pay within 15 minutes'],
    methods: [
      {
        value: 'QRIS',
        label: 'QRIS',
        logo: qrisLogo,
        detail: [
          'GoPay, OVO, DANA, ShopeePay, atau aplikasi bank',
          'GoPay, OVO, DANA, ShopeePay or any banking app',
        ],
        title: ['Pindai untuk membayar', 'Scan to pay'],
        steps: [
          [
            'Buka aplikasi e-wallet atau bank yang mendukung QRIS.',
            'Open any e-wallet or banking app that supports QRIS.',
          ],
          ['Pindai kode QR di atas.', 'Scan the QR code above.'],
          ['Periksa jumlahnya, lalu bayar.', 'Check the amount, then pay.'],
        ],
      },
    ],
  },
  {
    id: 'ewallet',
    label: ['E-wallet', 'E-wallet'],
    window: ['Bayar dalam 15 menit', 'Pay within 15 minutes'],
    methods: [
      {
        value: 'GOPAY',
        label: 'GoPay',
        logo: gopayLogo,
        detail: [
          'Langsung dari aplikasi Gojek atau GoPay',
          'Straight from the Gojek or GoPay app',
        ],
        title: ['Bayar dengan GoPay', 'Pay with GoPay'],
        steps: [
          [
            'Buka GoPay di ponsel ini, atau pindai kode QR dengan aplikasi Gojek.',
            'Open GoPay on this phone, or scan the QR code with the Gojek app.',
          ],
          ['Periksa jumlahnya, lalu bayar.', 'Check the amount, then pay.'],
        ],
      },
    ],
  },
  {
    id: 'virtual-account',
    label: ['Virtual account', 'Virtual account'],
    window: ['Bayar dalam 24 jam', 'Pay within 24 hours'],
    methods: [
      {
        value: 'BANK_TRANSFER_BCA',
        label: 'BCA Virtual Account',
        logo: bcaLogo,
        detail: [
          'm-BCA, KlikBCA, atau ATM BCA',
          'm-BCA, KlikBCA or any BCA ATM',
        ],
        title: [
          'Transfer ke virtual account BCA',
          'Transfer to your BCA virtual account',
        ],
        steps: BANK_STEPS('BCA'),
      },
      {
        value: 'BANK_TRANSFER_BNI',
        label: 'BNI Virtual Account',
        logo: bniLogo,
        detail: [
          'BNI Mobile, internet banking, atau ATM',
          'BNI Mobile, internet banking or ATM',
        ],
        title: [
          'Transfer ke virtual account BNI',
          'Transfer to your BNI virtual account',
        ],
        steps: BANK_STEPS('BNI'),
      },
      {
        value: 'BANK_TRANSFER_MANDIRI',
        label: 'Mandiri Bill Payment',
        logo: mandiriLogo,
        detail: [
          'Livin’ by Mandiri atau ATM Mandiri',
          'Livin’ by Mandiri or any Mandiri ATM',
        ],
        title: [
          'Bayar lewat Mandiri Bill Payment',
          'Pay with Mandiri Bill Payment',
        ],
        steps: [
          [
            'Buka Livin’ by Mandiri atau ATM Mandiri, lalu pilih Bayar.',
            'Open Livin’ by Mandiri or a Mandiri ATM and choose Pay.',
          ],
          [
            'Pilih Multipayment dan masukkan kode perusahaan.',
            'Choose Multipayment and enter the biller code.',
          ],
          [
            'Masukkan kode tagihan, periksa jumlahnya, lalu konfirmasi.',
            'Enter the bill key, check the amount, then confirm.',
          ],
        ],
      },
    ],
  },
]

export const PAYMENT_METHODS = PAYMENT_METHOD_GROUPS.flatMap(
  (group) => group.methods
)

export function findPaymentMethod(value: string | undefined) {
  return PAYMENT_METHODS.find((method) => method.value === value)
}
