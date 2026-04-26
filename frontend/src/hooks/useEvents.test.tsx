import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useEvents, useEvent } from './useEvents';
import { server } from '../test/server';
import { MOCK_EVENT, MOCK_EVENT_2 } from '../test/handlers';
import type { ApiResponse, Event, PaginatedResponse } from '../types';

/** Minimal wrapper that provides a fresh QueryClient to the hook under test. */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('useEvents', () => {
  it('returns the event list from the API', async () => {
    const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data[0].event_name).toBe(MOCK_EVENT.event_name);
    expect(result.current.data?.total).toBe(2);
  });

  it('passes filter params to the API', async () => {
    let capturedUrl = '';
    server.use(
      http.get('http://localhost:8080/events', ({ request }) => {
        capturedUrl = request.url;
        const body: ApiResponse<PaginatedResponse<Event>> = {
          success: true,
          message: 'OK',
          data: { data: [MOCK_EVENT], total: 1, page: 1, limit: 12 },
        };
        return HttpResponse.json(body);
      }),
    );

    const { result } = renderHook(
      () => useEvents({ city: 'Kharkiv', page: 2 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('city=Kharkiv');
    expect(capturedUrl).toContain('page=2');
  });

  it('sets isError when the API returns 500', async () => {
    server.use(
      http.get('http://localhost:8080/events', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useEvent', () => {
  it('returns a single event by id', async () => {
    const { result } = renderHook(() => useEvent(MOCK_EVENT_2.event_id), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.event_name).toBe(MOCK_EVENT_2.event_name);
  });

  it('is disabled when id is 0 (falsy)', () => {
    const { result } = renderHook(() => useEvent(0), { wrapper: createWrapper() });
    // fetchStatus is 'idle' because enabled=false prevents the query from running
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('sets isError when the event is not found', async () => {
    server.use(
      http.get('http://localhost:8080/events/999', () =>
        HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useEvent(999), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
