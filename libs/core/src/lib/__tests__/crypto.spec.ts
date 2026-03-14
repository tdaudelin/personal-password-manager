import { describe, it, expect } from 'vitest'
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  generateIV,
} from '../crypto.js'

describe('generateSalt', () => {
  it('returns 16 bytes', () => {
    expect(generateSalt()).toHaveLength(16)
  })

  it('returns different values on each call', () => {
    const a = generateSalt()
    const b = generateSalt()
    expect(a).not.toEqual(b)
  })
})

describe('generateIV', () => {
  it('returns 12 bytes', () => {
    expect(generateIV()).toHaveLength(12)
  })

  it('returns different values on each call', () => {
    const a = generateIV()
    const b = generateIV()
    expect(a).not.toEqual(b)
  })
})

describe('deriveKey', () => {
  it('returns a CryptoKey', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    expect(key).toBeInstanceOf(CryptoKey)
  })

  it('produces different keys for different salts with same password', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const { key: key1 } = await deriveKey('password', salt1)
    const { key: key2 } = await deriveKey('password', salt2)
    // Encrypt the same plaintext with both keys — ciphertexts must differ
    const { iv, ciphertext: ct1 } = await encrypt(key1, 'test')
    const { ciphertext: ct2 } = await encrypt(key2, 'test')
    expect(new Uint8Array(ct1)).not.toEqual(new Uint8Array(ct2))
    // Verify each key is self-consistent
    await expect(decrypt(key1, iv, ct1)).resolves.toBe('test')
  })
})

describe('encrypt / decrypt', () => {
  it('roundtrip produces original plaintext', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('roundtrip-password', salt)
    const plaintext = 'Hello, World!'
    const { iv, ciphertext } = await encrypt(key, plaintext)
    const result = await decrypt(key, iv, ciphertext)
    expect(result).toBe(plaintext)
  })

  it('wrong password fails to decrypt', async () => {
    const salt = generateSalt()
    const { key: correctKey } = await deriveKey('correct-password', salt)
    const { key: wrongKey } = await deriveKey('wrong-password', salt)
    const { iv, ciphertext } = await encrypt(correctKey, 'secret')
    await expect(decrypt(wrongKey, iv, ciphertext)).rejects.toThrow()
  })

  it('tampered ciphertext fails to decrypt', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { iv, ciphertext } = await encrypt(key, 'secret')
    const tampered = new Uint8Array(ciphertext)
    tampered[0] ^= 0xff
    await expect(decrypt(key, iv, tampered.buffer)).rejects.toThrow()
  })
})
