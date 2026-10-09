import { type ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, type RenderOptions } from '@testing-library/react'

// Create a custom render function that includes providers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { queryClient, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Router test utilities
interface RouterRenderOptions extends CustomRenderOptions {
  initialEntries?: string[]
}

function renderWithRouter(ui: ReactElement, options?: RouterRenderOptions) {
  const {
    initialEntries = ['/'],
    queryClient,
    ...renderOptions
  } = options || {}

  const rootRoute = createRootRoute({
    component: () => ui,
  })

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({
      initialEntries,
    }),
  })

  const testQueryClient = queryClient || createTestQueryClient()

  return {
    ...render(
      <QueryClientProvider client={testQueryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
      renderOptions
    ),
    router,
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, renderWithRouter, createTestQueryClient }
