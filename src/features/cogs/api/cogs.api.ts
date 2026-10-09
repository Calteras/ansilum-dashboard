import {
  tenantGet,
  tenantPost,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  PeriodCogsParams,
  PeriodCogsResponse,
  ProductCostParams,
  ProductCostResponse,
  MarginForecastParams,
  MarginForecastResponse,
  OverheadListResponse,
  AddOverheadRequest,
  AddOverheadResponse,
} from './cogs.types'

export async function calculatePeriodCogsApi(
  params: PeriodCogsParams
): Promise<PeriodCogsResponse> {
  return tenantPost<PeriodCogsResponse>(tenantApiPaths.cogs.calculate, params)
}

export async function getProductCostApi(
  productId: string,
  params: ProductCostParams
): Promise<ProductCostResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('outletId', params.outletId)
  if (params.quantity) searchParams.set('quantity', String(params.quantity))
  return tenantGet<ProductCostResponse>(
    `${tenantApiPaths.cogs.productCost(productId)}?${searchParams.toString()}`
  )
}

export async function getMarginForecastApi(
  params: MarginForecastParams
): Promise<MarginForecastResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('productId', params.productId)
  searchParams.set('outletId', params.outletId)
  searchParams.set(
    'simulatedMaterialIncreasePct',
    String(params.simulatedMaterialIncreasePct)
  )
  return tenantGet<MarginForecastResponse>(
    `${tenantApiPaths.cogs.marginForecast}?${searchParams.toString()}`
  )
}

export async function getProductOverheadApi(
  productId: string
): Promise<OverheadListResponse> {
  return tenantGet<OverheadListResponse>(
    tenantApiPaths.cogs.productOverhead(productId)
  )
}

export async function addProductOverheadApi(
  productId: string,
  data: AddOverheadRequest
): Promise<AddOverheadResponse> {
  return tenantPost<AddOverheadResponse>(
    tenantApiPaths.cogs.productOverhead(productId),
    data
  )
}

export async function deleteOverheadApi(overheadId: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.cogs.deleteOverhead(overheadId))
}
