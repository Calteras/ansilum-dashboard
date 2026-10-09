export type OnboardingStep =
  | 'signup'
  | 'business'
  | 'outlet'
  | 'employee'
  | 'completion'

export interface OnboardingFormData {
  // Step 1: Signup
  name?: string
  email?: string
  password?: string
  confirmPassword?: string

  // Step 2: Business
  businessName?: string
  businessSlug?: string

  // Step 3: Outlet
  outletName?: string
  outletCode?: string
  outletAddress?: string
  outletPhone?: string

  // Step 4: Employee (optional)
  employeeNo?: string
  employeeName?: string
  employeeEmail?: string
  employeePhone?: string
  employeePin?: string
}

export interface OnboardingContextData {
  userId?: string
  tenantId?: string
  outletId?: string
  employeeId?: string
}
