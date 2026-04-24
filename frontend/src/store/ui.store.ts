import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      theme: 'light',
      toggleTheme: () =>
        set(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'ui' },
  ),
);
