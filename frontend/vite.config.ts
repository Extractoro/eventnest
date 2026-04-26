import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Test configuration lives in vitest.config.ts so this file stays
// free of vitest imports and works correctly in production builds.
export default defineConfig({
  plugins: [react()],
});
