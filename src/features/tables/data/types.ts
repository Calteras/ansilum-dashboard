export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
export type TableShape = 'rectangle' | 'square' | 'circle'
export type TableSection =
    | 'Main Hall'
    | 'Outdoor'
    | 'VIP Room'
    | 'Bar Area'
    | 'Private Dining'

export interface TableData {
    name: string
    capacity: number
    status: TableStatus
    section: TableSection
    shape: TableShape
}

export interface Table {
    id: number
    name: string
    x: number
    y: number
    width: number
    height: number
    capacity: number
    status: TableStatus
    section: TableSection
    shape: TableShape
    rotation: number
    orderTime?: string
    reservationTime?: string
}

export interface Position {
    x: number
    y: number
}

export interface Stats {
    total: number
    available: number
    occupied: number
    reserved: number
}