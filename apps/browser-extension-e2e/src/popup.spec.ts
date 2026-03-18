import { test, expect, chromium } from '@playwright/test'
import path from 'path'

const distDir = path.resolve(__dirname, '../../browser-extension/dist')

test('popup loads and shows the setup screen on first launch', async () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const userDataDir = path.resolve(
    __dirname,
    `../../../.tmp/chrome-profile-${id}`,
  )
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: [
      '--headless=new',
      `--disable-extensions-except=${distDir}`,
      `--load-extension=${distDir}`,
    ],
  })

  let [background] = context.serviceWorkers()
  if (!background) background = await context.waitForEvent('serviceworker')

  const extensionId = background.url().split('/')[2]
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  await expect(page.getByText('Create Master Password')).toBeVisible()

  const bodyBox = await page.locator('body').boundingBox()
  expect(bodyBox?.width).toBe(360)
  expect(bodyBox?.height).toBeGreaterThanOrEqual(480)

  await context.close()
})
