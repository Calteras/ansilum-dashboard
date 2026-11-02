import { tenantGet, tenantPost, tenantApiPaths } from '@/lib/tenant-api-client'
import type {
  AddDepositRequest,
  CancelReservationRequest,
  Reservation,
  ReservationsListResponse,
  CreateReservationRequest,
  ReservationListParams,
} from './reservations.types'

export async function listReservationsApi(
  params: ReservationListParams
): Promise<ReservationsListResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('outletId', params.outletId)
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.statuses?.length)
    searchParams.set('status', params.statuses.join(','))
  const query = searchParams.toString()
  return tenantGet<ReservationsListResponse>(
    `${tenantApiPaths.reservations.list}?${query}`
  )
}

export async function createReservationApi(
  data: CreateReservationRequest
): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.create, data)
}

export async function fulfillReservationApi(id: string): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.fulfill(id))
}

export async function cancelReservationApi(
  id: string,
  data: CancelReservationRequest
): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.cancel(id), data)
}

export async function addDepositApi(
  id: string,
  data: AddDepositRequest
): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.deposit(id), data)
}
