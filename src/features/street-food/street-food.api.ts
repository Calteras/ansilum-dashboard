import {
  tenantDelete,
  tenantGet,
  tenantPost,
  tenantPut,
} from '@/lib/tenant-api-client'
import type {
  Fees,
  HoursInterval,
  NewLink,
  OutletSettingsInput,
  RotatedSecret,
  StreetFoodOverview,
} from './street-food.types'

const BASE = '/integrations/streetfood'

interface Envelope<T> {
  data: T
}

const outletPath = (outletId: string, part: string) =>
  `${BASE}/outlets/${encodeURIComponent(outletId)}/${part}`

export async function getOverviewApi() {
  return (await tenantGet<Envelope<StreetFoodOverview>>(`${BASE}/overview`))
    .data
}

/** The secret in the answer is shown once; nothing else can read it. */
export async function connectApi(platformUrl: string) {
  return (await tenantPost<Envelope<NewLink>>(`${BASE}/link`, { platformUrl }))
    .data
}

export async function rotateSecretApi() {
  return (
    await tenantPost<Envelope<RotatedSecret>>(`${BASE}/link/rotate-secret`)
  ).data
}

export function disconnectApi() {
  return tenantDelete(`${BASE}/link`)
}

export function setPublicationApi(outletId: string, enabled: boolean) {
  return tenantPut(outletPath(outletId, 'publication'), { enabled })
}

export function saveSettingsApi(
  outletId: string,
  settings: OutletSettingsInput
) {
  return tenantPut(outletPath(outletId, 'settings'), settings)
}

export function saveHoursApi(outletId: string, intervals: HoursInterval[]) {
  return tenantPut(outletPath(outletId, 'hours'), { intervals })
}

export async function getFeesApi() {
  return (await tenantGet<Envelope<Fees>>(`${BASE}/fees`)).data
}
