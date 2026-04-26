import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useLogin, useLogout, useRegister } from './useAuth';
import { useAuthStore } from '../store/auth.store';
import { server } from '../test/server';
import { MOCK_ACCESS_TOKEN } from '../test/handlers';

/**
 * Creates a fresh wrapper per test so each renderHook gets its own
 * QueryClient and Router — prevents mutation cache bleed between tests.
 */
const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('useLogin', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it('sets auth store state after a successful login', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'Password1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe(MOCK_ACCESS_TOKEN);
    expect(state.role).toBe('user');
    expect(state.userId).toBe(42);
  });

  it('does not set auth state when login fails', async () => {
    // When /auth/login returns 401, the axios interceptor automatically tries to
    // refresh the token via /auth/refresh. We must also reject that request so
    // the interceptor calls clearAuth() instead of setAccessToken().
    server.use(
      http.post('http://localhost:8080/auth/login', () =>
        HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 }),
      ),
      http.post('http://localhost:8080/auth/refresh', () =>
        HttpResponse.json({ success: false, message: 'No refresh token' }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    act(() => {
      result.current.mutate({ email: 'wrong@example.com', password: 'WrongPass1' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});

describe('useLogout', () => {
  it('clears auth store state after logout', async () => {
    useAuthStore.getState().setAuth(42, 'user', MOCK_ACCESS_TOKEN);

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.userId).toBeNull();
  });
});

describe('useRegister', () => {
  it('resolves successfully with valid data', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });

    act(() => {
      result.current.mutate({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password1',
        phone: '',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('sets isError when registration fails (e.g. email conflict)', async () => {
    server.use(
      http.post('http://localhost:8080/auth/register', () =>
        HttpResponse.json({ success: false, message: 'Email already in use' }, { status: 409 }),
      ),
    );

    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });

    act(() => {
      result.current.mutate({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'taken@example.com',
        password: 'Password1',
        phone: '',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
