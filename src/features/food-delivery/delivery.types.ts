export type Provider = 'GOFOOD' | 'GRABFOOD'
export type Environment = 'SANDBOX' | 'PRODUCTION'
export const orderStates = [
  'RECEIVED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'HANDED_OVER',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
] as const
export type OrderState = (typeof orderStates)[number]
export type Action =
  | 'START_PREPARATION'
  | 'READY'
  | 'ACCEPT'
  | 'REJECT'
  | 'CANCEL'
  | 'ACKNOWLEDGE_EXTERNAL_INVENTORY'
export type OperationAction =
  | 'ACTIVATE'
  | 'PUBLISH_MENU'
  | 'RECONCILE'
  | 'SUBSCRIBE'
  | 'PAUSE_STORE'
  | 'STORE_STATUS'
export type Outcome =
  | 'PENDING'
  | 'PROCESSING'
  | 'UNKNOWN'
  | 'SUCCEEDED'
  | 'FAILED'

export interface Connection {
  id: string
  provider: Provider
  environment: Environment
  accountId: string
  enabled: boolean
  writesEnabled: boolean
}
export interface Binding {
  id: string
  connectionId: string
  outletId: string
  externalOutletId: string
  provider: Provider
  enabled: boolean
  inventoryEnabled: boolean
  salesEnabled: boolean
  manualAcceptance: boolean
  preparationLeadMinutes: number
  integrationStatus: string | null
  menuSyncStatus: string | null
  menuVersion: number
  menu: Record<string, unknown> | null
  importedMenu: Record<string, unknown> | null
  reconciledAt: string | null
}
export interface MappingInput {
  kind: 'ITEM' | 'OPTION'
  externalId: string
  productId?: string
  variantId?: string
  modifierId?: string
}
export interface Mapping extends MappingInput {
  id: string
  version: number
}
export interface DeliveryOrder {
  id: string
  outletId: string
  bindingId: string
  provider: Provider
  externalId: string
  displayId: string
  orderType: string
  state: OrderState
  providerState: string
  processingState: string
  version: number
  currency: string
  total: string | null
  scheduledAt: string | null
  preparedAt: string | null
  updatedAt: string
  transactionId: string | null
  inventoryHandledExternally: boolean
  financialError: string | null
  capabilities: {
    manualAcceptance: boolean
    writesEnabled: boolean
    inventoryEnabled: boolean
  }
  items: {
    id: string
    name: string
    quantity: number
    unitPrice: string
    notes?: string
    options: { externalId: string; quantity: number }[]
  }[]
}
export interface OrderPage {
  orders: DeliveryOrder[]
  cursor: string | null
}
export interface ActionInput {
  action: Action
  expectedVersion: number
  idempotencyKey: string
  cancelCode?: number
}
export interface Command {
  id: string
  orderId: string
  action: string
  status: Outcome
  errorCode: string | null
  createdAt: string
}
export interface Operation {
  id: string
  bindingId: string
  action: OperationAction
  status: Outcome
  errorCode: string | null
  result?: unknown
}
export interface OperationInput {
  action: OperationAction
  idempotencyKey: string
  event?: string
  date?: string
}
export interface OrderEvent {
  id: string
  type: string
  createdAt: string
  details?: unknown
}
export interface Health {
  queues: { status: string; _count: number }[]
  oldestPendingAt: string | null
  exceptions: {
    id: string
    connectionId: string
    errorCode: string | null
    attempts: number
    receivedAt: string
  }[]
}
export interface AdjustmentInput {
  kind: 'REFUND' | 'FEE' | 'SUBSIDY' | 'SETTLEMENT'
  amount: string
  reference: string
  occurredAt: string
  idempotencyKey: string
}
export interface ChannelReport {
  start: string
  end: string
  currency: string
  sales: {
    source: string
    _sum: { grandTotal: string | null }
    _count: number
  }[]
  adjustments: {
    kind: string
    currency: string
    _sum: { amount: string | null }
  }[]
  settlement: string
}
