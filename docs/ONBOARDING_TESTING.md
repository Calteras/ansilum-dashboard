# Onboarding Flow - Implementation & Testing Guide

## ✅ Implementation Checklist

### Core Files Created

- [x] `src/features/auth/onboarding/types.ts` - Type definitions
- [x] `src/features/auth/onboarding/index.tsx` - Main component
- [x] `src/features/auth/onboarding/components/index.ts` - Component exports
- [x] `src/features/auth/onboarding/components/signup-step-form.tsx`
- [x] `src/features/auth/onboarding/components/business-step-form.tsx`
- [x] `src/features/auth/onboarding/components/outlet-step-form.tsx`
- [x] `src/features/auth/onboarding/components/employee-step-form.tsx`
- [x] `src/features/auth/onboarding/components/completion-step.tsx`
- [x] `src/features/auth/onboarding/components/onboarding-progress.tsx`
- [x] `src/routes/(auth)/onboarding.tsx` - Route definition
- [x] `docs/ONBOARDING_FLOW.md` - Documentation
- [x] `docs/ONBOARDING_FLOW_VISUAL.md` - Visual guides

### Integration Tasks

- [x] Update `/sign-up` page to link to onboarding
- [x] Verify API imports are correct
- [x] Check component dependencies (shadcn/ui, react-hook-form, zod)

### Remaining Tasks (Optional Enhancements)

- [ ] Add analytics tracking for onboarding completion
- [ ] Add session storage for progress recovery
- [ ] Implement email verification step
- [ ] Add multi-language support
- [ ] Create admin dashboard for viewing user onboarding metrics
- [ ] Add video tutorials for each step
- [ ] Implement help/support chat integration
- [ ] Add template selection for business type

## 🧪 Testing Guide

### Test Environment Setup

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start development server
npm run dev

# 3. Navigate to sign-up page
http://localhost:5173/sign-up

# 4. Click "Start Setup" to begin onboarding
```

### Manual Testing Scenarios

#### 1. Happy Path (Complete All Steps)

```
✓ Step 1: Create account
  - Enter: Name = "John Doe"
  - Enter: Email = "john@example.com"
  - Enter: Password = "SecurePass123"
  - Enter: Confirm = "SecurePass123"
  - Click: Continue
  - Expected: Move to Step 2

✓ Step 2: Business setup
  - Enter: Business Name = "TerraCafe"
  - Notice: Slug auto-generated as "terracafe"
  - Click: Continue
  - Expected: Move to Step 3

✓ Step 3: Outlet setup
  - Enter: Outlet Name = "Main Branch"
  - Notice: Code auto-generated as "OUT-MAI"
  - Enter: Address = "123 Main St"
  - Enter: Phone = "+62-812-1234567"
  - Click: Continue
  - Expected: Move to Step 4

✓ Step 4: Employee setup
  - Enter: Employee Name = "Sarah"
  - Enter: PIN = "1234"
  - Click: Continue
  - Expected: Move to Step 5

✓ Step 5: Completion
  - Verify: Success message displayed
  - Verify: Summary cards show created items
  - Wait: 3 seconds auto-redirect OR Click "Go to Dashboard"
  - Expected: Redirect to /dashboard
```

#### 2. Skip Employee Path

```
✓ Step 1-3: Complete as above
✓ Step 4: Employee setup (SKIP)
  - Click: Skip button
  - Expected: Skip to Step 5 without employee creation

✓ Step 5: Completion
  - Notice: Employee summary card not shown
  - All other steps completed
  - Expected: Redirect to dashboard
```

#### 3. Back Navigation

```
✓ Step 1: Complete signup
✓ Step 2: Business setup
  - Click: Back button
  - Expected: Return to Step 1, data retained

✓ Step 1: Modify name
  - Change name to "Jane Smith"
  - Click: Continue
  - Expected: Proceed with new name

✓ Step 2: Complete business setup
✓ Step 3: Outlet setup
  - Click: Back
  - Expected: Return to Step 2
  
✓ Step 2: Data retained
  - Expected: Business name and slug still filled
```

### Validation Testing

#### Step 1 - Signup Validation

| Field | Invalid Input | Expected Error |
|-------|---------------|---|
| Name | "A" | "Name must be at least 2 characters" |
| Email | "invalid" | "Please enter a valid email" |
| Password | "Pass1" | "Password must be at least 8 characters" |
| Password | "password123" | "Password must contain an uppercase letter" |
| Password | "Password" | "Password must contain a number" |
| Confirm | "Pass@1234" | "Passwords don't match" |

**Test Cases**:

```
1. Enter valid name
   - Expected: No error

2. Leave name empty, click Continue
   - Expected: Name error shown, form not submitted

3. Enter invalid email (e.g., "notanemail")
   - Expected: Email error shown

4. Enter password < 8 chars
   - Expected: Password length error

5. Enter passwords that don't match
   - Expected: Confirmation error shown

6. Fix all errors and submit
   - Expected: Proceed to Step 2
```

#### Step 2 - Business Validation

| Field | Invalid Input | Expected Error |
|-------|---------------|---|
| Business Name | "A" | "Business name must be at least 2 characters" |
| Business Slug | "INVALID" | "Slug must contain only lowercase..." |
| Slug | "invalid name" | "Slug must contain only lowercase..." |

**Test Cases**:

```
1. Auto-generation test
   - Enter: "My Cafe"
   - Expected: Slug becomes "my-cafe"

2. Override slug
   - Enter Name: "Awesome Cafe"
   - Auto-generates: "awesome-cafe"
   - Manually change to: "awesome-coffee-shop"
   - Click Back and forth
   - Expected: Manual slug retained

3. Invalid slug format
   - Try entering: "invalid slug"
   - Expected: Error and validation message
```

#### Step 3 - Outlet Validation

| Field | Invalid Input | Expected Error |
|-------|---------------|---|
| Outlet Name | "X" | "Outlet name must be at least 2 characters" |
| Outlet Code | "invalid" | "Code must contain only uppercase..." |
| Phone | "abc123" | "Please enter a valid phone number" |

**Test Cases**:

```
1. Auto-code generation
   - Enter: "Downtown Branch"
   - Expected: Code becomes "OUT-DOW"

2. Manual code override
   - Enter: "Central Hub"
   - Auto-generates: "OUT-CEN"
   - Manually change to: "OUT-CENTRAL"
   - Expected: No errors, accepted

3. Address length limit
   - Enter > 500 characters
   - Expected: Error shown

4. Phone format
   - Valid: "+62-812-1234567" ✓
   - Valid: "0812-1234-567" ✓
   - Invalid: "abc123" ✗
```

#### Step 4 - Employee Validation

| Field | Invalid Input | Expected Error |
|-------|---------------|---|
| Employee Name | "X" | "Employee name must be at least 2 characters" |
| PIN | "12" | "PIN must be 4-6 digits" |
| PIN | "1234567" | "PIN must be 4-6 digits" |
| Email | "invalid" | "Please enter a valid email" |

**Test Cases**:

```
1. PIN validation
   - Enter: "123" → Error (too short)
   - Enter: "1234" → OK ✓
   - Enter: "123456" → OK ✓
   - Enter: "1234567" → Error (too long)
   - Enter: "12ab" → Error (non-digits)

2. All optional except name and PIN
   - Enter only Name and PIN
   - Leave Email/Phone empty
   - Expected: Submit successfully

3. Employee number default
   - Leave Employee # empty
   - Expected: Defaults to "EMP-001"
```

### API Integration Testing

#### Mock Successful Responses

```javascript
// Step 1: Signup Success
Response:
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "session": {
    "id": "session_123",
    "token": "token_abc",
    "expiresAt": "2024-01-22T10:00:00Z"
  }
}

// Step 2: Tenant Creation Success
Response:
{
  "id": "tenant_123",
  "name": "TerraCafe",
  "slug": "terracafe",
  "code": "TEN-ABC123",
  "isActive": true
}

// Step 3: Outlet Creation Success
Response:
{
  "id": "outlet_123",
  "name": "Main Branch",
  "code": "OUT-MAI",
  "address": "123 Main St",
  "isActive": true
}

// Step 4: Employee Creation Success
Response:
{
  "id": "emp_123",
  "employeeNo": "EMP-001",
  "name": "Sarah",
  "role": "MANAGER",
  "isActive": true
}
```

#### API Error Scenarios

```javascript
// Test Case 1: Email Already Exists
Request: signUpApi({ email: "existing@example.com" })
Response: 409 Conflict
Body: { message: "Email already exists" }
Expected: Error displayed, form not submitted

// Test Case 2: Slug Duplicate
Request: createTenantApi({ slug: "existing-business" })
Response: 409 Conflict
Body: { message: "Slug already taken" }
Expected: Error shown, user can modify and retry

// Test Case 3: Network Error
Network Timeout
Expected: Generic error message, retry option

// Test Case 4: 500 Server Error
Response: 500 Internal Server Error
Expected: User-friendly error message, retry button
```

### Performance Testing

```
Metrics to Monitor:
- Initial page load: < 2 seconds
- Form submission: < 3 seconds per step
- Progress indicator re-render: < 100ms
- Navigation between steps: < 500ms

Browser DevTools:
1. Open Network tab
2. Check each API call duration
3. Verify no console errors
4. Check memory usage (should be < 50MB)
```

### Responsive Design Testing

#### Mobile (iPhone 12)

```
✓ Viewport: 390 x 844
✓ Forms stack properly
✓ Buttons are touch-friendly (44px min height)
✓ Progress bar visible
✓ Vertical step list shown (not horizontal)
✓ No horizontal scrolling
✓ Text readable without zoom
```

#### Tablet (iPad)

```
✓ Viewport: 768 x 1024
✓ Centered layout with proper padding
✓ Progress indicator responsive
✓ Form fields have good spacing
```

#### Desktop (1920 x 1080)

```
✓ Horizontal progress bar shown
✓ Max-width container respected
✓ Form positioned in center
✓ All elements properly aligned
```

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

### Accessibility Testing

```
✓ Keyboard navigation
  - Tab through all form fields
  - Shift+Tab backwards navigation
  - Enter to submit

✓ Screen reader
  - Form labels read correctly
  - Error messages announced
  - Progress steps readable

✓ Color contrast
  - All text has sufficient contrast
  - No color-only indicators
  - Error states clear

✓ Focus management
  - Focus visible on all inputs
  - Focus order logical
  - No focus traps
```

## 🐛 Common Issues & Solutions

### Issue: Slug not auto-generating

**Solution**: Check that `form.formState.dirtyFields` is working. Ensure field change handler is triggering properly.

### Issue: Password validation too strict

**Solution**: Review password regex in `signupSchema`. Adjust requirements if needed.

### Issue: Auto-redirect not working

**Solution**: Check `useNavigate` hook, ensure it's from `@tanstack/react-router`. Verify navigation delay timer.

### Issue: API calls failing silently

**Solution**: Add `console.log` in error handlers. Check network tab in DevTools. Verify API endpoints are correct.

### Issue: Form fields not retaining values on back

**Solution**: Ensure state updates include previous form data: `setFormData((prev) => ({ ...prev, ...data }))`

## 📊 Test Coverage Goals

- [ ] 90%+ line coverage
- [ ] All validation rules tested
- [ ] All API scenarios tested
- [ ] All navigation paths tested
- [ ] Error states tested
- [ ] Mobile responsiveness verified

## 🚀 Pre-Launch Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] API endpoints verified with backend team
- [ ] Error messages reviewed for clarity
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] UI screenshots captured
- [ ] Documentation complete
- [ ] Team training scheduled
- [ ] Rollout plan prepared
