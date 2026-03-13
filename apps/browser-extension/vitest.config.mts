import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/browser-extension',
  plugins: [react()],
  test: {
    name: 'browser-extension',
    watch: false,
    globals: true,
    clearMocks: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../test-output/coverage/browser-extension',
      provider: 'v8' as const,
    },
  },
}))
