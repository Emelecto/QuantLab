import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate config for DOM integration tests (jsdom).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    types: ['vitest/globals', '@testing-library/jest-dom'],
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
