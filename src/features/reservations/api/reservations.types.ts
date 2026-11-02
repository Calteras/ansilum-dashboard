export type ReservationStatus = 'RESERVED' | 'OPEN' | 'CLOSED' | 'VOIDED'

export interface ReservationItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  discountAmount: number
  subtotal: number
  notes?: string
}

export interface ReservationOutlet {
  id: string
  name: string
  code: string
}

export interface ReservationCashier {
  id: string
  name: string
  employeeNo: string
}

export interface ReservationPayment {
  id: string
  paymentMethod: string
  amount: number
}

export interface Reservation {
  id: string
  localUuid: string
  outletId: string
  cashierId: string
  transactionNo: string
  transactionDate: string
  transactionType: string
  status: ReservationStatus
  subtotal: number
  discountAmount: number
  discountPercent: number
  taxAmount: number
  serviceCharge: number
  grandTotal: number
  customerName: string
  customerPhone: string
  notes?: string
  tableNumber?: string
  reservationDate: string
  reservedAt: string
  fulfilledAt?: string
  depositAmount: number
  voidedAt?: string
  voidReason?: string
  closedAt?: string
  items: ReservationItem[]
  outlet: ReservationOutlet
  cashier: ReservationCashier
  payments: ReservationPayment[]
}

export interface CreateReservationItemRequest {
  productId: string
  quantity: number
  discountAmount?: number
  notes?: string
}

export interface CreateReservationRequest {
  localUuid: string
  outletId: string
  cashierId: string
  items: CreateReservationItemRequest[]
  discountAmount?: number
  discountPercent?: number
  customerName: string
  customerPhone: string
  /** The table from the outlet layout; the server refuses overlapping bookings. */
  tableId?: string
  tableNumber?: string
  notes?: string
  reservationDate: string
  depositAmount?: number
}

export interface ReservationsListResponse {
  data: Reservation[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CancelReservationRequest {
  /** The approving Owner/Manager/Supervisor employee. */
  voidedById: string
  voidReason: string
  /** Required when a deposit was paid: how it is returned. */
  refundPaymentMethod?: PaymentMethod
}

export interface AddDepositRequest {
  /** Stable per attempt, so a retried request is not charged twice. */
  clientPaymentId: string
  amount: number
  paymentMethod: PaymentMethod
}

export type PaymentMethod =
  | 'CASH'
  | 'QRIS'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'E_WALLET'
  | 'BANK_TRANSFER'
  | 'OTHER'

export interface ReservationListParams {
  outletId: string
  /** Defaults to bookings awaiting arrival (RESERVED). */
  statuses?: ReservationStatus[]
  /** Business days, "yyyy-MM-dd", inclusive. */
  startDate?: string
  endDate?: string
  /** The API returns 50 by default. */
  limit?: number
}
