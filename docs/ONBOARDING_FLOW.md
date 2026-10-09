# TerraPOS Onboarding Flow Documentation

## Overview

The onboarding flow is a guided setup experience that helps new users create their TerraPOS account and configure the minimum required setup to start using the POS system.

## User Journey

### Step 1: Sign Up (Create Account)

- **URL**: `/onboarding`
- **Fields**:
  - Full Name (required, min 2 chars)
  - Email (required, valid email format)
  - Password (required, min 8 chars, uppercase + number)
  - Confirm Password (required, must match)
- **Actions**:
  - Calls `signUpApi()` to register the user
  - Stores user ID in context
- **Next**: Business Setup

### Step 2: Business Setup (Create Tenant)

- **URL**: `/onboarding?step=business`
- **Fields**:
  - Business Name (required, 2-100 chars)
  - Business Slug (required, 2-50 chars, lowercase with hyphens)
- **Auto-generation**: Slug is auto-generated from business name
- **Actions**:
  - Calls `createTenantApi()` to create business
  - Calls `setActiveTenantApi()` to activate the tenant
  - Stores tenant ID in context
- **Navigation**: Back/Continue buttons
- **Next**: Outlet Setup

### Step 3: Outlet Setup (Create First Location)

- **URL**: `/onboarding?step=outlet`
- **Fields**:
  - Outlet Name (required, 2-100 chars)
  - Outlet Code (required, uppercase + numbers, auto-generated)
  - Address (optional, 0-500 chars)
  - Phone (optional, valid phone format)
- **Auto-generation**: Code is auto-generated from outlet name (e.g., "TerraCafe" → "OUT-TER")
- **Actions**:
  - Calls `createOutletApi()` to create first outlet
  - Stores outlet ID in context
- **Navigation**: Back/Continue buttons
- **Next**: Employee Setup

### Step 4: Employee Setup (Add First Team Member - Optional)

- **URL**: `/onboarding?step=employee`
- **Fields**:
  - Employee Number (optional, default: "EMP-001")
  - Employee Name (required, 2-100 chars)
  - Email (optional, valid email)
  - Phone (optional, valid phone)
  - PIN (required, 4-6 digits)
- **Actions**:
  - Calls `createEmployeeApi()` to create employee
  - Sets employee role as "MANAGER"
  - Assigns to the created outlet
  - Stores employee ID in context
- **Navigation**: Back/Skip/Continue buttons
- **Skip Option**: User can skip employee creation and create it later
- **Next**: Completion

### Step 5: Completion & Next Steps

- **URL**: `/onboarding?step=completion`
- **Display**:
  - Success message with checkmark
  - Summary cards showing:
    - ✓ Business created
    - ✓ Outlet created
    - ✓ Employee created (if applicable)
  - Quick start tips
  - Links to documentation and support
- **Auto-redirect**: Redirects to `/dashboard` after 3 seconds
- **Action**: User can click "Go to Dashboard" button to proceed immediately

## Component Structure

```
src/features/auth/onboarding/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # TypeScript types
├── components/
│   ├── signup-step-form.tsx           # Step 1: Signup form
│   ├── business-step-form.tsx         # Step 2: Business form
│   ├── outlet-step-form.tsx           # Step 3: Outlet form
│   ├── employee-step-form.tsx         # Step 4: Employee form
│   ├── completion-step.tsx            # Step 5: Completion screen
│   └── onboarding-progress.tsx        # Progress indicator
src/routes/(auth)/onboarding.tsx       # Route definition
```

## Types & Interfaces

### OnboardingStep

```typescript
type OnboardingStep = 
  | 'signup'       // Create account
  | 'business'     // Create tenant/business
  | 'outlet'       // Create first outlet/location
  | 'employee'     // Add first employee (optional)
  | 'completion'   // Success confirmation
```

### OnboardingFormData

```typescript
interface OnboardingFormData {
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

  // Step 4: Employee
  employeeNo?: string
  employeeName?: string
  employeeEmail?: string
  employeePhone?: string
  employeePin?: string
}
```

### OnboardingContextData

```typescript
interface OnboardingContextData {
  userId?: string       // From step 1
  tenantId?: string     // From step 2
  outletId?: string     // From step 3
  employeeId?: string   // From step 4
}
```

## API Calls Made

1. **Step 1 - Signup**:
   - `POST /auth/sign-up/email` → Returns User + Session

2. **Step 2 - Business**:
   - `POST /auth/tenants` → Creates Tenant
   - `POST /auth/tenants/active` → Sets active tenant

3. **Step 3 - Outlet**:
   - `POST /outlets` → Creates Outlet

4. **Step 4 - Employee** (optional):
   - `POST /employees` → Creates Employee with PIN
   - Sets role as "MANAGER"
   - Assigns to created outlet

## Validation Rules

### Signup Step

- Name: 2-255 characters
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 number
- Password confirmation must match

### Business Step

- Business Name: 2-100 characters
- Business Slug: 2-50 chars, lowercase, hyphens and numbers only
- Slug auto-generated from name unless manually edited

### Outlet Step

- Outlet Name: 2-100 characters
- Outlet Code: Required, uppercase/numbers, auto-generated if not edited
- Address: Optional, max 500 characters
- Phone: Optional, valid phone format

### Employee Step

- Employee Name: Required, 2-100 characters
- Employee No: Optional, defaults to "EMP-001"
- Email: Optional, valid format if provided
- Phone: Optional, valid format if provided
- PIN: Required, 4-6 digits only

## Error Handling

Each form displays:

- Individual field validation errors
- API error messages in a top-level alert
- Loading state during API calls
- Disabled form inputs during submission

## UI Features

### Progress Indicator

- Desktop: Horizontal step visualization with connectors
- Mobile: Vertical step list
- Shows completed ✓, current (highlighted), and upcoming steps
- Progress bar at bottom showing percentage complete

### Form Validation

- Real-time field validation
- Zod schema validation
- Auto-generation of codes/slugs where applicable
- Clear error messages

### Responsive Design

- Mobile-first approach
- Adapts to different screen sizes
- Touch-friendly input fields and buttons
- Appropriate spacing and typography

### Loading States

- Button text changes during submission (e.g., "Creating Account...")
- Form inputs disabled during submission
- No double-submit possible

## After Onboarding

Once the user completes onboarding:

1. They are redirected to the dashboard
2. They can:
   - Set up menu items and categories
   - Add more employees
   - Create additional outlets
   - Configure inventory and recipes
   - Start processing transactions

## Accessing Onboarding

### From Sign-up Page

- User clicks "Start Setup" button on `/sign-up`
- Redirects to `/onboarding`

### Direct Link

- Users can navigate directly to `/onboarding`
- If not authenticated, should redirect to `/sign-in`

## Future Enhancements

- [ ] Multi-language support
- [ ] Save progress and resume later
- [ ] Invite team members during onboarding
- [ ] Setup menu templates based on business type
- [ ] Video tutorials for each step
- [ ] Help chat/support during onboarding
- [ ] Skip to specific steps for advanced users
- [ ] Email verification before proceeding

## Testing Scenarios

1. **Happy Path**: Complete all 5 steps successfully
2. **Skip Employee**: Complete steps 1-3 and skip step 4
3. **Validation Errors**: Try invalid inputs at each step
4. **Back Navigation**: Navigate back and modify previous steps
5. **Network Errors**: Simulate API failures at each step
6. **Session Expiry**: Simulate session timeout during flow
