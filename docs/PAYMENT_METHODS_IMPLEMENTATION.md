# Implementing Additional Payment Methods (Midtrans)

Currently only **Bank Transfer VA** (BCA, BNI, Mandiri) is supported. This guide covers adding **Credit Card**, **QRIS**, **GoPay**, and other e-wallets.

---

## Payment Method Overview

| Method | Midtrans `payment_type` | Returns | Frontend Handling |
|---|---|---|---|
| BCA VA | `bank_transfer` (bank: bca) | `vaNumber` | Display VA number (current) |
| BNI VA | `bank_transfer` (bank: bni) | `vaNumber` | Display VA number (current) |
| Mandiri VA | `echannel` | `billKey` + `billerCode` | Display bill key |
| QRIS | `qris` | `qrCodeUrl` / `qrString` | Display QR code image |
| GoPay | `gopay` | `qrCodeUrl` + `deeplinkUrl` | QR on desktop, deeplink on mobile |
| Credit Card | `credit_card` | `snapToken` + `snapRedirectUrl` | Snap.js popup or redirect |

> **OVO, Dana, ShopeePay** — Users pay via these apps by scanning the **QRIS** QR code. No separate integration needed.

---

## Step-by-Step Implementation

### Step 1: Backend — Extend `POST /subscriptions/subscribe`

Update the backend subscribe handler to support new `paymentType` values and return the appropriate fields.

**Accept these `paymentType` values:**
```
BANK_TRANSFER_BCA, BANK_TRANSFER_BNI, BANK_TRANSFER_MANDIRI,
QRIS, GOPAY, CREDIT_CARD
```

**Map to Midtrans Core API `payment_type`:**
```ts
// Backend mapping
const MIDTRANS_PAYMENT_MAP = {
  BANK_TRANSFER_BCA:     { payment_type: 'bank_transfer', bank_transfer: { bank: 'bca' } },
  BANK_TRANSFER_BNI:     { payment_type: 'bank_transfer', bank_transfer: { bank: 'bni' } },
  BANK_TRANSFER_MANDIRI: { payment_type: 'echannel', echannel: { bill_info1: 'Payment', bill_info2: 'Subscription' } },
  QRIS:                  { payment_type: 'qris' },
  GOPAY:                 { payment_type: 'gopay', gopay: { enable_callback: true, callback_url: 'https://yourdomain.com/payment/finish' } },
  CREDIT_CARD:           null, // Use Snap API instead (see Step 2)
}
```

**Extend the response to include new fields:**
```ts
// The subscribe endpoint should return ALL of these (null when not applicable)
{
  orderId: string
  orderNumber: string
  amount: number
  paymentType: string
  midtransOrderId: string
  expiresAt: string

  // Bank Transfer
  vaNumber: string | null       // BCA, BNI
  billKey: string | null        // Mandiri
  billerCode: string | null     // Mandiri

  // QRIS
  qrCodeUrl: string | null      // URL to QR code image
  qrString: string | null       // Raw QR string (optional, for client-side generation)

  // GoPay
  deeplinkUrl: string | null    // gojek://gopay/... deeplink for mobile

  // Credit Card (Snap)
  snapToken: string | null      // Snap.js token
  snapRedirectUrl: string | null // Snap redirect URL

  // General
  paymentUrl: string | null
}
```

**Extract from Midtrans response:**
```ts
// After calling Midtrans Core API charge:

// QRIS
const qrAction = midtransResponse.actions?.find(a => a.name === 'generate-qr-code')
const qrCodeUrl = qrAction?.url ?? null

// GoPay
const qrAction = midtransResponse.actions?.find(a => a.name === 'generate-qr-code')
const deeplinkAction = midtransResponse.actions?.find(a => a.name === 'deeplink-redirect')
const qrCodeUrl = qrAction?.url ?? null
const deeplinkUrl = deeplinkAction?.url ?? null
```

---

### Step 2: Backend — Credit Card via Snap API

Credit card requires tokenization and 3DS. The easiest approach is using **Midtrans Snap** instead of Core API.

```ts
// Backend: Create Snap transaction for credit card
import midtransClient from 'midtrans-client'

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
})

const snapResponse = await snap.createTransaction({
  transaction_details: {
    order_id: order.midtransOrderId,
    gross_amount: order.amount,
  },
  credit_card: {
    secure: true, // Enable 3DS
  },
})

// Returns: { token: 'snap-token-xxx', redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/...' }
```

Return `snapToken` and `snapRedirectUrl` in the subscribe response.

---

### Step 3: Backend — Extend `GET /subscriptions/orders/:id`

Add the new fields to the order response so polling can display the right info:

```ts
{
  id: string
  orderNumber: string
  amount: string
  paymentType: string        // The original paymentType (QRIS, GOPAY, etc.)
  paymentStatus: 'PENDING' | 'SETTLEMENT' | 'EXPIRE' | 'CANCEL'
  vaNumber: string | null
  billKey: string | null
  billerCode: string | null
  qrCodeUrl: string | null
  deeplinkUrl: string | null
  expiresAt: string
  paidAt: string | null
}
```

---

### Step 4: Backend — Webhook Handler

The existing webhook already handles `SETTLEMENT` etc. Just make sure it handles all `payment_type` values from Midtrans:

```ts
// The webhook payload will have different payment_type values:
// 'bank_transfer', 'echannel', 'qris', 'gopay', 'credit_card'
// But your internal paymentStatus logic stays the same:
// transaction_status: 'settlement' → paymentStatus = 'SETTLEMENT'
// transaction_status: 'expire'     → paymentStatus = 'EXPIRE'
// etc.
```

Also fix the current 500 error — the webhook handler is sending two responses ("Cannot set headers after they are sent to the client"). Ensure only one `res.json()` or `res.status().send()` call per request.

---

### Step 5: Frontend — Update Types

**File: `src/features/settings/subscription/subscription.types.ts`**

Update `SubscribeResponse` and `SubscriptionOrderResponse`:

```ts
export interface SubscribeResponse {
  data: {
    orderId: string
    orderNumber: string
    amount: number
    paymentType: string
    midtransOrderId: string
    expiresAt: string
    // Bank Transfer
    vaNumber: string | null
    billKey: string | null
    billerCode: string | null
    // QRIS / GoPay
    qrCodeUrl: string | null
    deeplinkUrl: string | null
    // Credit Card (Snap)
    snapToken: string | null
    snapRedirectUrl: string | null
    // General
    paymentUrl: string | null
  }
  meta: Record<string, unknown>
}

export interface SubscriptionOrderResponse {
  data: {
    id: string
    orderNumber: string
    amount: string
    paymentType: string
    paymentStatus: PaymentStatus
    vaNumber: string | null
    billKey: string | null
    billerCode: string | null
    qrCodeUrl: string | null
    deeplinkUrl: string | null
    expiresAt: string
    paidAt: string | null
    midtransResponse: Record<string, unknown> | null
  }
  meta: Record<string, unknown>
}
```

---

### Step 6: Frontend — Update Payment Method Options

**File: `src/features/settings/subscription/components/payment-method-dialog.tsx`**

Group payment methods by category:

```tsx
const PAYMENT_METHOD_GROUPS = [
  {
    label: 'E-Wallet & QRIS',
    methods: [
      { value: 'QRIS', label: 'QRIS', description: 'Pay with GoPay, OVO, Dana, ShopeePay, or any QRIS app' },
      { value: 'GOPAY', label: 'GoPay', description: 'Pay directly via GoPay app' },
    ],
  },
  {
    label: 'Credit / Debit Card',
    methods: [
      { value: 'CREDIT_CARD', label: 'Credit / Debit Card', description: 'Visa, Mastercard, JCB' },
    ],
  },
  {
    label: 'Bank Transfer',
    methods: [
      { value: 'BANK_TRANSFER_BCA', label: 'BCA Virtual Account' },
      { value: 'BANK_TRANSFER_BNI', label: 'BNI Virtual Account' },
      { value: 'BANK_TRANSFER_MANDIRI', label: 'Mandiri Bill Payment' },
    ],
  },
] as const
```

---

### Step 7: Frontend — Update Payment Instructions Dialog

**File: `src/features/settings/subscription/components/payment-instructions-dialog.tsx`**

The dialog currently only shows VA number. It needs to handle different payment types:

```tsx
// Determine which payment UI to show based on paymentType
const paymentType = order?.paymentType ?? initialPaymentType

function renderPaymentDetails() {
  // Bank Transfer — show VA number (existing)
  if (paymentType?.startsWith('BANK_TRANSFER')) {
    return <VAPaymentSection vaNumber={vaNumber} onCopy={copyToClipboard} />
  }

  // Mandiri — show bill key + biller code
  if (paymentType === 'BANK_TRANSFER_MANDIRI') {
    return <MandiriPaymentSection billKey={billKey} billerCode={billerCode} onCopy={copyToClipboard} />
  }

  // QRIS — show QR code image
  if (paymentType === 'QRIS') {
    return <QRISPaymentSection qrCodeUrl={qrCodeUrl} />
  }

  // GoPay — QR on desktop, deeplink button on mobile
  if (paymentType === 'GOPAY') {
    return <GopayPaymentSection qrCodeUrl={qrCodeUrl} deeplinkUrl={deeplinkUrl} />
  }

  // Credit Card — handled separately via Snap (should not reach here)
  return null
}
```

**QRIS section example:**
```tsx
function QRISPaymentSection({ qrCodeUrl }: { qrCodeUrl: string | null }) {
  if (!qrCodeUrl) return null
  return (
    <div className='space-y-2'>
      <span className='text-muted-foreground text-sm'>
        Scan with any e-wallet app (GoPay, OVO, Dana, ShopeePay)
      </span>
      <div className='flex justify-center p-4 bg-white rounded-lg'>
        <img src={qrCodeUrl} alt='QRIS QR Code' className='h-48 w-48' />
      </div>
    </div>
  )
}
```

**GoPay section example:**
```tsx
function GopayPaymentSection({ qrCodeUrl, deeplinkUrl }: { qrCodeUrl: string | null; deeplinkUrl: string | null }) {
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

  if (isMobile && deeplinkUrl) {
    return (
      <div className='space-y-2'>
        <span className='text-muted-foreground text-sm'>Open GoPay to complete payment</span>
        <Button className='w-full' onClick={() => window.location.href = deeplinkUrl}>
          Open GoPay App
        </Button>
      </div>
    )
  }

  if (qrCodeUrl) {
    return (
      <div className='space-y-2'>
        <span className='text-muted-foreground text-sm'>Scan with GoPay app</span>
        <div className='flex justify-center p-4 bg-white rounded-lg'>
          <img src={qrCodeUrl} alt='GoPay QR Code' className='h-48 w-48' />
        </div>
      </div>
    )
  }

  return null
}
```

---

### Step 8: Frontend — Credit Card via Snap.js

Credit card uses Midtrans Snap popup instead of the payment instructions dialog.

**a) Add Snap.js script to `index.html`:**
```html
<!-- Sandbox -->
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_SANDBOX_CLIENT_KEY"></script>

<!-- Production -->
<script src="https://app.midtrans.com/snap/snap.js" data-client-key="YOUR_PRODUCTION_CLIENT_KEY"></script>
```

**b) Add type declaration for Snap (`src/types/midtrans.d.ts`):**
```ts
interface SnapResult {
  order_id: string
  transaction_status: string
  payment_type: string
}

interface MidtransSnap {
  pay(token: string, options?: {
    onSuccess?: (result: SnapResult) => void
    onPending?: (result: SnapResult) => void
    onError?: (result: SnapResult) => void
    onClose?: () => void
  }): void
}

interface Window {
  snap: MidtransSnap
}
```

**c) Handle in `index.tsx` after subscribe response:**
```tsx
function handlePaymentSubmit(paymentType: string) {
  subscribeMutation.mutate(
    { tier: selectedPlan.tier, billingCycle: isYearly ? 'YEARLY' : 'MONTHLY', paymentType },
    {
      onSuccess: (response) => {
        if (paymentType === 'CREDIT_CARD' && response.data.snapToken) {
          // Open Snap popup for credit card
          window.snap.pay(response.data.snapToken, {
            onSuccess: () => {
              toast.success('Payment successful!')
              queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() })
            },
            onPending: () => {
              toast.info('Payment pending, please complete the payment.')
            },
            onError: () => {
              toast.error('Payment failed. Please try again.')
            },
            onClose: () => {
              // User closed popup without finishing
            },
          })
        } else {
          // Show payment instructions dialog (VA, QRIS, GoPay)
          setOrderData({ ... })
          setPaymentDialogOpen(false)
          setInstructionsDialogOpen(true)
        }
      },
    }
  )
}
```

---

### Step 9: Frontend — Pass `paymentType` to Instructions Dialog

Update `orderData` state and `PaymentInstructionsDialog` props to include all new fields:

```tsx
const [orderData, setOrderData] = useState<{
  orderId: string
  orderNumber: string
  amount: number
  expiresAt: string
  paymentType: string
  vaNumber: string | null
  billKey: string | null
  billerCode: string | null
  qrCodeUrl: string | null
  deeplinkUrl: string | null
} | null>(null)
```

---

## Summary Checklist

### Backend
- [ ] Map new `paymentType` values to Midtrans Core API `payment_type`
- [ ] Handle QRIS charge → extract `qrCodeUrl` from `actions`
- [ ] Handle GoPay charge → extract `qrCodeUrl` + `deeplinkUrl` from `actions`
- [ ] Handle Credit Card → use Snap API, return `snapToken` + `snapRedirectUrl`
- [ ] Extend subscribe response with new fields (`qrCodeUrl`, `deeplinkUrl`, `snapToken`, etc.)
- [ ] Extend order response with new fields
- [ ] Ensure webhook handles all `payment_type` values from Midtrans
- [ ] Fix webhook 500 error (double response)

### Frontend
- [ ] Update `SubscribeResponse` and `SubscriptionOrderResponse` types
- [ ] Add new payment methods to `payment-method-dialog.tsx` (grouped by category)
- [ ] Update `payment-instructions-dialog.tsx` to render QR code, deeplink, and VA conditionally
- [ ] Add Snap.js script to `index.html`
- [ ] Add `src/types/midtrans.d.ts` type declaration
- [ ] Handle Snap popup flow for credit card in `index.tsx`
- [ ] Pass `paymentType` through `orderData` state to instructions dialog
- [ ] Test each payment method in Midtrans sandbox

### Testing (Sandbox)
- Midtrans sandbox dashboard: https://dashboard.sandbox.midtrans.com
- Use test card numbers from: https://docs.midtrans.com/docs/testing-payment-on-sandbox
- Simulate VA payment via sandbox simulator
- Simulate QRIS/GoPay via sandbox simulator
