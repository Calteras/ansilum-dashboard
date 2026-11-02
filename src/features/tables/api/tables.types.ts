export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
export type TableShape = 'RECTANGLE' | 'SQUARE' | 'CIRCLE'

export interface TableLayoutTable {
  id: string
  name: string
  capacity: number
  shape: TableShape
  status: TableStatus
  posX: number
  posY: number
  width: number
  height: number
}

export interface TableLayoutSection {
  id?: string
  name: string
  order?: number
  tables: TableLayoutTable[]
}

export interface TableLayoutResponse {
  version: number
  savedAt: string
  totalTables: number
  sections: TableLayoutSection[]
}

export interface SaveLayoutPayload {
  version: number
  savedAt: string
  totalTables: number
  sections: Array<{
    name: string
    tables: Array<Omit<TableLayoutTable, 'status'>>
  }>
}

export interface TableUpdatePayload {
  name?: string
  capacity?: number
  shape?: TableShape
  posX?: number
  posY?: number
  width?: number
  height?: number
}


export interface ActiveTransaction {
  id: string
  transactionNo: string
  status: string
  tableNumber: string
  grandTotal: number
  createdAt: string
  customerName?: string | null
  itemCount?: number
  paidAmount?: number
  /** When the party sat down: arrival for a booking, else the order time. */
  seatedAt?: string
  fromReservation?: boolean
  cashierName?: string | null
  /** Party size, when the register recorded it. */
  guestCount?: number | null
  /** Orders the party placed since sitting down, paid now or later. */
  orderCount?: number
}

/** A booking on the board's day that holds the table around its time. */
export interface TableBooking {
  id: string
  transactionNo: string
  tableNumber: string | null
  customerName: string | null
  customerPhone: string | null
  reservationDate: string
  grandTotal: number
  paidAmount: number
  depositAmount: number
  itemCount: number
  notes: string | null
}

export interface TableMonitoring extends TableLayoutTable {
  section: {
    id: string
    name: string
    order: number
  }
  /** The party seated here: every order since it sat down, summed. */
  activeTransaction: ActiveTransaction | null
  /** Unpaid bills on the table. */
  openOrders?: number
  bookings?: TableBooking[]
}

export interface TableMonitoringResponse {
  outletId: string
  generatedAt: string
  totals: {
    tables: number
    byStatus: Record<TableStatus, number>
    capacity: number
    occupiedCapacity: number
    bookings?: number
    bookedTables?: number
  }
  tables: TableMonitoring[]
  /** The business day the bookings are for ("yyyy-MM-dd"). */
  date?: string
  timeZone?: string
  bookingHoldMinutes?: number
  unassignedBookings?: TableBooking[]
}
