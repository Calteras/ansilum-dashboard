import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getTableLayoutApi,
  getTableMonitoringApi,
  releaseTableApi,
  saveTableLayoutApi,
  updateTableApi,
  updateTableStatusApi,
} from './tables.api'
import type {
  SaveLayoutPayload,
  TableStatus,
  TableUpdatePayload,
} from './tables.types'

export const tableKeys = {
  all: ['table-layout'] as const,
  layout: (outletId: string) => [...tableKeys.all, 'layout', outletId] as const,
  monitoring: (outletId: string) =>
    [...tableKeys.all, 'monitoring', outletId] as const,
}

export function useTableLayoutQuery(outletId: string) {
  return useQuery({
    queryKey: tableKeys.layout(outletId),
    queryFn: () => getTableLayoutApi(outletId),
    enabled: !!outletId,
  })
}

export function useTableMonitoringQuery(outletId: string) {
  return useQuery({
    queryKey: tableKeys.monitoring(outletId),
    queryFn: () => getTableMonitoringApi(outletId),
    enabled: !!outletId,
    refetchInterval: 10_000,
  })
}

function invalidateTables(queryClient: ReturnType<typeof useQueryClient>, outletId: string) {
  queryClient.invalidateQueries({ queryKey: tableKeys.layout(outletId) })
  queryClient.invalidateQueries({ queryKey: tableKeys.monitoring(outletId) })
}

export function useSaveTableLayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ outletId, data }: { outletId: string; data: SaveLayoutPayload }) =>
      saveTableLayoutApi(outletId, data),
    onSuccess: (_, variables) => {
      invalidateTables(queryClient, variables.outletId)
      toast.success('Layout saved', { description: 'The POS table map is up to date.' })
    },
    onError: (error: Error) =>
      toast.error('Unable to save layout', { description: error.message }),
  })
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      outletId,
      tableId,
      data,
    }: {
      outletId: string
      tableId: string
      data: TableUpdatePayload
    }) => updateTableApi(outletId, tableId, data),
    onSuccess: (_, variables) => {
      invalidateTables(queryClient, variables.outletId)
      toast.success('Table updated')
    },
    onError: (error: Error) =>
      toast.error('Unable to update table', { description: error.message }),
  })
}

export function useUpdateTableStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      outletId,
      tableId,
      status,
    }: {
      outletId: string
      tableId: string
      status: TableStatus
    }) => updateTableStatusApi(outletId, tableId, status),
    onSuccess: (_, variables) => {
      invalidateTables(queryClient, variables.outletId)
    },
    onError: (error: Error) =>
      toast.error('Unable to update status', { description: error.message }),
  })
}

export function useReleaseTableMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ outletId, tableId }: { outletId: string; tableId: string }) =>
      releaseTableApi(outletId, tableId),
    onSuccess: (_, variables) => {
      invalidateTables(queryClient, variables.outletId)
      toast.success('Table released')
    },
    onError: (error: Error) =>
      toast.error('Unable to release table', { description: error.message }),
  })
}
