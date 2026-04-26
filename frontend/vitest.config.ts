import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Extends the production Vite config with test-only settings.
// This file is only loaded by the `vitest` CLI, never by `vite build`.
export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      VITE_API_URL: 'http://localhost:8080',
    },
  },
}));
