import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

interface RenderWithProvidersOptions extends RenderOptions {
  /** Initial URL entries for MemoryRouter (default: ['/']) */
  initialEntries?: MemoryRouterProps['initialEntries'];
}

/**
 * Pattern: Factory Method
 * Creates a fresh QueryClient per test to prevent cache bleed between tests.
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries so tests fail fast on API errors
        retry: false,
        // Disable stale-while-revalidate so queries fire predictably
        staleTime: Infinity,
      },
      mutations: { retry: false },
    },
  });

/**
 * Renders a component wrapped in all providers required by the app:
 *  - QueryClientProvider (fresh client per test)
 *  - MemoryRouter (no real browser history)
 */
export const renderWithProviders = (
  ui: ReactNode,
  { initialEntries = ['/'], ...options }: RenderWithProvidersOptions = {},
) => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
};
