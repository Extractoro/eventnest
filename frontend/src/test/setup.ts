import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server';
import { useAuthStore } from '../store/auth.store';

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  // Use the store's clearAuth action to properly reset all auth state.
  // Also clear localStorage so Zustand's persist middleware cannot replay stale tokens.
  useAuthStore.getState().clearAuth();
  localStorage.clear();
});
afterAll(() => server.close());

// ─── Mock react-toastify ──────────────────────────────────────────────────────
// Prevents "act(...)" warnings from toast animations in the test environment
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  ToastContainer: () => null,
}));

// ─── Suppress SCSS module import noise ───────────────────────────────────────
// vite.config.ts sets css: true, but CSS module class names are empty in jsdom
// This silences the "Could not find CSS variable" warnings from chart.js
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});
