import {
  tenantGet,
  tenantPost,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
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

export async function cancelReservationApi(id: string): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.cancel(id))
}

export async function addDepositApi(
  id: string,
  amount: number,
  paymentMethod: string
): Promise<Reservation> {
  return tenantPost<Reservation>(tenantApiPaths.reservations.deposit(id), {
    amount,
    paymentMethod,
  })
}
