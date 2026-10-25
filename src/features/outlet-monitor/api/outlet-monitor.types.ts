/** LIVE: sold within the live window. IDLE: open shift or sales today, none recently. OFFLINE: neither. */
export type OutletActivity = 'LIVE' | 'IDLE' | 'OFFLINE'

export interface MonitorOutlet {
  outletId: string
  name: string
  code: string
  address: string | null
  latitude: number | null
  longitude: number | null
  activity: OutletActivity
  lastSaleAt: string | null
  openShift: { count: number; since: string; employeeName: string } | null
  /** Closed sales collected, with tax and service. */
  collected: number
  /** Cash put into the drawer by hand. */
  cashIn: number
  inflow: number
  refunded: number
  /** Cash taken out of the drawer by hand. */
  cashOut: number
  outflow: number
  net: number
  transactions: number
  averageOrderValue: number | null
  openOrders: number
  payments: { method: string; amount: number }[]
  /** Collected by the same time yesterday. */
  previousCollected: number
  previousTransactions: number
  collectedChangePercent: number | null
  /** Collected per local hour of today. */
  hourly: number[]
}

export interface MonitorHour {
  start: string
  /** Local "HH:mm" in the business timezone. */
  hour: string
  /** False for hours that have not started yet. */
  available: boolean
  collected: number | null
  transactions: number | null
  previousCollected: number
  previousTransactions: number
}

export interface OutletMonitor {
  scope: { role: 'OWNER' | 'MANAGER' | 'CASHIER'; outletIds: string[] }
  currency: string
  timezone: string
  period: {
    date: string
    start: string
    end: string
    effectiveEnd: string
    previousDate: string
    comparisonEnd: string
    liveWindowMinutes: number
  }
  totals: {
    collected: number
    cashIn: number
    inflow: number
    refunded: number
    cashOut: number
    outflow: number
    net: number
    transactions: number
    averageOrderValue: number | null
    openOrders: number
    previousCollected: number
    previousTransactions: number
    collectedChangePercent: number | null
    activity: Record<OutletActivity, number>
  }
  hours: MonitorHour[]
  outlets: MonitorOutlet[]
  updatedAt: string
}

export interface OutletMonitorResponse {
  data: OutletMonitor
}
