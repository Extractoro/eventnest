import { useEffect } from 'react';
import { useUiStore } from '../store/ui.store';

/** Syncs the Zustand theme state with a data-theme attribute on <html>. */
export const useTheme = () => {
  const theme = useUiStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
};
