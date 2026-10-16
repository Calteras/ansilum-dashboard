import { API_BASE_URL } from '@/config/api.config'
import { notifyAuthSessionExpired } from '@/lib/auth-session'
import {
  readReceiptTemplate,
  type ReceiptTemplate,
} from './layout/receipt-template'

/**
 * The receipt design and printing rules on the tenant configuration
 * (ansilum-be docs/RECEIPT_TEMPLATE.md). Every POS device of the business
 * loads them; printers themselves are set up on each device.
 */
export interface ReceiptSettings {
  printReceipt: boolean
  autoPrintOnPayment: boolean
  printKitchenOrder: boolean
  enableBackupPrinter: boolean
  receiptCopies: number
  openCashDrawer: boolean
  autoCutPaper: boolean
  receiptTemplate: ReceiptTemplate
}

type Json = Record<string, unknown>

const bool = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

/** Receipt settings from a tenant configuration, with the defaults filled in. */
export function readReceiptSettings(config: unknown): ReceiptSettings {
  const json: Json =
    typeof config === 'object' && config !== null ? (config as Json) : {}
  const copies = Number(json.receiptCopies)
  return {
    printReceipt: bool(json.printReceipt, true),
    autoPrintOnPayment: bool(json.autoPrintOnPayment, true),
    printKitchenOrder: bool(json.printKitchenOrder, true),
    enableBackupPrinter: bool(json.enableBackupPrinter, false),
    receiptCopies: Number.isInteger(copies)
      ? Math.min(3, Math.max(1, copies))
      : 1,
    openCashDrawer: bool(json.openCashDrawer, true),
    autoCutPaper: bool(json.autoCutPaper, true),
    receiptTemplate: readReceiptTemplate(json.receiptTemplate),
  }
}

async function configRequest(
  tenantId: string,
  init: RequestInit = {}
): Promise<ReceiptSettings> {
  const response = await fetch(
    `${API_BASE_URL}/auth/tenants/${encodeURIComponent(tenantId)}/config`,
    {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    }
  )
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) notifyAuthSessionExpired()
    const message = (body as Json).message
    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : typeof message === 'string'
          ? message
          : `Request failed with status ${response.status}`
    )
  }
  // Auth routes are not wrapped by the response interceptor, but accept both.
  const data = (body as Json).data ?? body
  return readReceiptSettings(data)
}

export function getReceiptSettingsApi(tenantId: string) {
  return configRequest(tenantId)
}

/** Saves the receipt settings only; the rest of the configuration is kept. */
export function updateReceiptSettingsApi(
  tenantId: string,
  settings: ReceiptSettings
) {
  return configRequest(tenantId, {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
