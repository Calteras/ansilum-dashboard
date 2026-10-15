import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listEmployeesApi,
  getEmployeeApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
  uploadEmployeePhotoApi,
  deleteEmployeePhotoApi,
} from './employees.api'
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeListParams,
} from './employees.types'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

/**
 * Query hook to list employees
 */
export function useEmployeesQuery(params: EmployeeListParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployeesApi(params),
  })
}

/**
 * Query hook to get a single employee
 */
export function useEmployeeQuery(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployeeApi(id),
    enabled: !!id,
  })
}

/**
 * Mutation hook to create an employee
 */
export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => createEmployeeApi(data),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast.success('Employee created', {
        description: `${employee.name} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to create employee', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to update an employee
 */
export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      updateEmployeeApi(id, data),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employee.id) })
      toast.success('Employee updated', {
        description: `${employee.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to update employee', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to delete an employee
 */
export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast.success('Employee deleted', {
        description: 'The employee has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete employee', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to upload or replace an employee's photo
 */
export function useUploadEmployeePhotoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, photo }: { id: string; photo: File }) =>
      uploadEmployeePhotoApi(id, photo),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employee.id) })
      toast.success('Photo updated', {
        description: `${employee.name}'s photo has been updated.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to upload photo', {
        description: error.message,
      })
    },
  })
}

/**
 * Mutation hook to remove an employee's photo
 */
export function useDeleteEmployeePhotoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEmployeePhotoApi(id),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employee.id) })
      toast.success('Photo removed', {
        description: `${employee.name}'s photo has been removed.`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to remove photo', {
        description: error.message,
      })
    },
  })
}
