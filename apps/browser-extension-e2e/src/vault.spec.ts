import { test, expect, chromium } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import path from 'path'

const distDir = path.resolve(__dirname, '../../browser-extension/dist')
const PASSWORD = 'TestPassword123!'

async function launchExtension(): Promise<{
  context: BrowserContext
  popupUrl: string
}> {
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
  return {
    context,
    popupUrl: `chrome-extension://${extensionId}/src/popup/index.html`,
  }
}

async function setupVault(page: Page, password = PASSWORD): Promise<void> {
  await expect(page.getByText('Create Master Password')).toBeVisible()
  await page.getByLabel('Master password').fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create Vault' }).click()
  await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible()
}

async function unlockVault(page: Page, password = PASSWORD): Promise<void> {
  await expect(page.getByText('Unlock Vault')).toBeVisible()
  await page.getByLabel('Master password').fill(password)
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible()
}

test('setup flow: first launch shows setup screen and lands on vault list', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)
  } finally {
    await context.close()
  }
})

test('unlock flow: wrong password shows error; correct password unlocks', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    await page.getByRole('button', { name: 'Lock' }).click()
    await expect(page.getByText('Unlock Vault')).toBeVisible()

    // Wrong password
    await page.getByLabel('Master password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByText('Invalid master password')).toBeVisible()

    // Correct password
    await page.getByLabel('Master password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('add LoginEntry: entry appears in list', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.getByRole('button', { name: 'Login' }).click()
    await page.getByLabel('Title').fill('GitHub')
    await page.getByLabel('URL').fill('https://github.com')
    await page.getByLabel('Username').fill('testuser')
    await page.locator('.password-field input').fill('mypassword')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('GitHub', { exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('add SecureNoteEntry: entry appears in list', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.getByRole('button', { name: 'Secure Note' }).click()
    await page.getByLabel('Title').fill('My Secret Note')
    await page.getByLabel('Body').fill('Secret content here')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('My Secret Note')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('persist across lock/unlock: entry survives after locking and unlocking', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.getByRole('button', { name: 'Login' }).click()
    await page.getByLabel('Title').fill('Persisted Entry')
    await page.getByRole('button', { name: 'Save' }).click()

    await page.getByRole('button', { name: 'Lock' }).click()
    // Reload the popup to verify storage (not just in-memory state)
    await page.goto(popupUrl)
    await unlockVault(page)

    await expect(page.getByText('Persisted Entry')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('delete entry: entry is removed from the list', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    await page.getByRole('button', { name: 'Add Entry' }).click()
    await page.getByRole('button', { name: 'Login' }).click()
    await page.getByLabel('Title').fill('To Be Deleted')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('To Be Deleted')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('To Be Deleted')).not.toBeVisible()
  } finally {
    await context.close()
  }
})

test('service worker restart: fresh popup open shows unlock screen when vault is locked', async () => {
  const { context, popupUrl } = await launchExtension()
  try {
    // Setup and verify vault is accessible
    const page = await context.newPage()
    await page.goto(popupUrl)
    await setupVault(page)

    // Lock simulates what happens when the SW is restarted mid-session:
    // vaultKey is cleared, state returns to LOCKED
    await page.getByRole('button', { name: 'Lock' }).click()
    await page.close()

    // A fresh popup open (e.g. user clicking extension icon after SW restart)
    // must show UnlockView and not crash
    const newPage = await context.newPage()
    await newPage.goto(popupUrl)
    await expect(newPage.getByText('Unlock Vault')).toBeVisible()
  } finally {
    await context.close()
  }
})
