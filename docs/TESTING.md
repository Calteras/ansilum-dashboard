# 💎 Diamond Grade Testing Setup with Vitest

## 🎯 Overview

This project uses **Vitest** for lightning-fast, comprehensive testing with first-class TypeScript support.

## 🚀 Quick Start

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests once (CI mode)
pnpm test:run

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   └── test-utils.tsx    # Custom render functions with providers
├── features/
│   └── auth/
│       ├── api/
│       │   └── auth.api.test.ts       # API layer tests
│       └── hooks/
│           └── use-login.test.tsx     # Hook tests
└── stores/
    └── auth-store.test.ts             # State management tests
```

## 🧪 Test Categories

### 1. **Unit Tests**
Test individual functions and components in isolation.

**Example:** `auth.api.test.ts`
```typescript
it('should successfully login with valid credentials', async () => {
  const result = await loginApi({
    email: 'admin@terrapos.com',
    password: 'admin123',
  })
  expect(result.user.email).toBe('admin@terrapos.com')
})
```

### 2. **Hook Tests**
Test custom React hooks with proper providers.

**Example:** `use-login.test.tsx`
```typescript
it('should validate email format', async () => {
  const { result } = renderHook(() => useLogin(), {
    wrapper: createWrapper(),
  })
  
  result.current.form.setValue('email', 'invalid-email')
  await result.current.form.trigger('email')
  
  expect(result.current.form.formState.errors.email).toBeDefined()
})
```

### 3. **Store Tests**
Test Zustand stores with localStorage persistence.

**Example:** `auth-store.test.ts`
```typescript
it('should persist auth state to localStorage', () => {
  const { result } = renderHook(() => useAuthStore())
  
  act(() => {
    result.current.setAuth(mockUser, 'token-456')
  })
  
  const stored = localStorage.getItem('terrapos_auth_token')
  expect(stored).toBeTruthy()
})
```

### 4. **Integration Tests**
Test multiple components working together.

**Example:** Component with Router and Query
```typescript
import { renderWithRouter } from '@/test/test-utils'

it('should navigate after login', async () => {
  const { router } = renderWithRouter(<LoginForm />, {
    initialEntries: ['/login'],
  })
  
  // ... perform login
  
  expect(router.state.location.pathname).toBe('/')
})
```

## 🛠️ Testing Utilities

### Custom Render Function
```typescript
import { render } from '@/test/test-utils'

it('should render with providers', () => {
  const { getByText } = render(<MyComponent />)
  expect(getByText('Hello')).toBeInTheDocument()
})
```

### Render with Router
```typescript
import { renderWithRouter } from '@/test/test-utils'

it('should work with routing', () => {
  const { getByRole } = renderWithRouter(<MyRouterComponent />)
  // Your assertions
})
```

## 📊 Coverage Requirements

Configured coverage thresholds (80% minimum):
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

View coverage report:
```bash
pnpm test:coverage
open coverage/index.html
```

## 🎨 Testing Best Practices

### ✅ DO:
1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - tests behavior
   expect(button).toHaveTextContent('Sign in')
   
   // ❌ Bad - tests implementation
   expect(component.state.isLoading).toBe(false)
   ```

2. **Use descriptive test names**
   ```typescript
   it('should display error when email is invalid')
   ```

3. **Arrange, Act, Assert (AAA) pattern**
   ```typescript
   it('should update user name', () => {
     // Arrange
     const user = { name: 'John' }
     
     // Act
     const updated = updateUserName(user, 'Jane')
     
     // Assert
     expect(updated.name).toBe('Jane')
   })
   ```

4. **Clean up after tests**
   ```typescript
   afterEach(() => {
     localStorage.clear()
     cleanup()
   })
   ```

5. **Test edge cases**
   ```typescript
   it('should handle empty string')
   it('should handle null values')
   it('should handle maximum length')
   ```

### ❌ DON'T:
1. Don't test external libraries (React, Zustand, etc.)
2. Don't write tests that depend on other tests
3. Don't test implementation details
4. Don't ignore async/await in tests
5. Don't mock everything - mock only what's necessary

## 🔧 Configuration

### vitest.config.ts
```typescript
export default defineConfig({
  test: {
    globals: true,           // No need to import describe, it, expect
    environment: 'jsdom',    // Browser-like environment
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

## 🎯 Testing Strategies by Layer

### 1. **API Layer Tests**
- Test successful responses
- Test error handling
- Test request parameters
- Test response data structure

### 2. **Hook Tests**
- Test initial state
- Test state changes
- Test side effects
- Test error states

### 3. **Store Tests**
- Test initial state
- Test actions
- Test persistence
- Test derived state

### 4. **Component Tests**
- Test rendering
- Test user interactions
- Test conditional rendering
- Test accessibility

## 🚨 Pre-commit Hooks

Tests run automatically before each commit:
```bash
git commit -m "feat: add login"
# Runs: lint → type-check → tests (changed files only)
```

## 📈 CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: pnpm test:run

- name: Generate coverage
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 🐛 Debugging Tests

### Run specific test file:
```bash
pnpm test src/features/auth/hooks/use-login.test.tsx
```

### Run tests matching pattern:
```bash
pnpm test --grep="login"
```

### Debug in VS Code:
1. Set breakpoint in test file
2. Run "Debug Test" from command palette
3. Step through your code

## 📚 Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Happy Testing! 💎 Write tests that give you confidence, not anxiety.**
