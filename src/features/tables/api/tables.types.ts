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
}

export interface TableMonitoring extends TableLayoutTable {
  section: {
    id: string
    name: string
    order: number
  }
  activeTransaction: ActiveTransaction | null
}

export interface TableMonitoringResponse {
  outletId: string
  generatedAt: string
  totals: {
    tables: number
    byStatus: Record<TableStatus, number>
    capacity: number
    occupiedCapacity: number
  }
  tables: TableMonitoring[]
}
