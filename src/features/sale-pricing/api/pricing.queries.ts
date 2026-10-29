import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCopy } from '@/hooks/use-copy'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { pricingErrorMessage } from '../lib/pricing'
import {
  archivePromotionApi,
  archiveServiceChargeApi,
  archiveTaxApi,
  createPromotionApi,
  createServiceChargeApi,
  createTaxApi,
  getPricingSettingsApi,
  getPromotionPerformanceApi,
  listPromotionsApi,
  listServiceChargesApi,
  listTaxesApi,
  syncRegisterRatesApi,
  updatePricingControlsApi,
  updatePromotionApi,
  updateServiceChargeApi,
  updateTaxApi,
} from './pricing.api'
import type {
  PricingControls,
  PromotionRequest,
  ServiceChargeRequest,
  TaxRequest,
} from './pricing.types'

const pricingKeys = {
  all: ['sale-pricing'] as const,
  promotions: () => [...pricingKeys.all, 'promotions'] as const,
  performance: (id: string) =>
    [...pricingKeys.promotions(), 'performance', id] as const,
  taxes: () => [...pricingKeys.all, 'taxes'] as const,
  services: () => [...pricingKeys.all, 'services'] as const,
  settings: (tenantId: string) =>
    [...pricingKeys.all, 'settings', tenantId] as const,
}

function useFailureToast() {
  const copy = useCopy()
  return (error: Error) =>
    toast.error(copy('Belum tersimpan', 'Not saved'), {
      description: pricingErrorMessage(error.message, copy),
    })
}

/** Rate changes also move the register rates kept in the tenant settings. */
function invalidateCharges(queryClient: QueryClient) {
  for (const key of [
    pricingKeys.taxes(),
    pricingKeys.services(),
    [...pricingKeys.all, 'settings'],
  ])
    queryClient.invalidateQueries({ queryKey: key })
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export function usePromotionsQuery() {
  return useQuery({
    queryKey: pricingKeys.promotions(),
    queryFn: async () => (await listPromotionsApi()).data.data,
  })
}

export function usePromotionPerformanceQuery(id: string | undefined) {
  return useQuery({
    queryKey: pricingKeys.performance(id ?? ''),
    queryFn: async () => (await getPromotionPerformanceApi(id!)).data,
    enabled: !!id,
  })
}

export function useSavePromotionMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PromotionRequest }) =>
      id ? updatePromotionApi(id, data) : createPromotionApi(data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.promotions() })
      toast.success(
        id
          ? copy('Promo tersimpan', 'Promotion saved')
          : copy('Promo dibuat', 'Promotion created')
      )
    },
    onError: failed,
  })
}

export function usePromotionActiveMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) await updatePromotionApi(id, { isActive: true })
      else await archivePromotionApi(id)
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.promotions() })
      toast.success(
        isActive
          ? copy('Promo diaktifkan', 'Promotion activated')
          : copy('Promo dinonaktifkan', 'Promotion deactivated')
      )
    },
    onError: failed,
  })
}

// ─── Taxes and service charges ────────────────────────────────────────────────

export function useTaxesQuery() {
  return useQuery({
    queryKey: pricingKeys.taxes(),
    queryFn: async () => (await listTaxesApi()).data,
  })
}

export function useServiceChargesQuery() {
  return useQuery({
    queryKey: pricingKeys.services(),
    queryFn: async () => (await listServiceChargesApi()).data,
  })
}

export function useSaveTaxMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TaxRequest }) =>
      id ? updateTaxApi(id, data) : createTaxApi(data),
    onSuccess: (_, { id }) => {
      invalidateCharges(queryClient)
      toast.success(
        id
          ? copy('Pajak tersimpan', 'Tax saved')
          : copy('Pajak ditambahkan', 'Tax added')
      )
    },
    onError: failed,
  })
}

export function useTaxActiveMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) await updateTaxApi(id, { isActive: true })
      else await archiveTaxApi(id)
    },
    onSuccess: (_, { isActive }) => {
      invalidateCharges(queryClient)
      toast.success(
        isActive
          ? copy('Pajak diaktifkan', 'Tax activated')
          : copy('Pajak dinonaktifkan', 'Tax deactivated')
      )
    },
    onError: failed,
  })
}

export function useSaveServiceChargeMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ServiceChargeRequest }) =>
      id ? updateServiceChargeApi(id, data) : createServiceChargeApi(data),
    onSuccess: (_, { id }) => {
      invalidateCharges(queryClient)
      toast.success(
        id
          ? copy('Biaya layanan tersimpan', 'Service charge saved')
          : copy('Biaya layanan ditambahkan', 'Service charge added')
      )
    },
    onError: failed,
  })
}

export function useServiceChargeActiveMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) await updateServiceChargeApi(id, { isActive: true })
      else await archiveServiceChargeApi(id)
    },
    onSuccess: (_, { isActive }) => {
      invalidateCharges(queryClient)
      toast.success(
        isActive
          ? copy('Biaya layanan diaktifkan', 'Service charge activated')
          : copy('Biaya layanan dinonaktifkan', 'Service charge deactivated')
      )
    },
    onError: failed,
  })
}

// ─── Tenant settings ──────────────────────────────────────────────────────────

export function usePricingSettingsQuery() {
  const { activeTenant } = useAuth()
  const tenantId = activeTenant?.id
  return useQuery({
    queryKey: pricingKeys.settings(tenantId ?? ''),
    queryFn: () => getPricingSettingsApi(tenantId!),
    enabled: !!tenantId,
  })
}

export function useUpdatePricingControlsMutation() {
  const queryClient = useQueryClient()
  const { activeTenant } = useAuth()
  const tenantId = activeTenant?.id ?? ''
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: (controls: PricingControls) =>
      updatePricingControlsApi(tenantId, controls),
    onSuccess: (saved) => {
      queryClient.setQueryData(pricingKeys.settings(tenantId), saved)
      toast.success(copy('Aturan kasir tersimpan', 'Cashier rules saved'))
    },
    onError: failed,
  })
}

export function useSyncRegisterRatesMutation() {
  const queryClient = useQueryClient()
  const { activeTenant } = useAuth()
  const tenantId = activeTenant?.id ?? ''
  const copy = useCopy()
  const failed = useFailureToast()
  return useMutation({
    mutationFn: (rates: {
      taxPercentage?: number
      serviceChargePercentage?: number
    }) => syncRegisterRatesApi(tenantId, rates),
    onSuccess: (saved) => {
      queryClient.setQueryData(pricingKeys.settings(tenantId), saved)
      toast.success(
        copy('Tarif kasir disamakan', 'Register rates brought in line')
      )
    },
    onError: failed,
  })
}
