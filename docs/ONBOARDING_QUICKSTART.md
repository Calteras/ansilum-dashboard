# Onboarding Integration Quick Start

## 🚀 Quick Start

### Access Onboarding Flow

**Direct URL**:

```
http://localhost:5173/onboarding
```

**From Sign-Up Page**:

```
http://localhost:5173/sign-up → [Click "Start Setup"]
```

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/sign-up` | `SignUp` | Landing page with Start Setup button |
| `/onboarding` | `Onboarding` | Main 5-step onboarding flow |
| `/dashboard` | Dashboard | Redirect after completion |

## 📁 File Structure

```
src/
├── features/
│   └── auth/
│       ├── onboarding/
│       │   ├── index.tsx                 # Main component (380 lines)
│       │   ├── types.ts                  # Types definition (45 lines)
│       │   └── components/
│       │       ├── index.ts              # Exports (6 components)
│       │       ├── signup-step-form.tsx       # Step 1
│       │       ├── business-step-form.tsx     # Step 2
│       │       ├── outlet-step-form.tsx       # Step 3
│       │       ├── employee-step-form.tsx     # Step 4
│       │       ├── completion-step.tsx        # Step 5
│       │       └── onboarding-progress.tsx    # Progress indicator
│       └── sign-up/
│           └── index.tsx                 # Updated with link
│
├── routes/
│   └── (auth)/
│       ├── sign-up.tsx                   # Updated route
│       └── onboarding.tsx                # New route
│
└── docs/
    ├── ONBOARDING_FLOW.md               # Main documentation
    ├── ONBOARDING_FLOW_VISUAL.md        # Visual guides
    └── ONBOARDING_TESTING.md            # Testing guide
```

## 🔗 Dependencies

### Already in Project

- ✅ `react` - UI framework
- ✅ `@tanstack/react-router` - Routing
- ✅ `react-hook-form` - Form handling
- ✅ `zod` - Validation
- ✅ `@hookform/resolvers` - Form validation
- ✅ `shadcn/ui` - UI components
- ✅ `tailwindcss` - Styling
- ✅ `lucide-react` - Icons

### No Additional Dependencies Required ✅

## 🔧 Configuration

### Environment Variables

No new environment variables needed. Uses existing `API_BASE_URL` from config.

### API Endpoints

All endpoints already documented in `API_ONBOARDING.md`:

```
POST /auth/sign-up/email          # Step 1
POST /auth/tenants                # Step 2
POST /auth/tenants/active         # Step 2
POST /outlets                      # Step 3
POST /employees                    # Step 4
```

## 📝 Code Examples

### Basic Usage

```tsx
import { Onboarding } from '@/features/auth/onboarding'

// In a route file
export const Route = createFileRoute('/(auth)/onboarding')({
  component: Onboarding,
})
```

### Importing Components

```tsx
import {
  SignupStepForm,
  BusinessStepForm,
  OutletStepForm,
  EmployeeStepForm,
  CompletionStep,
  OnboardingProgress,
} from '@/features/auth/onboarding/components'
```

### Type Usage

```tsx
import type {
  OnboardingStep,
  OnboardingFormData,
  OnboardingContextData,
} from '@/features/auth/onboarding/types'
```

## 🎨 Customization

### Change Progress Colors

Edit `onboarding-progress.tsx`:

```tsx
// Change bg-blue-600 to your color
className={`bg-blue-600 text-white ring-4 ring-blue-200`}
```

### Modify Step Order

Edit `types.ts` and `components/onboarding-progress.tsx`:

```tsx
type OnboardingStep = 'custom-step-1' | 'custom-step-2' | ...
```

### Adjust Auto-Redirect Timing

Edit `completion-step.tsx`:

```tsx
// Change 3000 to desired milliseconds
setTimeout(() => {
  void navigate({ to: '/dashboard' })
}, 3000)
```

### Update Button Text

Search and replace in each form component:

```tsx
// Example in signup-step-form.tsx
{isLoading ? 'Creating Account...' : 'Continue'}
```

## 🧪 Testing Locally

```bash
# Start development server
npm run dev

# Visit signup page
http://localhost:5173/sign-up

# Or jump directly to onboarding
http://localhost:5173/onboarding

# Check console for any errors
```

## 🐛 Debugging

### Enable Console Logging

Edit `src/features/auth/onboarding/index.tsx`:

```tsx
const handleSignup = useCallback(async (data: OnboardingFormData) => {
  console.log('Step 1 - Signup:', data)
  try {
    // ... rest of code
  }
}, [])
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Submit forms
4. Review API responses

### Verify State

Add to component:

```tsx
useEffect(() => {
  console.log('Current step:', currentStep)
  console.log('Context data:', contextData)
  console.log('Form data:', formData)
}, [currentStep, contextData, formData])
```

## 📱 Mobile Testing

```bash
# Generate QR code or use ngrok for mobile access
npm run dev -- --host

# Then visit from mobile device
http://[your-ip]:5173/sign-up
```

## 🚨 Common Issues

### Forms Not Submitting

- Check browser console for validation errors
- Verify all required fields are filled
- Ensure API endpoint URLs are correct

### Redirect Not Working

- Check React Router setup
- Verify `/dashboard` route exists
- Check browser console for navigation errors

### Icons Not Showing

- Ensure `lucide-react` is installed: `npm install lucide-react`
- Check icon names are correct

### Styles Not Applied

- Clear browser cache
- Rebuild project: `npm run build`
- Check Tailwind configuration

## 📊 Monitoring

### Track Completion

Monitor these metrics post-launch:

- Signup success rate
- Dropout rate per step
- Average time per step
- Error frequency
- Mobile vs desktop completion

### Add Analytics (Optional)

```tsx
// Example with your analytics library
import { trackEvent } from '@/lib/analytics'

const handleSignup = async (data) => {
  try {
    trackEvent('onboarding_step_1_completed')
    // ... rest
  }
}
```

## 🎯 Next Steps

1. **Test the flow** - Follow ONBOARDING_TESTING.md
2. **Customize styling** - Match your brand guidelines
3. **Add analytics** - Track user progression
4. **Deploy** - Follow your deployment process
5. **Monitor** - Watch for issues in production

## 📞 Support

For issues or questions:

1. Check ONBOARDING_FLOW.md for detailed docs
2. Review ONBOARDING_FLOW_VISUAL.md for diagrams
3. Follow ONBOARDING_TESTING.md for troubleshooting
4. Check API_ONBOARDING.md for API details

## 📋 Checklist for Go-Live

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] API endpoints verified with backend team
- [ ] Mobile testing completed
- [ ] Browser compatibility verified
- [ ] Accessibility audit passed
- [ ] Documentation reviewed by team
- [ ] Team trained on new flow
- [ ] Monitoring dashboard set up
- [ ] Rollback plan prepared
