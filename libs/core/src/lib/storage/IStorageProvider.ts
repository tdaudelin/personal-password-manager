import type { EncryptedVault } from '@ppm/shared'

export interface IStorageProvider {
  readVault(): Promise<EncryptedVault | undefined>
  writeVault(vault: EncryptedVault): Promise<void>
  // Note: async — project-plan.md shows sync but async is correct for browser.storage.local
  isConfigured(): Promise<boolean>
  configure(options?: unknown): Promise<void>
  displayName: string
}
