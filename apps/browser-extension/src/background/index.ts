import browser from 'webextension-polyfill'
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  createEntry,
  updateEntry,
  deleteEntry,
  serializeVault,
  deserializeVault,
  LocalStorageProvider,
} from '@ppm/core'
import type { VaultRequest, VaultResponse, VaultEntry } from '@ppm/shared'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type VaultState = 'UNINITIALIZED' | 'LOCKED' | 'UNLOCKED'

const AUTO_LOCK_MS = 5 * 60 * 1000 // 5 minutes

const storage = new LocalStorageProvider()

let state: VaultState = 'UNINITIALIZED'
let vaultKey: CryptoKey | undefined
let vaultKdf: 'argon2id' | 'pbkdf2' = 'argon2id'
let entries: VaultEntry[] = []
let autoLockTimer: ReturnType<typeof setTimeout> | undefined

// ---------------------------------------------------------------------------
// Auto-lock timer
// ---------------------------------------------------------------------------

function resetAutoLock(): void {
  if (autoLockTimer !== undefined) clearTimeout(autoLockTimer)
  autoLockTimer = setTimeout(() => {
    lock()
  }, AUTO_LOCK_MS)
}

function lock(): void {
  vaultKey = undefined
  entries = []
  state = 'LOCKED'
  if (autoLockTimer !== undefined) {
    clearTimeout(autoLockTimer)
    autoLockTimer = undefined
  }
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  const configured = await storage.isConfigured()
  state = configured ? 'LOCKED' : 'UNINITIALIZED'
}

init()

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

browser.runtime.onMessage.addListener((rawMessage): Promise<VaultResponse> => {
  const msg = rawMessage as VaultRequest
  return handleMessage(msg)
})

async function handleMessage(msg: VaultRequest): Promise<VaultResponse> {
  switch (msg.type) {
    case 'GET_STATUS':
      return { type: 'STATUS', state }

    case 'SETUP': {
      if (state !== 'UNINITIALIZED') {
        return { type: 'ERROR', message: 'Vault already initialized' }
      }
      try {
        const salt = generateSalt()
        const { key, kdf } = await deriveKey(msg.masterPassword, salt)
        const emptyPayload = serializeVault([])
        const { iv, ciphertext } = await encrypt(key, emptyPayload)
        await storage.writeVault({
          version: 1,
          kdf,
          salt: bufToBase64(salt),
          iv: bufToBase64(iv),
          ciphertext: bufToBase64(new Uint8Array(ciphertext)),
        })
        vaultKey = key
        vaultKdf = kdf
        entries = []
        state = 'UNLOCKED'
        resetAutoLock()
        return { type: 'OK' }
      } catch (e) {
        return { type: 'ERROR', message: errorMessage(e) }
      }
    }

    case 'UNLOCK': {
      if (state === 'UNINITIALIZED') {
        return { type: 'ERROR', message: 'Vault not initialized' }
      }
      try {
        const vault = await storage.readVault()
        if (!vault)
          return { type: 'ERROR', message: 'No vault found in storage' }
        const salt = base64ToBuf(vault.salt)
        const { key, kdf } = await deriveKey(msg.masterPassword, salt)
        const iv = base64ToBuf(vault.iv)
        const ciphertext = base64ToBuf(vault.ciphertext).buffer
        const plaintext = await decrypt(key, iv, ciphertext)
        entries = deserializeVault(plaintext)
        vaultKey = key
        vaultKdf = kdf
        state = 'UNLOCKED'
        resetAutoLock()
        return { type: 'OK' }
      } catch {
        return { type: 'ERROR', message: 'Invalid master password' }
      }
    }

    case 'LOCK':
      lock()
      return { type: 'OK' }

    case 'GET_ENTRIES':
      if (state !== 'UNLOCKED' || !vaultKey) return { type: 'LOCKED' }
      resetAutoLock()
      return { type: 'ENTRIES', entries }

    case 'ADD_ENTRY': {
      if (state !== 'UNLOCKED' || !vaultKey) return { type: 'LOCKED' }
      try {
        entries = createEntry(entries, msg.entry)
        await persistVault()
        resetAutoLock()
        return { type: 'OK' }
      } catch (e) {
        return { type: 'ERROR', message: errorMessage(e) }
      }
    }

    case 'UPDATE_ENTRY': {
      if (state !== 'UNLOCKED' || !vaultKey) return { type: 'LOCKED' }
      try {
        entries = updateEntry(entries, msg.entry)
        await persistVault()
        resetAutoLock()
        return { type: 'OK' }
      } catch (e) {
        return { type: 'ERROR', message: errorMessage(e) }
      }
    }

    case 'DELETE_ENTRY': {
      if (state !== 'UNLOCKED' || !vaultKey) return { type: 'LOCKED' }
      try {
        entries = deleteEntry(entries, msg.id)
        await persistVault()
        resetAutoLock()
        return { type: 'OK' }
      } catch (e) {
        return { type: 'ERROR', message: errorMessage(e) }
      }
    }

    default:
      return { type: 'ERROR', message: 'Unknown message type' }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistVault(): Promise<void> {
  if (!vaultKey) throw new Error('No vault key in memory')
  const existing = await storage.readVault()
  const salt = existing ? base64ToBuf(existing.salt) : generateSalt()
  const { iv, ciphertext } = await encrypt(vaultKey, serializeVault(entries))
  await storage.writeVault({
    version: 1,
    kdf: vaultKdf,
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
    ciphertext: bufToBase64(new Uint8Array(ciphertext)),
  })
}

function bufToBase64(buf: Uint8Array<ArrayBuffer>): string {
  return btoa(String.fromCharCode(...buf))
}

function base64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
