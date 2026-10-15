export type EmployeeRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'CASHIER'
  | 'BARISTA'
  | 'KITCHEN'

export type EmployeeStatus = 'active' | 'inactive'

export interface EmployeeOutlet {
  outlet: {
    id: string
    name: string
    code: string
  }
}

export interface Employee {
  id: string
  tenantId: string
  employeeNo: string
  name: string
  email?: string
  phone?: string
  role: EmployeeRole
  isActive: boolean
  image?: string | null
  outlets: EmployeeOutlet[]
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeRequest {
  employeeNo: string
  name: string
  email?: string
  phone?: string
  pin: string
  role: EmployeeRole
  outletIds: string[]
  photo?: File
}

export interface UpdateEmployeeRequest {
  employeeNo?: string
  name?: string
  email?: string
  phone?: string
  pin?: string
  role?: EmployeeRole
  isActive?: boolean
  outletIds?: string[]
}

export interface EmployeesResponse {
  data: Employee[]
  total: number
  page: number
  pageSize: number
}

export interface EmployeeListParams {
  page?: number
  pageSize?: number
  search?: string
  role?: EmployeeRole[]
  status?: EmployeeStatus[]
}
