import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCopy } from '@/hooks/use-copy'
import { loyaltyErrorMessage } from '../lib/loyalty'
import {
  adjustPointsApi,
  archiveCustomerApi,
  banCustomerApi,
  createCustomerApi,
  createRewardApi,
  deactivateRewardApi,
  getCustomerApi,
  getCustomerRedemptionsApi,
  getCustomerTransactionsApi,
  getLoyaltyConfigApi,
  getLoyaltyOverviewApi,
  getPointsHistoryApi,
  getRewardRedemptionsApi,
  getTopCustomersApi,
  listCustomersApi,
  listRewardsApi,
  restoreCustomerApi,
  unbanCustomerApi,
  updateCustomerApi,
  updateLoyaltyConfigApi,
  updateRewardApi,
} from './loyalty.api'
import type {
  CustomerListParams,
  CustomerRequest,
  LoyaltyConfigRequest,
  PageParams,
  RewardRequest,
} from './loyalty.types'

export const loyaltyKeys = {
  all: ['loyalty'] as const,
  config: () => [...loyaltyKeys.all, 'config'] as const,
  overview: (days: number) => [...loyaltyKeys.all, 'overview', days] as const,
  top: (sortBy: string) => [...loyaltyKeys.all, 'top', sortBy] as const,
  customers: () => [...loyaltyKeys.all, 'customers'] as const,
  customerList: (params: CustomerListParams) =>
    [...loyaltyKeys.customers(), 'list', params] as const,
  customer: (id: string) => [...loyaltyKeys.customers(), 'detail', id] as const,
  customerTab: (id: string, tab: string, params: PageParams) =>
    [...loyaltyKeys.customer(id), tab, params] as const,
  rewards: () => [...loyaltyKeys.all, 'rewards'] as const,
  rewardRedemptions: (id: string, params: PageParams) =>
    [...loyaltyKeys.rewards(), 'redemptions', id, params] as const,
}

/** Member changes move the directory, the profile and the program totals. */
function invalidateMembers(queryClient: QueryClient) {
  for (const key of [
    loyaltyKeys.customers(),
    [...loyaltyKeys.all, 'overview'],
    [...loyaltyKeys.all, 'top'],
  ]) {
    queryClient.invalidateQueries({ queryKey: key })
  }
}

// ─── Program ──────────────────────────────────────────────────────────────────

export function useLoyaltyConfigQuery() {
  return useQuery({
    queryKey: loyaltyKeys.config(),
    queryFn: async () => (await getLoyaltyConfigApi()).data,
  })
}

export function useUpdateLoyaltyConfigMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: (data: LoyaltyConfigRequest) => updateLoyaltyConfigApi(data),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(loyaltyKeys.config(), data)
      toast.success(copy('Aturan poin tersimpan', 'Earning rules saved'))
    },
    onError: (error: Error) =>
      toast.error(copy('Belum tersimpan', 'Not saved'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}

export function useLoyaltyOverviewQuery(days: number) {
  return useQuery({
    queryKey: loyaltyKeys.overview(days),
    queryFn: async () => (await getLoyaltyOverviewApi(days)).data,
    placeholderData: keepPreviousData,
  })
}

export function useTopCustomersQuery(sortBy: 'totalSpent' | 'visitCount') {
  return useQuery({
    queryKey: loyaltyKeys.top(sortBy),
    queryFn: async () => (await getTopCustomersApi(sortBy)).data,
  })
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({
    queryKey: loyaltyKeys.customerList(params),
    queryFn: () => listCustomersApi(params),
    placeholderData: keepPreviousData,
  })
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: loyaltyKeys.customer(id),
    queryFn: async () => (await getCustomerApi(id)).data,
    enabled: !!id,
  })
}

export function usePointsHistoryQuery(id: string, params: PageParams) {
  return useQuery({
    queryKey: loyaltyKeys.customerTab(id, 'points', params),
    queryFn: () => getPointsHistoryApi(id, params),
    placeholderData: keepPreviousData,
  })
}

export function useCustomerRedemptionsQuery(id: string, params: PageParams) {
  return useQuery({
    queryKey: loyaltyKeys.customerTab(id, 'redemptions', params),
    queryFn: () => getCustomerRedemptionsApi(id, params),
    placeholderData: keepPreviousData,
  })
}

export function useCustomerTransactionsQuery(id: string, params: PageParams) {
  return useQuery({
    queryKey: loyaltyKeys.customerTab(id, 'transactions', params),
    queryFn: () => getCustomerTransactionsApi(id, params),
    placeholderData: keepPreviousData,
  })
}

export function useSaveCustomerMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CustomerRequest }) =>
      id ? updateCustomerApi(id, data) : createCustomerApi(data),
    onSuccess: ({ data }, { id }) => {
      invalidateMembers(queryClient)
      toast.success(
        id
          ? copy('Data pelanggan diperbarui', 'Customer updated')
          : copy('Pelanggan ditambahkan', 'Customer added'),
        { description: data.name }
      )
    },
    onError: (error: Error) =>
      toast.error(copy('Belum tersimpan', 'Not saved'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}

export function useAdjustPointsMutation(customerId: string) {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: (data: { points: number; description: string }) =>
      adjustPointsApi(customerId, data),
    onSuccess: ({ data }) => {
      invalidateMembers(queryClient)
      toast.success(copy('Poin disesuaikan', 'Points adjusted'), {
        description: copy(
          `Saldo sekarang ${data.balanceAfter} poin`,
          `New balance: ${data.balanceAfter} points`
        ),
      })
    },
    onError: (error: Error) =>
      toast.error(copy('Poin belum disesuaikan', 'Points not adjusted'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}

/** Ban, unban, archive and restore: each moves the member to another status. */
export function useCustomerStatusMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: (
      action:
        | { kind: 'ban'; id: string; reason: string; forfeitPoints: boolean }
        | { kind: 'unban' | 'archive' | 'restore'; id: string }
    ) => {
      switch (action.kind) {
        case 'ban':
          return banCustomerApi(action.id, {
            reason: action.reason,
            forfeitPoints: action.forfeitPoints,
          })
        case 'unban':
          return unbanCustomerApi(action.id)
        case 'archive':
          return archiveCustomerApi(action.id)
        case 'restore':
          return restoreCustomerApi(action.id)
      }
    },
    onSuccess: ({ data }, { kind }) => {
      invalidateMembers(queryClient)
      const title = {
        ban: copy('Pelanggan diblokir', 'Customer banned'),
        unban: copy('Blokir dicabut', 'Ban lifted'),
        archive: copy('Pelanggan dinonaktifkan', 'Customer deactivated'),
        restore: copy('Pelanggan diaktifkan kembali', 'Customer restored'),
      }[kind]
      toast.success(title, { description: data.name })
    },
    onError: (error: Error) =>
      toast.error(copy('Status belum berubah', 'Status not changed'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export function useRewardsQuery() {
  return useQuery({
    queryKey: loyaltyKeys.rewards(),
    queryFn: listRewardsApi,
  })
}

export function useRewardRedemptionsQuery(id: string, params: PageParams) {
  return useQuery({
    queryKey: loyaltyKeys.rewardRedemptions(id, params),
    queryFn: () => getRewardRedemptionsApi(id, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useSaveRewardMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: RewardRequest }) =>
      id ? updateRewardApi(id, data) : createRewardApi(data),
    onSuccess: ({ data }, { id }) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.rewards() })
      toast.success(
        id
          ? copy('Hadiah diperbarui', 'Reward updated')
          : copy('Hadiah dibuat', 'Reward created'),
        { description: data.name }
      )
    },
    onError: (error: Error) =>
      toast.error(copy('Belum tersimpan', 'Not saved'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}

export function useRewardActiveMutation() {
  const queryClient = useQueryClient()
  const copy = useCopy()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive
        ? updateRewardApi(id, { isActive: true })
        : deactivateRewardApi(id),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.rewards() })
      toast.success(
        data.isActive
          ? copy('Hadiah diaktifkan', 'Reward activated')
          : copy('Hadiah dinonaktifkan', 'Reward deactivated'),
        { description: data.name }
      )
    },
    onError: (error: Error) =>
      toast.error(copy('Status belum berubah', 'Status not changed'), {
        description: loyaltyErrorMessage(error.message, copy),
      }),
  })
}
