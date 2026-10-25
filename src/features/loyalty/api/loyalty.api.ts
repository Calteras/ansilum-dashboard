import {
  tenantApiPaths,
  tenantDelete,
  tenantGet,
  tenantPost,
  tenantPut,
} from '@/lib/tenant-api-client'
import type {
  Customer,
  CustomerDetail,
  CustomerListParams,
  CustomerRedemption,
  CustomerRequest,
  CustomerTransaction,
  Envelope,
  LoyaltyConfig,
  LoyaltyConfigRequest,
  LoyaltyOverview,
  PageParams,
  Paged,
  PointsLedgerEntry,
  Reward,
  RewardRedemption,
  RewardRequest,
} from './loyalty.types'

const paths = tenantApiPaths

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

const page = ({ limit, offset }: PageParams = {}) => ({ limit, offset })

// ─── Program ──────────────────────────────────────────────────────────────────

export const getLoyaltyConfigApi = () =>
  tenantGet<Envelope<LoyaltyConfig>>(paths.loyaltyConfig)

export const updateLoyaltyConfigApi = (data: LoyaltyConfigRequest) =>
  tenantPut<Envelope<LoyaltyConfig>>(paths.loyaltyConfig, data)

export const getLoyaltyOverviewApi = (days: number) =>
  tenantGet<Envelope<LoyaltyOverview>>(
    `${paths.customers.overview}${query({ days })}`
  )

export const getTopCustomersApi = (
  sortBy: 'totalSpent' | 'visitCount',
  limit = 5
) =>
  tenantGet<Envelope<Customer[]>>(
    `${paths.customers.top}${query({ sortBy, limit })}`
  )

// ─── Customers ────────────────────────────────────────────────────────────────

export const listCustomersApi = (params: CustomerListParams) =>
  tenantGet<Paged<Customer>>(
    `${paths.customers.list}${query({
      search: params.search,
      status: params.status?.join(','),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      ...page(params),
    })}`
  )

export const getCustomerApi = (id: string) =>
  tenantGet<Envelope<CustomerDetail>>(paths.customers.get(id))

export const createCustomerApi = (data: CustomerRequest) =>
  tenantPost<Envelope<Customer>>(paths.customers.create, data)

export const updateCustomerApi = (id: string, data: Partial<CustomerRequest>) =>
  tenantPut<Envelope<Customer>>(paths.customers.update(id), data)

export const archiveCustomerApi = (id: string) =>
  tenantDelete<Envelope<Customer>>(paths.customers.archive(id))

export const restoreCustomerApi = (id: string) =>
  tenantPost<Envelope<Customer>>(paths.customers.restore(id))

export const banCustomerApi = (
  id: string,
  data: { reason: string; forfeitPoints: boolean }
) => tenantPost<Envelope<CustomerDetail>>(paths.customers.ban(id), data)

export const unbanCustomerApi = (id: string) =>
  tenantPost<Envelope<CustomerDetail>>(paths.customers.unban(id))

export const adjustPointsApi = (
  id: string,
  data: { points: number; description: string }
) =>
  tenantPost<Envelope<PointsLedgerEntry>>(
    paths.customers.adjustPoints(id),
    data
  )

export const getPointsHistoryApi = (id: string, params?: PageParams) =>
  tenantGet<Paged<PointsLedgerEntry>>(
    `${paths.customers.pointsHistory(id)}${query(page(params))}`
  )

export const getCustomerRedemptionsApi = (id: string, params?: PageParams) =>
  tenantGet<Paged<CustomerRedemption>>(
    `${paths.customers.redemptions(id)}${query(page(params))}`
  )

export const getCustomerTransactionsApi = (id: string, params?: PageParams) =>
  tenantGet<Paged<CustomerTransaction>>(
    `${paths.customers.transactions(id)}${query(page(params))}`
  )

// ─── Rewards ──────────────────────────────────────────────────────────────────

/** The whole catalogue (it is small; the POS downloads it the same way). */
export const listRewardsApi = () =>
  tenantGet<Paged<Reward>>(`${paths.rewards.list}${query({ limit: 200 })}`)

export const createRewardApi = (data: RewardRequest) =>
  tenantPost<Envelope<Reward>>(paths.rewards.create, data)

export const updateRewardApi = (id: string, data: RewardRequest) =>
  tenantPut<Envelope<Reward>>(paths.rewards.update(id), data)

export const deactivateRewardApi = (id: string) =>
  tenantDelete<Envelope<Reward>>(paths.rewards.deactivate(id))

export const getRewardRedemptionsApi = (id: string, params?: PageParams) =>
  tenantGet<Paged<RewardRedemption>>(
    `${paths.rewards.redemptions(id)}${query(page(params))}`
  )
