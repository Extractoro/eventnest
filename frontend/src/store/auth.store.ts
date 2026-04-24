import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '../types';

interface AuthState {
  userId: number | null;
  role: Role | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (userId: number, role: Role, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      userId: null,
      role: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (userId, role, accessToken) =>
        set({ userId, role, accessToken, isAuthenticated: true }),
      setAccessToken: accessToken => set({ accessToken }),
      clearAuth: () =>
        set({ userId: null, role: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth',
      // Only persist userId and role — accessToken lives in memory only
      partialize: s => ({ userId: s.userId, role: s.role }),
    },
  ),
);
