import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './src',
  outputDir: '../../test-output/playwright/browser-extension-e2e',
  workers: 1, // launchPersistentContext holds an exclusive lock on the profile dir
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: '../../test-output/playwright-report',
        open: 'never',
      },
    ],
  ],
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'chromium-extension',
      use: { channel: 'chromium' },
    },
  ],
})
