import { test, expect, chromium } from '@playwright/test'
import path from 'path'

const distDir = path.resolve(__dirname, '../../browser-extension/dist')

test('popup renders Hello World', async () => {
  const userDataDir = path.resolve(__dirname, '../../../.tmp/chrome-profile')
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: [
      '--headless=new',
      `--disable-extensions-except=${distDir}`,
      `--load-extension=${distDir}`,
    ],
  })

  let [background] = context.serviceWorkers()
  if (!background) {
    background = await context.waitForEvent('serviceworker')
  }

  const extensionId = background.url().split('/')[2]
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  await expect(page.locator('h1')).toHaveText('Hello World')

  await context.close()
})
