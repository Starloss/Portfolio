import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
      exclude: [
        '.eslintrc.*',
        'postcss.config.*',
        'tailwind.config.*',
        'vite.config.*',
        'vitest.config.*',
        'eslint.config.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
      ],
    },
  },
});
