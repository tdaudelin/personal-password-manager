import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EncryptedVault } from '@ppm/shared'

// Mock webextension-polyfill before importing LocalStorageProvider
const mockStorage: Record<string, string> = {}

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => {
          return key in mockStorage ? { [key]: mockStorage[key] } : {}
        }),
        set: vi.fn(async (items: Record<string, string>) => {
          Object.assign(mockStorage, items)
        }),
      },
    },
  },
}))

import { LocalStorageProvider } from '../LocalStorageProvider.js'

const sampleVault: EncryptedVault = {
  version: 1,
  kdf: 'argon2id',
  salt: 'abc123',
  iv: 'def456',
  ciphertext: 'encrypted-data',
}

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider

  beforeEach(() => {
    provider = new LocalStorageProvider()
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key]
    }
    vi.clearAllMocks()
  })

  it('readVault returns undefined when storage is empty', async () => {
    const result = await provider.readVault()
    expect(result).toBeUndefined()
  })

  it('readVault returns the vault after writeVault', async () => {
    await provider.writeVault(sampleVault)
    const result = await provider.readVault()
    expect(result).toEqual(sampleVault)
  })

  it('isConfigured returns false when storage is empty', async () => {
    expect(await provider.isConfigured()).toBe(false)
  })

  it('isConfigured returns true after writeVault', async () => {
    await provider.writeVault(sampleVault)
    expect(await provider.isConfigured()).toBe(true)
  })

  it('configure is a no-op', async () => {
    await expect(provider.configure()).resolves.toBeUndefined()
  })

  it('has correct displayName', () => {
    expect(provider.displayName).toBe('Local Storage')
  })
})
