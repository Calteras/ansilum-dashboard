import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listReservationsApi,
  createReservationApi,
  fulfillReservationApi,
  cancelReservationApi,
  addDepositApi,
} from './reservations.api'
import type {
  CreateReservationRequest,
  ReservationListParams,
} from './reservations.types'

export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (params: ReservationListParams) =>
    [...reservationKeys.lists(), params] as const,
}

export function useReservationsQuery(params: ReservationListParams) {
  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: () => listReservationsApi(params),
    enabled: !!params.outletId,
  })
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationRequest) => createReservationApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      toast.success('Reservation created', {
        description: 'The reservation has been created successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create reservation', {
        description: error.message,
      })
    },
  })
}

export function useFulfillReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fulfillReservationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      toast.success('Reservation fulfilled', {
        description:
          'The reservation has been fulfilled and stock has been deducted.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to fulfill reservation', {
        description: error.message,
      })
    },
  })
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelReservationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      toast.success('Reservation cancelled', {
        description: 'The reservation has been cancelled.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel reservation', {
        description: error.message,
      })
    },
  })
}

export function useAddDepositMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amount,
      paymentMethod,
    }: {
      id: string
      amount: number
      paymentMethod: string
    }) => addDepositApi(id, amount, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() })
      toast.success('Deposit added', {
        description: 'The deposit has been added to the reservation.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to add deposit', {
        description: error.message,
      })
    },
  })
}
