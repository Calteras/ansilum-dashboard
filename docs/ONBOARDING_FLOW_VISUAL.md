# Onboarding Flow - Visual Guide & User Experience

## Complete User Journey Flow Chart

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TERRAPOS ONBOARDING FLOW DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              🔐 NOT AUTHENTICATED

                                     │
                                     ▼
                         ┌──────────────────────┐
                         │   Landing / Sign-up  │
                         │  Route: /sign-up     │
                         └──────────────────────┘
                                     │
                              [Start Setup Button]
                                     │
                                     ▼
                    ╔═══════════════════════════════════════╗
                    ║   STEP 1: ACCOUNT CREATION (🔓)       ║
                    ║   Route: /onboarding                  ║
                    ╟───────────────────────────────────────╢
                    ║ • Full Name                           ║
                    ║ • Email Address                       ║
                    ║ • Password (8+ chars)                 ║
                    ║ • Confirm Password                    ║
                    ║                                       ║
                    ║ API: POST /auth/sign-up/email        ║
                    ║ Stores: userId                        ║
                    ╚═══════════════════════════════════════╝
                                     │
                            [Continue Button]
                                     │
                                     ▼
                    ╔═══════════════════════════════════════╗
                    ║   STEP 2: BUSINESS SETUP (🏢)        ║
                    ║   Progress: 40%                       ║
                    ╟───────────────────────────────────────╢
                    ║ • Business Name                       ║
                    ║ • Business Slug (auto-generated)      ║
                    ║                                       ║
                    ║ API: POST /auth/tenants              ║
                    ║       POST /auth/tenants/active      ║
                    ║ Stores: tenantId                      ║
                    ╚═══════════════════════════════════════╝
                                     │
                         ┌───────────┴───────────┐
                         │  [Back]  [Continue]  │
                         └───────────┬───────────┘
                                     │
                                     ▼
                    ╔═══════════════════════════════════════╗
                    ║   STEP 3: OUTLET CREATION (📍)       ║
                    ║   Progress: 60%                       ║
                    ╟───────────────────────────────────────╢
                    ║ • Outlet Name                         ║
                    ║ • Outlet Code (auto-generated)        ║
                    ║ • Address (optional)                  ║
                    ║ • Phone (optional)                    ║
                    ║                                       ║
                    ║ API: POST /outlets                    ║
                    ║ Stores: outletId                      ║
                    ╚═══════════════════════════════════════╝
                                     │
                         ┌───────────┴───────────┐
                         │  [Back]  [Continue]  │
                         └───────────┬───────────┘
                                     │
                                     ▼
                    ╔═══════════════════════════════════════╗
                    ║   STEP 4: EMPLOYEE SETUP (👤)        ║
                    ║   Progress: 80%                       ║
                    ║   [OPTIONAL - Can Skip]               ║
                    ╟───────────────────────────────────────╢
                    ║ • Employee Name                       ║
                    ║ • Employee Number                     ║
                    ║ • Email (optional)                    ║
                    ║ • Phone (optional)                    ║
                    ║ • PIN (4-6 digits)                    ║
                    ║                                       ║
                    ║ API: POST /employees                  ║
                    ║ Stores: employeeId                    ║
                    ╚═══════════════════════════════════════╝
                                     │
                         ┌───────────┼───────────┐
                         │           │           │
                    [Back]      [Skip]      [Continue]
                         │           │           │
                         └───────────┴───────────┘
                                     │
                                     ▼
                    ╔═══════════════════════════════════════╗
                    ║   STEP 5: COMPLETION (✅)            ║
                    ║   Progress: 100%                      ║
                    ╟───────────────────────────────────────╢
                    ║ ✓ Account Created                    ║
                    ║ ✓ Business Setup Complete            ║
                    ║ ✓ First Outlet Created               ║
                    ║ ✓ Employee Added (if applicable)     ║
                    ║                                       ║
                    ║ Next Steps:                           ║
                    ║ • Set up menu & categories           ║
                    ║ • Add more employees                 ║
                    ║ • Configure inventory                ║
                    ║                                       ║
                    ║ [Go to Dashboard]                    ║
                    ║ Auto-redirect in 3 seconds...        ║
                    ╚═══════════════════════════════════════╝
                                     │
                      Auto-redirect or click button
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │    DASHBOARD         │
                         │ Route: /dashboard    │
                         │                      │
                         │ 🎉 Ready to Use!    │
                         └──────────────────────┘
```

## Step-by-Step Breakdown

### 📋 Step 1: Account Creation

```
START SETUP
    ↓
┌─────────────────────────────┐
│ Create Your Account         │
├─────────────────────────────┤
│ Full Name: [____________]   │
│ Email: [__________________] │
│ Password: [________________]│
│ Confirm: [________________] │
│                             │
│         [Continue]          │
└─────────────────────────────┘
    ↓
User registered
Session created
Progress: 20%
```

### 🏢 Step 2: Business Setup

```
┌─────────────────────────────┐
│ Set Up Your Business        │
├─────────────────────────────┤
│ Business Name:              │
│ [TerraCafe Indonesia]       │
│                             │
│ Slug (Auto-generated):      │
│ [terracafe-indonesia] ✏️    │
│                             │
│ [Back]         [Continue]   │
└─────────────────────────────┘
    ↓
Tenant created
Active tenant set
Progress: 40%
```

### 📍 Step 3: Outlet Creation

```
┌─────────────────────────────┐
│ Create Your First Outlet    │
├─────────────────────────────┤
│ Outlet Name:                │
│ [TerraCafe - Mall Central]  │
│                             │
│ Outlet Code (Auto):         │
│ [OUT-TER] ✏️                │
│                             │
│ Address:                    │
│ [Mall Central Lt. 2]        │
│                             │
│ Phone:                      │
│ [+62-21-1234567]           │
│                             │
│ [Back]         [Continue]   │
└─────────────────────────────┘
    ↓
Outlet created
Progress: 60%
```

### 👤 Step 4: Employee Setup (Optional)

```
┌─────────────────────────────┐
│ Add Team Member (Optional)  │
├─────────────────────────────┤
│ Employee Name:              │
│ [Sarah Cashier]             │
│                             │
│ Employee #:                 │
│ [EMP-001]                   │
│                             │
│ Email:                      │
│ [sarah@example.com]         │
│                             │
│ PIN (for POS):              │
│ [••••]                      │
│                             │
│ [Back] [Skip] [Continue]    │
└─────────────────────────────┘
    ↓
Employee created (or skipped)
Progress: 80%
```

### ✅ Step 5: Completion

```
┌─────────────────────────────┐
│ Welcome to TerraPOS! ✨     │
├─────────────────────────────┤
│ ✓ Account Created          │
│ ✓ Business Ready            │
│ ✓ Outlet Configured         │
│ ✓ Employee Added            │
│                             │
│ Next Steps:                 │
│ • Add menu items            │
│ • Configure recipes         │
│ • Set inventory             │
│                             │
│      [Go to Dashboard]      │
│                             │
│ Redirecting in 3 seconds... │
└─────────────────────────────┘
    ↓
Auto-redirect to /dashboard
```

## Progress Visualization

### Desktop View (Horizontal)

```
1️⃣ ─── 2️⃣ ─── 3️⃣ ─── 4️⃣ ─── ✓5️⃣
Create    Set Up   Create  Add      Complete
Account   Business Outlet  Team     ✅
```

### Mobile View (Vertical)

```
1️⃣ Create Account      ✓ Completed
2️⃣ Set Up Business     ✓ Completed
3️⃣ Create Outlet       ✓ Completed
4️⃣ Add Team Member     → Current
5️⃣ Complete            ⬜ Upcoming

Progress: ████████░░ 80%
```

## State Management Flow

```
┌──────────────────────────────────────────┐
│       Component State Management          │
└──────────────────────────────────────────┘

START
  ↓
currentStep = 'signup'
contextData = {}
formData = {}
isLoading = false
  ↓
┌─────────────────────────────┐
│ User Fills Step 1           │
└─────────────────────────────┘
  ↓
onSubmit(data)
  ├─ setIsLoading(true)
  ├─ call signUpApi()
  ├─ setContextData({ userId })
  ├─ setFormData({ name, email, ... })
  ├─ setIsLoading(false)
  └─ setCurrentStep('business')
  ↓
┌─────────────────────────────┐
│ Display Step 2              │
└─────────────────────────────┘
  ↓
[Repeat for each step...]
  ↓
setCurrentStep('completion')
  ↓
Auto-redirect to /dashboard
```

## API Sequence Diagram

```
Browser                          Backend
   │                                │
   ├─ POST /auth/sign-up/email ──→ │ Create User
   │←─ {user, session} ────────────┤
   │                                │
   ├─ POST /auth/tenants ─────────→ │ Create Tenant
   │←─ {tenant} ────────────────────┤
   │                                │
   ├─ POST /auth/tenants/active ──→ │ Set Active
   │←─ {activeTenantId} ────────────┤
   │                                │
   ├─ POST /outlets ───────────────→ │ Create Outlet
   │←─ {outlet} ────────────────────┤
   │                                │
   ├─ POST /employees ─────────────→ │ Create Employee
   │←─ {employee} ──────────────────┤
   │                                │
   └─────────────────────────────────┘
   
   Redirect to Dashboard
```

## Error Handling Flows

```
┌─────────────────────────┐
│   Error During Step X   │
├─────────────────────────┤
│                         │
│ ❌ Error displayed      │
│ Form stays on Step X    │
│ Data retained           │
│ User can retry          │
│                         │
│ Can go back to edit     │
│ previous steps          │
│                         │
└─────────────────────────┘
```

## Validation States

```
Empty State          Validation Error     Valid State
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │ ❌ Error     │     │ ✓ Valid      │
│ [       ]    │     │ [          ]│     │ [          ] │
│              │     │ Max 100 ch  │     │              │
│              │     │ ^^ Error    │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

Button: disabled     Button: disabled     Button: enabled
```

## Component Hierarchy

```
Onboarding (Main)
  ├── OnboardingProgress
  │   ├── Desktop Layout (Horizontal)
  │   └── Mobile Layout (Vertical)
  │
  └── Card Container
      ├── SignupStepForm (Step 1)
      │   ├── Input: Name
      │   ├── Input: Email
      │   ├── PasswordInput: Password
      │   ├── PasswordInput: Confirm
      │   └── Button: Continue
      │
      ├── BusinessStepForm (Step 2)
      │   ├── Input: Business Name
      │   ├── Input: Business Slug
      │   ├── Button: Back
      │   └── Button: Continue
      │
      ├── OutletStepForm (Step 3)
      │   ├── Input: Outlet Name
      │   ├── Input: Outlet Code
      │   ├── Textarea: Address
      │   ├── Input: Phone
      │   ├── Button: Back
      │   └── Button: Continue
      │
      ├── EmployeeStepForm (Step 4)
      │   ├── Input: Employee No
      │   ├── Input: Employee Name
      │   ├── Input: Email
      │   ├── Input: Phone
      │   ├── PasswordInput: PIN
      │   ├── Button: Back
      │   ├── Button: Skip
      │   └── Button: Continue
      │
      └── CompletionStep (Step 5)
          ├── Success Message
          ├── Summary Cards
          ├── Next Steps List
          ├── Button: Go to Dashboard
          └── Auto-redirect Timer
```
