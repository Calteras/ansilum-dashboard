import {
  tenantGet,
  tenantPatch,
  tenantPost,
  tenantPut,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  SaveLayoutPayload,
  TableLayoutResponse,
  TableMonitoringResponse,
  TableStatus,
  TableUpdatePayload,
} from './tables.types'

interface ApiEnvelope<T> {
  data: T
}

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data !== undefined
  ) {
    return response.data
  }
  return response as T
}

export function getTableLayoutApi(outletId: string) {
  return tenantGet<TableLayoutResponse | ApiEnvelope<TableLayoutResponse>>(
    tenantApiPaths.tableLayout.get(outletId)
  ).then(unwrap)
}

export function saveTableLayoutApi(outletId: string, data: SaveLayoutPayload) {
  return tenantPut<TableLayoutResponse | ApiEnvelope<TableLayoutResponse>>(
    tenantApiPaths.tableLayout.save(outletId),
    data
  ).then(unwrap)
}

export function updateTableApi(
  outletId: string,
  tableId: string,
  data: TableUpdatePayload
) {
  return tenantPatch<TableLayoutResponse | ApiEnvelope<TableLayoutResponse>>(
    tenantApiPaths.tableLayout.updateTable(outletId, tableId),
    data
  ).then(unwrap)
}

export function updateTableStatusApi(
  outletId: string,
  tableId: string,
  status: TableStatus
) {
  return tenantPatch<TableLayoutResponse | ApiEnvelope<TableLayoutResponse>>(
    tenantApiPaths.tableLayout.updateStatus(outletId, tableId),
    { status }
  ).then(unwrap)
}

export function releaseTableApi(outletId: string, tableId: string) {
  return tenantPost<TableLayoutResponse | ApiEnvelope<TableLayoutResponse>>(
    tenantApiPaths.tableLayout.release(outletId, tableId)
  ).then(unwrap)
}

export function getTableMonitoringApi(outletId: string) {
  return tenantGet<TableMonitoringResponse | ApiEnvelope<TableMonitoringResponse>>(
    tenantApiPaths.tableLayout.monitoring(outletId)
  ).then(unwrap)
}
