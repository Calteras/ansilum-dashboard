import { deleteImage, unwrapEntity, uploadImage } from '@/lib/image-upload'
import {
  tenantGet,
  tenantPost,
  tenantPatch,
  tenantDelete,
  tenantApiPaths,
} from '@/lib/tenant-api-client'
import type {
  Employee,
  EmployeesResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeListParams,
} from './employees.types'

/**
 * Build query string from params
 */
function buildQueryString(params: EmployeeListParams): string {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params.search) searchParams.set('search', params.search)
  if (params.role?.length) searchParams.set('role', params.role.join(','))
  if (params.status?.length) searchParams.set('status', params.status.join(','))

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * List employees with pagination and filters
 */
export async function listEmployeesApi(
  params: EmployeeListParams = {}
): Promise<EmployeesResponse> {
  const query = buildQueryString(params)
  return tenantGet<EmployeesResponse>(`${tenantApiPaths.employees.list}${query}`)
}

/**
 * Get a single employee by ID
 */
export async function getEmployeeApi(id: string): Promise<Employee> {
  return tenantGet<Employee>(tenantApiPaths.employees.get(id))
}

/**
 * Create a new employee
 */
export async function createEmployeeApi(
  data: CreateEmployeeRequest
): Promise<Employee> {
  const { photo, ...employeeData } = data
  const path = tenantApiPaths.employees.create
  if (photo) {
    return uploadImage<Employee>(path, 'photo', photo, {
      method: 'POST',
      data: employeeData,
    })
  }
  return unwrapEntity<Employee>(path, await tenantPost(path, employeeData))
}

/**
 * Update an existing employee
 */
export async function updateEmployeeApi(
  id: string,
  data: UpdateEmployeeRequest
): Promise<Employee> {
  return tenantPatch<Employee>(tenantApiPaths.employees.update(id), data)
}

/**
 * Delete an employee
 */
export async function deleteEmployeeApi(id: string): Promise<void> {
  return tenantDelete<void>(tenantApiPaths.employees.delete(id))
}

/**
 * Upload or replace an employee's profile photo
 */
export async function uploadEmployeePhotoApi(
  id: string,
  photo: File
): Promise<Employee> {
  return uploadImage<Employee>(tenantApiPaths.employees.uploadPhoto(id), 'photo', photo)
}

/**
 * Remove an employee's profile photo
 */
export async function deleteEmployeePhotoApi(id: string): Promise<Employee> {
  return deleteImage<Employee>(tenantApiPaths.employees.deletePhoto(id))
}
