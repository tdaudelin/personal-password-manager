import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'
import path from 'path'
export default defineConfig(() => ({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@ppm/core': path.resolve(
        import.meta.dirname,
        '../../libs/core/src/index.ts',
      ),
      '@ppm/shared': path.resolve(
        import.meta.dirname,
        '../../libs/shared/src/index.ts',
      ),
    },
  },
  cacheDir: '../../node_modules/.vite/apps/browser-extension',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [
    react(),
    webExtension({
      manifest: 'src/manifest.json',
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}))
