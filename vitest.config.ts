import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Las pruebas de Playwright corren aparte, contra el sitio construido.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
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
        'e2e/**',
        'scripts/**',
        'playwright.config.*',
        'src/app/prototypes/**',
        // Datos generados por scripts/avila-profile.ts.
        'src/app/scene/avila-data.ts',
        // Medidas generadas por scripts/images.ts.
        'src/content/data/image-sizes.ts',
      ],
    },
  },
});
