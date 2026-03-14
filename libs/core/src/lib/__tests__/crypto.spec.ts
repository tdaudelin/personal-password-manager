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

  it('returned key is for AES-GCM', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    expect(key.algorithm.name).toBe('AES-GCM')
  })

  it('key is 256-bit', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256)
  })

  it('key is non-extractable', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    expect(key.extractable).toBe(false)
  })

  it('is deterministic — same password + salt produces a key that decrypts the same ciphertext', async () => {
    const salt = generateSalt()
    const { key: key1 } = await deriveKey('my-password', salt)
    const { key: key2 } = await deriveKey('my-password', salt)
    const { iv, ciphertext } = await encrypt(key1, 'hello')
    // key2 must decrypt what key1 encrypted
    await expect(decrypt(key2, iv, ciphertext)).resolves.toBe('hello')
  })

  it('different salts produce different keys for the same password', async () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    const { key: key1 } = await deriveKey('password', salt1)
    const { key: key2 } = await deriveKey('password', salt2)
    const { iv, ciphertext: ct1 } = await encrypt(key1, 'test')
    // key2 must NOT decrypt what key1 encrypted
    await expect(decrypt(key2, iv, ct1)).rejects.toThrow()
  })

  it('reports kdf as argon2id', async () => {
    const salt = generateSalt()
    const { kdf } = await deriveKey('password', salt)
    expect(kdf).toBe('argon2id')
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

  it('roundtrip works with empty string', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { iv, ciphertext } = await encrypt(key, '')
    await expect(decrypt(key, iv, ciphertext)).resolves.toBe('')
  })

  it('roundtrip works with unicode / special characters', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const plaintext = '🔐 p@$$w0rd! — café naïve résumé'
    const { iv, ciphertext } = await encrypt(key, plaintext)
    await expect(decrypt(key, iv, ciphertext)).resolves.toBe(plaintext)
  })

  it('each encrypt call produces a different IV', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { iv: iv1 } = await encrypt(key, 'same')
    const { iv: iv2 } = await encrypt(key, 'same')
    expect(iv1).not.toEqual(iv2)
  })

  it('wrong password fails to decrypt', async () => {
    const salt = generateSalt()
    const { key: correctKey } = await deriveKey('correct-password', salt)
    const { key: wrongKey } = await deriveKey('wrong-password', salt)
    const { iv, ciphertext } = await encrypt(correctKey, 'secret')
    await expect(decrypt(wrongKey, iv, ciphertext)).rejects.toThrow()
  })

  it('wrong IV fails to decrypt', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { ciphertext } = await encrypt(key, 'secret')
    const wrongIV = generateIV()
    await expect(decrypt(key, wrongIV, ciphertext)).rejects.toThrow()
  })

  it('tampered ciphertext fails to decrypt (GCM authentication)', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { iv, ciphertext } = await encrypt(key, 'secret')
    const tampered = new Uint8Array(ciphertext)
    tampered[0] ^= 0xff
    await expect(decrypt(key, iv, tampered.buffer)).rejects.toThrow()
  })

  it('truncated ciphertext fails to decrypt', async () => {
    const salt = generateSalt()
    const { key } = await deriveKey('password', salt)
    const { iv, ciphertext } = await encrypt(
      key,
      'long enough plaintext to truncate',
    )
    const truncated = ciphertext.slice(0, ciphertext.byteLength - 4)
    await expect(decrypt(key, iv, truncated)).rejects.toThrow()
  })
})
