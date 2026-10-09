interface SnapResult {
  order_id: string
  transaction_status: string
  payment_type: string
}

interface MidtransSnap {
  pay(
    token: string,
    options?: {
      onSuccess?: (result: SnapResult) => void
      onPending?: (result: SnapResult) => void
      onError?: (result: SnapResult) => void
      onClose?: () => void
    }
  ): void
}

interface Window {
  snap: MidtransSnap
}
