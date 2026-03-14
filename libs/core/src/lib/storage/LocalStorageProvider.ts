import browser from 'webextension-polyfill'
import type { EncryptedVault } from '@ppm/shared'
import type { IStorageProvider } from './IStorageProvider.js'

const VAULT_KEY = 'ppm_vault'

export class LocalStorageProvider implements IStorageProvider {
  readonly displayName = 'Local Storage'

  async readVault(): Promise<EncryptedVault | undefined> {
    const result = await browser.storage.local.get(VAULT_KEY)
    if (!result[VAULT_KEY]) return undefined
    return JSON.parse(result[VAULT_KEY] as string) as EncryptedVault
  }

  async writeVault(vault: EncryptedVault): Promise<void> {
    await browser.storage.local.set({ [VAULT_KEY]: JSON.stringify(vault) })
  }

  async isConfigured(): Promise<boolean> {
    const result = await browser.storage.local.get(VAULT_KEY)
    return VAULT_KEY in result && result[VAULT_KEY] !== undefined
  }

  async configure(_options?: unknown): Promise<void> {
    // No-op — local storage requires no configuration
  }
}
